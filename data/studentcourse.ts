"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getEnrolledCourses() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("User not authenticated");
    const userId = session.user.id;

    const enrollments = await db.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            tutor: {
              include: { user: true },
            },
            category: true,
            reviews: { select: { rating: true } },
            enrollments: { select: { id: true } },
            modules: {
              include: { lessons: { orderBy: { sortOrder: "asc" } } },
            },
          },
        },
        lessonProgress: { orderBy: { updatedAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const enrollmentsToUpdate: string[] = [];

    const mappedEnrollments = enrollments.map((enrollment) => {
      const course = enrollment.course;
      const totalLessons = course.modules.reduce(
        (sum, m) => sum + m.lessons.length,
        0
      );
      const completedLessons = enrollment.lessonProgress.filter(
        (lp) => lp.isCompleted
      ).length;
      const progress =
        totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      if (progress >= 100 && enrollment.status !== "COMPLETED") {
        enrollmentsToUpdate.push(enrollment.id);
      }

      const totalDuration = course.duration || 0;
      const remainingDuration = totalDuration * (1 - progress / 100);
      const timeLeft =
        remainingDuration > 0
          ? `${Math.floor(remainingDuration / 60)}h ${Math.round(
              remainingDuration % 60
            )}m`
          : "Completed";

      const lastAccessedDate =
        enrollment.lessonProgress.length > 0
          ? enrollment.lessonProgress[0].updatedAt
          : enrollment.updatedAt;

      let nextLessonTitle = "All lessons completed";
      const completedLessonIds = new Set(
        enrollment.lessonProgress
          .filter((lp) => lp.isCompleted)
          .map((lp) => lp.lessonId)
      );

      outerLoop: for (const module of course.modules) {
        for (const lesson of module.lessons) {
          if (!completedLessonIds.has(lesson.id)) {
            nextLessonTitle = lesson.title;
            break outerLoop;
          }
        }
      }

      const averageRating =
        course.reviews.length > 0
          ? course.reviews.reduce((sum, r) => sum + r.rating, 0) /
            course.reviews.length
          : 0;

      return {
        id: course.id,
        enrollmentId: enrollment.id,
        title: course.title,
        instructor: course.tutor.user.name,
        instructorAvatar: course.tutor.user.avatar || course.tutor.user.image,
        progress: Math.round(progress),
        totalLessons,
        completedLessons,
        nextLesson: nextLessonTitle,
        timeLeft,
        thumbnail: course.thumbnail,
        difficulty: course.level,
        rating: Number(averageRating.toFixed(1)),
        students: course.enrollments.length,
        category: course.category.name,
        lastAccessed: getTimeAgo(lastAccessedDate),
        certificate: course.certificate || false,
      };
    });

    if (enrollmentsToUpdate.length > 0) {
      await db.enrollment.updateMany({
        where: {
          id: { in: enrollmentsToUpdate },
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      revalidatePath("/");
    }

    return mappedEnrollments;
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    return [];
  }
}

export async function getAvailableCourses() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = session.user.id;

    const enrolledCourseIds = await db.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });

    const enrolledIds = enrolledCourseIds.map((e) => e.courseId);

    const courses = await db.course.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: enrolledIds },
      },
      include: {
        tutor: {
          include: { user: true },
        },
        category: true,
        reviews: { select: { rating: true } },
        enrollments: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return courses.map((course) => {
      const averageRating =
        course.reviews.length > 0
          ? course.reviews.reduce((sum, r) => sum + r.rating, 0) /
            course.reviews.length
          : 0;

      return {
        id: course.id,
        title: course.title,
        instructor: course.tutor.user.name,
        instructorAvatar: course.tutor.user.avatar || course.tutor.user.image,
        price: course.currentPrice || course.price,
        originalPrice: course.basePrice || course.price,
        thumbnail: course.thumbnail,
        difficulty: course.level,
        rating: Number(averageRating.toFixed(1)),
        students: course.enrollments.length,
        duration: course.duration
          ? `${Math.floor(course.duration / 60)} hours`
          : "N/A",
        lessons: course.totalLessons,
        category: course.category.name,
        bestseller: course.enrollments.length > 100,
        trending: course.enrollments.length > 50,
        newCourse: isNewCourse(course.createdAt),
        certificate: course.certificate || false,
      };
    });
  } catch (error) {
    console.error("Error fetching available courses:", error);
    return [];
  }
}

