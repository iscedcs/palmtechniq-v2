import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getPublicCourses() {
  return db.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      category: true,
      tags: true,
      tutor: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCourseById(courseId: string) {
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        tutor: {
          include: {
            user: true,
            Course: true,
          },
        },
        category: true,
        tags: true,
        modules: {
          include: {
            lessons: true,
            quizzes: true,
            resources: true,
          },
        },
        reviews: {
          include: {
            user: true,
          },
        },
        enrollments: true,
      },
    });
    if (!course) return null;

    return {
      ...course,
      tags: course.tags?.map((t) => t.name) || [],
      learningOutcomes: course.outcomes || [],
    };
  } catch (error) {
    console.error("Error fetching course by ID:", error);
    return null;
  }
}
export async function getCourseWithModules(courseId: string) {
  try {
    const session = await auth();
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        modules: {
          include: {
            lessons: {
              orderBy: { sortOrder: "asc" },
              include: {
                progress: session?.user.id
                  ? {
                      where: { userId: session.user.id },
                      select: { isCompleted: true, updatedAt: true },
                    }
                  : false,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        category: true,
      },
    });

    if (!course) return null;
    const allLessons = course.modules.flatMap((m) => m.lessons);

    const lastCompleted = allLessons
      .filter((l) => l.progress.length > 0 && l.progress[0].isCompleted)
      .pop();

    let resumeLessonId = allLessons[0]?.id; // fallback: first lesson
    if (lastCompleted) {
      const idx = allLessons.findIndex((l) => l.id === lastCompleted.id);
      if (idx >= 0 && idx + 1 < allLessons.length) {
        resumeLessonId = allLessons[idx + 1].id;
      } else {
        resumeLessonId = lastCompleted.id; // all done → stay on last
      }
    }

    const completedLessons = allLessons.filter(
      (lesson) => lesson.progress?.[0]?.isCompleted
    ).length;

    const totalLessons = allLessons.length;
    const progress =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return {
      ...course,
      progress,
      resumeLessonId,
      modules: course.modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => ({
          ...l,
          isCompleted: l.progress?.[0]?.isCompleted ?? false,
        })),
      })),
    };
  } catch (error) {
    console.error("❌ Error fetching course with modules:", error);
    return null;
  }
}
// Add this to your existing course-actions.ts file
export async function checkUserEnrollment(courseId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return false;

    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId,
        status: { in: ["ACTIVE", "COMPLETED"] } // Check both statuses
      }
    });

    return !!enrollment;
  } catch (error) {
    console.error("Error checking user enrollment:", error);
    return false;
  }
}