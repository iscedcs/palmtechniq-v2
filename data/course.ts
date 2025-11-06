import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getPublicCourses() {
  const courses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      category: true,
      tags: true,
      reviews: { include: { user: true } },
      _count: { select: { enrollments: true } },
      tutor: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return courses.map((course) => {
    const discount =
      course.basePrice && course.currentPrice
        ? Math.round(
            ((course.basePrice - course.currentPrice) / course.basePrice) * 100
          )
        : 0;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      level: course.level,
      tutor: course.tutor,
      tags: course.tags.map((t) => ({ id: t.id, name: t.name })),
      averageRating: course.reviews?.length
        ? course.reviews.reduce((a, r) => a + (r.rating ?? 0), 0) /
          course.reviews.length
        : 0,
      totalStudents: course._count.enrollments,
      enrollments: course._count.enrollments,
      price: course.price ?? 0,
      currentPrice: course.currentPrice ?? 0,
      basePrice: course.basePrice ?? 0,
      previewVideo: course.previewVideo ?? "",
      groupBuyingEnabled: course.groupBuyingEnabled,
      demandLevel: course.demandLevel ?? "medium",
      discount,
      duration: course.duration ?? 0,
      flashSaleEnd: course.flashSaleEnd,
      isFlashSale: course.isFlashSale,
    } satisfies CourseItem;
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
            quiz: true,
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
            quiz: true,
            lessons: {
              orderBy: { sortOrder: "asc" },
              include: {
                resources: true,
                progress: session?.user.id
                  ? {
                      where: { userId: session.user.id },
                      select: { isCompleted: true, updatedAt: true },
                    }
                  : false,
              },
            },
            resources: true,
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

    let resumeLessonId = allLessons[0]?.id;
    if (lastCompleted) {
      const idx = allLessons.findIndex((l) => l.id === lastCompleted.id);
      if (idx >= 0 && idx + 1 < allLessons.length) {
        resumeLessonId = allLessons[idx + 1].id;
      } else {
        resumeLessonId = lastCompleted.id;
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

    const modules = await Promise.all(
      course.modules.map(async (module, idx, arr) => {
        const allLessonsCompleted = module.lessons.every(
          (l) => l.progress?.[0]?.isCompleted
        );

        let quizPassed = true;
        if (module.quiz) {
          const attempt = await db.quizAttempt.findFirst({
            where: {
              quizId: module.quiz.id,
              userId: session?.user.id,
              isCompleted: true,
              score: {
                gte: module.quiz.passingScore || 70,
              },
            },
          });
          quizPassed = !!attempt;
        }

        const previousModules = arr.slice(0, idx);
        const previousCompleted = previousModules.every(
          (m) =>
            m.lessons.every((l) => l.progress?.[0]?.isCompleted) &&
            (!m.quiz || (m.quiz && quizPassed))
        );

        const isLocked = idx > 0 && !previousCompleted;

        const lessonsWithLocking = module.lessons.map((lesson, lidx) => {
          const previousLesson = module.lessons[lidx - 1];
          const isLessonLocked =
            isLocked ||
            (lidx > 0 && !previousLesson?.progress?.[0]?.isCompleted);

          return {
            ...lesson,
            isCompleted: lesson.progress?.[0]?.isCompleted ?? false,
            isLocked: isLessonLocked,
          };
        });

        return {
          ...module,
          isLocked,
          lessons: lessonsWithLocking,
        };
      })
    );

    return {
      ...course,
      progress,
      resumeLessonId,
      modules,
      // modules: course.modules.map((m) => ({
      //   ...m,
      //   lessons: m.lessons.map((l) => ({
      //     ...l,
      //     isCompleted: l.progress?.[0]?.isCompleted ?? false,
      //   })),
      // })),
    };
  } catch (error) {
    console.error("❌ Error fetching course with modules:", error);
    return null;
  }
}

export async function checkUserEnrollment(courseId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return false;

    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
    });

    return !!enrollment;
  } catch (error) {
    console.error("Error checking user enrollment:", error);
    return false;
  }
}