// 🧠 Get completed courses with grades and certificates
export async function getCompletedCourses() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = session.user.id;

    const completedEnrollments = await db.enrollment.findMany({
      where: { userId, status: "COMPLETED" },
      include: {
        course: {
          include: {
            tutor: { include: { user: true } },
            category: true,
            reviews: { select: { rating: true } },
            certificates: {
              where: { userId },
              select: { certificateId: true },
            },
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    return completedEnrollments.map((enrollment) => {
      const course = enrollment.course;
      const averageRating =
        course.reviews.length > 0
          ? course.reviews.reduce((sum, r) => sum + r.rating, 0) /
            course.reviews.length
          : 0;

      const finalGrade =
        enrollment.progress >= 95
          ? "A+"
          : enrollment.progress >= 90
          ? "A"
          : enrollment.progress >= 85
          ? "B+"
          : enrollment.progress >= 80
          ? "B"
          : "C";

      return {
        id: course.id,
        enrollmentId: enrollment.id,
        title: course.title,
        instructor: course.tutor.user.name,
        instructorAvatar: course.tutor.user.avatar || course.tutor.user.image,
        completedDate: enrollment.completedAt
          ? getTimeAgo(enrollment.completedAt)
          : "Recently",
        thumbnail: course.thumbnail,
        difficulty: course.level,
        rating: Number(averageRating.toFixed(1)),
        finalGrade,
        certificate: course.certificates.length > 0,
        certificateId:
          course.certificates.length > 0
            ? course.certificates[0].certificateId
            : undefined,
        category: course.category.name,
      };
    });
  } catch (error) {
    console.error("Error fetching completed courses:", error);
    return [];
  }
}

export async function updateLessonProgress(
  lessonId: string,
  enrollmentId: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("User not authenticated");
    const userId = session.user.id;

    // Check if lesson progress already exists
    const existingProgress = await db.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (existingProgress) {
      // Update existing progress
      await db.lessonProgress.update({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
        data: {
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    } else {
      // Create new progress record
      await db.lessonProgress.create({
        data: {
          userId,
          lessonId,
          enrollmentId,
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    }

    // Calculate overall progress and check if course should be marked as completed
    const wasCompleted = await updateEnrollmentProgress(enrollmentId, userId);

    if (wasCompleted) {
      revalidatePath("/");
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating lesson progress:", error);
    return { success: false, error: "Failed to update progress" };
  }
}

async function updateEnrollmentProgress(
  enrollmentId: string,
  userId: string
): Promise<boolean> {
  try {
    // Get enrollment with all lesson progress
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
        lessonProgress: true,
      },
    });

    if (!enrollment) return false;

    // Calculate progress
    const totalLessons = enrollment.course.modules.reduce(
      (sum, m) => sum + m.lessons.length,
      0
    );
    const completedLessons = enrollment.lessonProgress.filter(
      (lp) => lp.isCompleted
    ).length;
    const progress =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Update enrollment progress
    const updateData: any = {
      progress: Math.round(progress),
      updatedAt: new Date(),
    };

    let wasJustCompleted = false;

    // If progress is 100%, mark as completed
    if (progress >= 100 && enrollment.status !== "COMPLETED") {
      updateData.status = "COMPLETED";
      updateData.completedAt = new Date();
      wasJustCompleted = true;
    }

    await db.enrollment.update({
      where: { id: enrollmentId },
      data: updateData,
    });

    return wasJustCompleted;
  } catch (error) {
    console.error("Error updating enrollment progress:", error);
    return false;
  }
}

// ⏳ Helper: Convert a date to "time ago" format
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  if (diffInDays < 30)
    return `${Math.floor(diffInDays / 7)} week${
      Math.floor(diffInDays / 7) > 1 ? "s" : ""
    } ago`;
  return `${Math.floor(diffInDays / 30)} month${
    Math.floor(diffInDays / 30) > 1 ? "s" : ""
  } ago`;
}

// 🆕 Helper: Check if course is new (created in last 30 days)
function isNewCourse(createdAt: Date): boolean {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(createdAt).getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  return diffInDays <= 30;
}
