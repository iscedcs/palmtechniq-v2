"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getAverageRating } from "@/lib/reviews";

export async function getTutorCourses() {
  try {
    const session = await auth();

    if (!session?.user?.id) return [];

    const tutor = await db.tutor.findFirst({
      where: { userId: session.user.id },
    });

    if (!tutor) return [];

    const courses = await db.course.findMany({
      where: { tutorId: tutor.id },
      include: {
        modules: {
          include: { lessons: true },
        },
        enrollments: true,
        reviews: { where: { isPublic: true } },
        transactions: { where: { status: "COMPLETED" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return courses.map((course: any) => {
      const lessonsCount = course.modules.reduce(
        (sum: any, m: any) => sum + m.lessons.length,
        0,
      );

      const duration = course.modules.reduce(
        (sum: any, m: any) =>
          sum +
          m.lessons.reduce((lsum: any, l: any) => lsum + (l.duration || 0), 0),
        0,
      );

      const studentsCount = course.enrollments.length;
      const avgRating = getAverageRating(course.reviews);

      const earnings =
        (course.transactions?.reduce(
          (sum: any, tx: any) => sum + (tx.amount || 0),
          0,
        ) ?? 0) / 100;

      // --- 🧮 Compute growth (month over month) ---
      const now = new Date();
      const lastMonth = new Date();
      lastMonth.setDate(now.getDate() - 30);

      const recentEnrollments = course.enrollments.filter(
        (e: any) => e.enrolledAt >= lastMonth,
      ).length;

      const previousEnrollments = course.enrollments.length - recentEnrollments;

      const growth =
        previousEnrollments > 0
          ? Math.round(
              ((recentEnrollments - previousEnrollments) /
                previousEnrollments) *
                100,
            )
          : recentEnrollments > 0
            ? 100
            : 0;

      // --- 🧮 Compute completion rate ---
      // If your Enrollment model has `progress` or `completedLessons`
      // Adjust logic accordingly.
      const completionRate =
        course.enrollments.length > 0
          ? Math.round(
              course.enrollments.reduce(
                (sum: any, e: any) => sum + (e.progress || 0),
                0,
              ) / course.enrollments.length,
            )
          : 0;

      return {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail ?? null,
        status: course.status.toLowerCase() as "draft" | "published",
        isPopular: studentsCount > 1000,
        lessonsCount,
        duration,
        studentsCount,
        avgRating,
        earnings,
        growth,
        completionRate,
        updatedAt: course.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    console.error("❌ Error fetching tutor courses:", error);
    return [];
  }
}
