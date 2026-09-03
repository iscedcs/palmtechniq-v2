"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  reviewSchema,
  tutorDirectReviewSchema,
  updateReviewSchema,
} from "@/schemas";
import { z } from "zod";
import { getAverageRating } from "@/lib/reviews";
import { notify } from "@/lib/notify";
import { trackEvent, PLATFORM_EVENTS } from "@/lib/analytics/track";

const EDIT_WINDOW_DAYS = 7;

const canEditReview = (createdAt: Date) => {
  const cutoff = new Date(createdAt);
  cutoff.setDate(cutoff.getDate() + EDIT_WINDOW_DAYS);
  return new Date() <= cutoff;
};

/**
 * Recalculates and updates a tutor's average rating and total reviews.
 */
async function recalculateTutorRating(tutorId: string) {
  try {
    const reviews = await db.review.findMany({
      where: {
        OR: [{ tutorId }, { course: { tutorId } }],
        isPublic: true,
      },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0) / totalReviews
            ).toFixed(2),
          )
        : 0;

    await db.tutor.update({
      where: { id: tutorId },
      data: {
        totalReviews,
        averageRating,
      },
    });
  } catch (error) {
    console.error("Failed to recalculate tutor rating:", error);
  }
}

const ensureEnrolled = async (userId: string, courseId: string) => {
  const enrollment = await db.enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    select: { id: true },
  });
  return Boolean(enrollment);
};

/**
 * Standard course review submission
 */
export async function createReview(input: z.input<typeof reviewSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const validated = reviewSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid review" };
  }

  if (!validated.data.courseId) {
    return { error: "Course ID is required" };
  }

  const isEnrolled = await ensureEnrolled(
    session.user.id,
    validated.data.courseId,
  );
  if (!isEnrolled) {
    return { error: "Only enrolled students can leave a course review" };
  }

  const existing = await db.review.findFirst({
    where: { userId: session.user.id, courseId: validated.data.courseId },
    select: { id: true },
  });
  if (existing) {
    return { error: "You have already reviewed this course" };
  }

  const course = await db.course.findUnique({
    where: { id: validated.data.courseId },
    select: {
      id: true,
      tutorId: true,
      tutor: { select: { id: true, userId: true, user: { select: { name: true } } } },
      title: true,
    },
  });

  const review = await db.review.create({
    data: {
      userId: session.user.id,
      courseId: validated.data.courseId,
      tutorId: course?.tutor?.id || null,
      reviewType: "COURSE",
      rating: validated.data.rating,
      comment: validated.data.comment,
      communicationRating: validated.data.communicationRating,
      clarityRating: validated.data.clarityRating,
      expertiseRating: validated.data.expertiseRating,
      isPublic: true,
      isVerifiedStudent: true,
      verifiedContext: `Verified Course Student · ${course?.title || "Course"}`,
      reviewerName: session.user.name || "Student",
      tutorName: course?.tutor?.user?.name || "Tutor",
    },
  });

  if (course?.tutor?.id) {
    await recalculateTutorRating(course.tutor.id);
  }

  if (course?.tutor?.userId) {
    await notify.user(course.tutor.userId, {
      type: "info",
      title: "New Course Review",
      message: `You received a ${review.rating}-star review for "${course.title}".`,
      actionUrl: "/tutor/reviews",
      actionLabel: "View Reviews",
      metadata: {
        category: "course_reviewed",
        courseId: validated.data.courseId,
        reviewId: review.id,
      },
    });
  }

  trackEvent(PLATFORM_EVENTS.REVIEW_SUBMITTED, {
    userId: session.user.id,
    entityType: "course",
    entityId: validated.data.courseId,
    metadata: { rating: validated.data.rating, reviewId: review.id },
  });

  return { review };
}

/**
 * Direct Tutor & Program Student Review Submission
 */
