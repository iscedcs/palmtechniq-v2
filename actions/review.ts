"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reviewSchema, updateReviewSchema } from "@/schemas";
import { z } from "zod";
import { getAverageRating } from "@/lib/reviews";
import { notify } from "@/lib/notify";

const EDIT_WINDOW_DAYS = 7;

const canEditReview = (createdAt: Date) => {
  const cutoff = new Date(createdAt);
  cutoff.setDate(cutoff.getDate() + EDIT_WINDOW_DAYS);
  return new Date() <= cutoff;
};

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

export async function createReview(input: z.infer<typeof reviewSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const validated = reviewSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid review" };
  }

  const isEnrolled = await ensureEnrolled(
    session.user.id,
    validated.data.courseId
  );
  if (!isEnrolled) {
    return { error: "Only enrolled students can leave a review" };
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
      tutor: { select: { userId: true, user: { select: { name: true } } } },
      title: true,
    },
  });

  const review = await db.review.create({
    data: {
      userId: session.user.id,
      courseId: validated.data.courseId,
      rating: validated.data.rating,
      comment: validated.data.comment,
      isPublic: true,
      reviewerName: session.user.name || "Student",
      tutorName: course?.tutor?.user?.name || "Tutor",
    },
  });

  try {
    if (course?.tutor?.userId) {
      notify.user(course.tutor.userId, {
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
  } catch (error) {
    console.warn("⚠️ Socket.IO not initialized yet, skipping emit");
  }

  return { review };
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
    return { error: "Review can no longer be edited" };
  }

  const updated = await db.review.update({
    where: { id: review.id },
    data: {
      rating: validated.data.rating,
      comment: validated.data.comment,
    },
  });

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
    return { error: "Review can no longer be deleted" };
  }

  await db.review.delete({ where: { id: reviewId } });
  return { success: true };
}

export async function getCourseReviews(courseId: string) {
  const reviews = await db.review.findMany({
    where: { courseId, isPublic: true },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, avatar: true } },
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

export async function getTutorReviewsOverview() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
  });
  if (!tutor) return { error: "Tutor account not found" };

  const reviews = await db.review.findMany({
    where: { course: { tutorId: tutor.id }, isPublic: true },
    include: {
      user: { select: { name: true, avatar: true, image: true } },
      course: { select: { title: true } },
      reactions: { select: { type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalReviews = reviews.length;
  const averageRating = getAverageRating(reviews);
  const respondedCount = reviews.filter((review) => review.responseText).length;
  const pendingReplies = totalReviews - respondedCount;
  const responseRate =
    totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length,
  }));

  const now = new Date();
  const ratingTrends = Array.from({ length: 6 }).map((_, index) => {
    const monthOffset = 5 - index;
    const start = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1);
    const monthlyReviews = reviews.filter(
      (review) => review.createdAt >= start && review.createdAt < end
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

  const recentCount = reviews.filter((r) => r.createdAt >= thirtyDaysAgo).length;
  const previousCount = reviews.filter(
    (r) => r.createdAt >= sixtyDaysAgo && r.createdAt < thirtyDaysAgo
  ).length;

  const recentGrowth =
    previousCount > 0
      ? Math.round(((recentCount - previousCount) / previousCount) * 100)
      : recentCount > 0
        ? 100
        : 0;

  return {
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
    where: { id: reviewId, course: { tutorId: tutor.id } },
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
  type: "HELPFUL" | "LIKE" | "REPORT"
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!reviewId) return { error: "Review ID is required" };

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      course: {
        select: {
          title: true,
          tutor: { select: { userId: true } },
        },
      },
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
    select: { id: true },
  });

  if (existing) {
    await db.reviewReaction.delete({
      where: { reviewId_userId_type: { reviewId, userId: session.user.id, type } },
    });
    return { added: false };
  }

  await db.reviewReaction.create({
    data: {
      reviewId,
      userId: session.user.id,
      type,
    },
  });

  try {
    const actorId = session.user.id;
    const actorName = session.user.name || "Someone";
    if (review.userId && review.userId !== actorId) {
      notify.user(review.userId, {
        type: "info",
        title: "New reaction on your review",
        message: `${actorName} reacted to your review on "${review.course.title}".`,
        actionUrl: `/courses/${review.courseId}`,
        actionLabel: "View Course",
        metadata: {
          category: "review_reacted",
          reviewId,
          courseId: review.courseId,
          reactionType: type,
        },
      });
    }

    const tutorUserId = review.course?.tutor?.userId;
    if (tutorUserId && tutorUserId !== actorId) {
      notify.user(tutorUserId, {
        type: "info",
        title: "Course review reaction",
        message: `${actorName} added a ${type.toLowerCase()} reaction to a review for "${review.course.title}".`,
        actionUrl: `/tutor/reviews?reviewId=${reviewId}`,
        actionLabel: "View Reviews",
        metadata: {
          category: "course_review_reacted",
          reviewId,
          courseId: review.courseId,
          reactionType: type,
        },
      });
    }
  } catch (error) {
    console.warn("⚠️ Socket.IO not initialized yet, skipping emit");
  }

  return { added: true };
}
