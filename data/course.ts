import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getAverageRating } from "@/lib/reviews";

export async function getPublicCourses() {
  const courses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      category: true,
      tags: true,
      reviews: { where: { isPublic: true }, include: { user: true } },
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
      averageRating: getAverageRating(course.reviews),
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
        groupTiers: { orderBy: { size: "asc" } },
        modules: {
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: {
              orderBy: { sortOrder: "asc" },
              include: { quiz: true },
            },
            resources: true,
          },
        },

        reviews: {
          where: { isPublic: true },
          include: {
            user: true,
            reactions: { select: { type: true } },
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
                resources: true,
                quiz: true,
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
    const lessonQuizIds = allLessons
      .map((lesson) => lesson.quiz?.id)
      .filter((id): id is string => Boolean(id));
    const quizAttempts = session?.user.id
      ? await db.quizAttempt.findMany({
          where: {
            userId: session.user.id,
            quizId: { in: lessonQuizIds },
            passed: true,
          },
          select: { quizId: true },
        })
      : [];
    const passedQuizIds = new Set(quizAttempts.map((attempt) => attempt.quizId));

    const moduleTasks = session?.user.id
      ? await db.task.findMany({
          where: {
            moduleId: { in: course.modules.map((m) => m.id) },
            isActive: true,
          },
          orderBy: { createdAt: "asc" },
          include: {
            submissions: {
              where: { userId: session.user.id },
              select: { status: true },
            },
          },
        })
      : [];

    const moduleTaskMap = new Map<
      string,
      { hasTask: boolean; taskId: string | null; isSubmitted: boolean }
    >();

    const taskSubmissionStatuses = new Set(["SUBMITTED", "GRADED", "RETURNED"]);
    const moduleTaskBuckets = new Map<string, typeof moduleTasks>();
    moduleTasks.forEach((task) => {
      const bucket = moduleTaskBuckets.get(task.moduleId) || [];
      bucket.push(task);
      moduleTaskBuckets.set(task.moduleId, bucket);
    });

    course.modules.forEach((module) => {
      const tasksForModule = moduleTaskBuckets.get(module.id) || [];
      if (tasksForModule.length === 0) {
        moduleTaskMap.set(module.id, {
          hasTask: false,
          taskId: null,
          isSubmitted: true,
        });
        return;
      }

      const pendingTask = tasksForModule.find(
        (task) =>
          !task.submissions.some((s) => taskSubmissionStatuses.has(s.status))
      );
      moduleTaskMap.set(module.id, {
        hasTask: true,
        taskId: pendingTask?.id ?? tasksForModule[0]?.id ?? null,
        isSubmitted: !pendingTask,
      });
    });

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
        const previousModules = arr.slice(0, idx);
        const previousCompleted = previousModules.every(
          (m) =>
            m.lessons.every((l) => l.progress?.[0]?.isCompleted) &&
            m.lessons.every((l) => !l.quiz || passedQuizIds.has(l.quiz.id))
        );

        const isLocked = idx > 0 && !previousCompleted;

        const lessonsWithLocking = module.lessons.map((lesson, lidx) => {
          const previousLesson = module.lessons[lidx - 1];
          const previousLessonQuizPassed = previousLesson?.quiz
            ? passedQuizIds.has(previousLesson.quiz.id)
            : true;
          const isLessonLocked =
            isLocked ||
            (lidx > 0 &&
              (!previousLesson?.progress?.[0]?.isCompleted ||
                !previousLessonQuizPassed));

          return {
            ...lesson,
            isCompleted: lesson.progress?.[0]?.isCompleted ?? false,
            isLocked: isLessonLocked,
            quizPassed: lesson.quiz ? passedQuizIds.has(lesson.quiz.id) : true,
          };
        });

        return {
          ...module,
          isLocked,
          lessons: lessonsWithLocking,
          task: moduleTaskMap.get(module.id) || {
            hasTask: false,
            taskId: null,
            isSubmitted: true,
          },
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