export async function createTutorDirectReview(
  input: z.input<typeof tutorDirectReviewSchema>,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in to leave a review." };

  const validated = tutorDirectReviewSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid review data" };
  }

  const {
    tutorId,
    courseId,
    programId,
    reviewType,
    verifiedContext,
    rating,
    comment,
    communicationRating,
    clarityRating,
    expertiseRating,
  } = validated.data;

  // Resolve tutor
  const tutor = await db.tutor.findFirst({
    where: {
      OR: [
        { id: tutorId },
        { userId: tutorId },
        { referralCode: tutorId },
        { user: { username: tutorId } },
      ],
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  if (!tutor) {
    return { error: "Tutor profile not found." };
  }

  // Prevent tutor from reviewing themselves
  if (tutor.userId === session.user.id) {
    return { error: "You cannot review your own tutor profile." };
  }

  // Check student role / status
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true },
  });

  // Verify learning context
  let finalContext = verifiedContext || "Verified Student";
  let isVerified = true;

  if (programId) {
    const program = await db.professionalProgram.findUnique({
      where: { id: programId },
      select: { name: true },
    });
    if (program) {
      finalContext = `Verified Program Student · ${program.name}`;
    }
  } else if (courseId) {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { title: true },
    });
    if (course) {
      finalContext = `Verified Course Student · ${course.title}`;
    }
  } else {
    // Check if the student has enrolled in any courses or programs with this tutor
    const [enrolledCourse, enrolledCohort] = await Promise.all([
      db.enrollment.findFirst({
        where: {
          userId: session.user.id,
          course: { tutorId: tutor.id },
          status: { in: ["ACTIVE", "COMPLETED"] },
        },
        include: { course: { select: { title: true } } },
      }),
      db.programCohort.findFirst({
        where: {
          leadInstructorId: tutor.userId,
          enrollments: {
            some: {
              userId: session.user.id,
              status: { in: ["ACTIVE", "COMPLETED"] },
            },
          },
        },
        include: { program: { select: { name: true } } },
      }),
    ]);

    if (enrolledCohort) {
      finalContext = `Verified Program Student · ${enrolledCohort.program.name}`;
    } else if (enrolledCourse) {
      finalContext = `Verified Course Student · ${enrolledCourse.course.title}`;
    } else if (currentUser?.role === "STUDENT") {
      finalContext = "Verified PalmTechnIQ Student";
    }
  }

  // Check for existing review
  const existingReview = await db.review.findFirst({
    where: {
      userId: session.user.id,
      tutorId: tutor.id,
      ...(courseId ? { courseId } : {}),
      ...(programId ? { programId } : {}),
    },
  });

  let review;
  if (existingReview) {
    // Update existing review
    review = await db.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        comment: comment.trim(),
        communicationRating,
        clarityRating,
        expertiseRating,
        reviewType,
        verifiedContext: finalContext,
        isVerifiedStudent: isVerified,
      },
    });
  } else {
    // Create new review
    review = await db.review.create({
      data: {
        userId: session.user.id,
        tutorId: tutor.id,
        courseId: courseId || null,
        programId: programId || null,
        reviewType,
        rating,
        comment: comment.trim(),
        communicationRating,
        clarityRating,
        expertiseRating,
        isPublic: true,
        isVerifiedStudent: isVerified,
        verifiedContext: finalContext,
        reviewerName: session.user.name || "Student",
        tutorName: tutor.user.name || "Tutor",
        reviewerRole: currentUser?.role || "STUDENT",
      },
    });
  }

  // Recalculate tutor aggregates
  await recalculateTutorRating(tutor.id);

  // Notify tutor
  await notify.user(tutor.userId, {
    type: "info",
    title: "New Student Review Received",
    message: `${session.user.name || "A student"} left you a ${rating}-star review!`,
    actionUrl: "/tutor/reviews",
    actionLabel: "View Reviews",
    metadata: {
      category: "tutor_reviewed",
      tutorId: tutor.id,
      reviewId: review.id,
    },
  });

  return { success: true, review };
}

export async function updateReview(input: z.infer<typeof updateReviewSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const validated = updateReviewSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid review" };
  }

  const review = await db.review.findUnique({
    where: { id: validated.data.reviewId },
  });
  if (!review) return { error: "Review not found" };
  if (review.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }
  if (!canEditReview(review.createdAt)) {
    return { error: "Review can no longer be edited (7-day window passed)" };
  }

  const updated = await db.review.update({
    where: { id: review.id },
    data: {
      rating: validated.data.rating,
      comment: validated.data.comment,
      communicationRating: validated.data.communicationRating,
      clarityRating: validated.data.clarityRating,
      expertiseRating: validated.data.expertiseRating,
    },
  });

  if (review.tutorId) {
    await recalculateTutorRating(review.tutorId);
  }

  return { review: updated };
}

export async function deleteReview(reviewId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!reviewId) return { error: "Review ID is required" };

  const review = await db.review.findUnique({
    where: { id: reviewId },
  });
  if (!review) return { error: "Review not found" };
  if (review.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }
  if (!canEditReview(review.createdAt)) {
    return { error: "Review can no longer be deleted (7-day window passed)" };
  }

  await db.review.delete({ where: { id: reviewId } });

  if (review.tutorId) {
    await recalculateTutorRating(review.tutorId);
  }

  return { success: true };
}

export async function getCourseReviews(courseId: string) {
  const reviews = await db.review.findMany({
    where: { courseId, isPublic: true },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, avatar: true, image: true } },
    },
  });

  return { reviews };
}

export async function getMyReview(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) return { review: null };

  const review = await db.review.findFirst({
    where: { courseId, userId: session.user.id },
  });

  return { review };
}

/**
 * Public Tutor Profile and Review Form Context
 */
export async function getTutorPublicReviewProfile(tutorIdentifier: string) {
  const session = await auth();

  const tutor = await db.tutor.findFirst({
    where: {
      OR: [
        { id: tutorIdentifier },
        { userId: tutorIdentifier },
        { referralCode: tutorIdentifier },
        { user: { username: tutorIdentifier } },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          avatar: true,
          role: true,
        },
      },
      Course: {
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          level: true,
        },
      },
    },
  });

  if (!tutor) {
    return { error: "Tutor not found", tutor: null };
  }

  // Find cohorts where this tutor is the lead instructor
  const leadCohorts = await db.programCohort.findMany({
    where: { leadInstructorId: tutor.userId },
    include: {
      program: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  // Recent public reviews for this tutor
  const reviews = await db.review.findMany({
    where: {
      OR: [{ tutorId: tutor.id }, { course: { tutorId: tutor.id } }],
      isPublic: true,
    },
    include: {
      user: { select: { name: true, image: true, avatar: true } },
      course: { select: { title: true } },
      program: { select: { name: true } },
      reactions: { select: { type: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number(
          (
            reviews.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0) / totalReviews
          ).toFixed(1),
        )
      : tutor.averageRating || 0;

  // If user is logged in, find their existing review and student relationship options
  let userReview = null;
  let studentContexts: {
    type: "PROGRAM" | "COURSE" | "DIRECT";
    id: string;
    label: string;
    sublabel?: string;
  }[] = [
    {
      type: "DIRECT",
      id: "general",
      label: "General Mentorship & Tutoring",
      sublabel: "Platform Student Review",
    },
  ];

  let isOwnProfile = false;
  let isStudent = false;

  if (session?.user?.id) {
    isOwnProfile = tutor.userId === session.user.id;
    isStudent = session.user.role === "STUDENT";

    userReview = await db.review.findFirst({
      where: {
        userId: session.user.id,
        OR: [{ tutorId: tutor.id }, { course: { tutorId: tutor.id } }],
      },
    });

    // Check course enrollments with this tutor
    const courseEnrollments = await db.enrollment.findMany({
      where: {
        userId: session.user.id,
        course: { tutorId: tutor.id },
      },
      include: {
        course: { select: { id: true, title: true } },
      },
    });

    for (const enr of courseEnrollments) {
      studentContexts.push({
        type: "COURSE",
        id: enr.course.id,
        label: enr.course.title,
        sublabel: "Enrolled Course",
      });
    }

    // Check program cohort enrollments with this tutor
    const programEnrollments = await db.programEnrollment.findMany({
      where: {
        userId: session.user.id,
        cohort: { leadInstructorId: tutor.userId },
      },
      include: {
        program: { select: { id: true, name: true } },
        cohort: { select: { displayName: true } },
      },
    });

    for (const prog of programEnrollments) {
      studentContexts.push({
        type: "PROGRAM",
        id: prog.program.id,
        label: prog.program.name,
        sublabel: prog.cohort.displayName,
      });
    }
  }

  return {
    tutor: {
      id: tutor.id,
      userId: tutor.userId,
      name: tutor.user.name || "Tutor",
      username: tutor.user.username || null,
      avatar: tutor.user.avatar || tutor.user.image || null,
      title: tutor.title,
      expertise: tutor.expertise,
      experience: tutor.experience,
      totalReviews,
      averageRating,
      isVerified: tutor.isVerified,
      referralCode: tutor.referralCode,
      courses: tutor.Course,
      programs: leadCohorts.map((c: any) => ({
        id: c.program.id,
        name: c.program.name,
        slug: c.program.slug,
        cohort: c.displayName,
      })),
    },
    reviews,
    userReview,
    studentContexts,
    isOwnProfile,
    isStudent,
  };
}

export async function getTutorReviewsOverview() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
    include: { user: { select: { username: true } } },
  });
  if (!tutor) return { error: "Tutor account not found" };

  const reviews = await db.review.findMany({
    where: {
      OR: [{ tutorId: tutor.id }, { course: { tutorId: tutor.id } }],
      isPublic: true,
    },
    include: {
      user: { select: { name: true, avatar: true, image: true } },
      course: { select: { title: true } },
      program: { select: { name: true } },
      reactions: { select: { type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalReviews = reviews.length;
  const averageRating = getAverageRating(reviews);
  const respondedCount = reviews.filter(
    (review: any) => review.responseText,
  ).length;
  const pendingReplies = totalReviews - respondedCount;
  const responseRate =
    totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review: any) => review.rating === stars).length,
  }));

  const now = new Date();
  const ratingTrends = Array.from({ length: 6 }).map((_, index) => {
    const monthOffset = 5 - index;
    const start = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() - monthOffset + 1,
      1,
    );
    const monthlyReviews = reviews.filter(
      (review: any) => review.createdAt >= start && review.createdAt < end,
    );
    return {
      month: start.toLocaleString("default", { month: "short" }),
      rating: Number(getAverageRating(monthlyReviews).toFixed(1)),
    };
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const recentCount = reviews.filter(
    (r: any) => r.createdAt >= thirtyDaysAgo,
  ).length;
  const previousCount = reviews.filter(
    (r: any) => r.createdAt >= sixtyDaysAgo && r.createdAt < thirtyDaysAgo,
  ).length;

  const recentGrowth =
    previousCount > 0
      ? Math.round(((recentCount - previousCount) / previousCount) * 100)
      : recentCount > 0
        ? 100
        : 0;

  return {
    tutorId: tutor.id,
    userId: tutor.userId,
    username: tutor.user?.username ?? null,
    referralCode: tutor.referralCode,
    reviews,
    averageRating,
    totalReviews,
    ratingDistribution,
    ratingTrends,
    responseRate,
    pendingReplies,
    recentGrowth,
  };
}

export async function respondToReview(reviewId: string, responseText: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!responseText || responseText.trim().length < 3) {
    return { error: "Response must be at least 3 characters" };
  }

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
  });
  if (!tutor) return { error: "Tutor account not found" };

  const review = await db.review.findFirst({
    where: {
      id: reviewId,
      OR: [{ tutorId: tutor.id }, { course: { tutorId: tutor.id } }],
    },
  });
  if (!review) return { error: "Review not found" };

  const updated = await db.review.update({
    where: { id: review.id },
    data: {
      responseText: responseText.trim(),
      respondedAt: new Date(),
    },
  });

  return { review: updated };
}

export async function toggleReviewReaction(
  reviewId: string,
  type: "HELPFUL" | "LIKE" | "REPORT",
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!reviewId) return { error: "Review ID is required" };

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      userId: true,
    },
  });
  if (!review) return { error: "Review not found" };

  const existing = await db.reviewReaction.findUnique({
    where: {
      reviewId_userId_type: {
        reviewId,
        userId: session.user.id,
        type,
      },
    },
  });

  if (existing) {
    await db.reviewReaction.delete({
      where: {
        reviewId_userId_type: {
          reviewId,
          userId: session.user.id,
          type,
        },
      },
    });
    return { status: "removed", added: false };
  }

  await db.reviewReaction.create({
    data: {
      reviewId,
      userId: session.user.id,
      type,
    },
  });

  return { status: "added", added: true };
}
