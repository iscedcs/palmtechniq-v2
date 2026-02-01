import { auth } from "@/auth";
import { db } from "@/lib/db";
import { resetQuizAttemptsForLesson } from "@/lib/quiz-utils";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session?.user.id;

  const { lessonId } = await params;
  const { duration } = await req.json();
  const now = new Date();

  try {
    // 1. Find the enrollment for this user & lesson’s course
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: session.user.id,
        course: {
          modules: {
            some: {
              lessons: {
                some: { id: lessonId },
              },
            },
          },
        },
      },
      include: {
        course: {
          select: {
            id: true,
            certificate: true,
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found for this course" },
        { status: 400 }
      );
    }

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, moduleId: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // 2. Upsert lesson progress correctly
    await db.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        isCompleted: true,
        watchTime: duration,
        completedAt: now,
      },
      create: {
        userId,
        enrollmentId: enrollment.id,
        lessonId,
        watchTime: duration,
        isCompleted: true,
        completedAt: now,
      },
    });

    const resetResult = await resetQuizAttemptsForLesson(userId, lessonId);
    const lessonQuiz = await db.quiz.findFirst({
      where: { lessonId },
      select: { id: true },
    });
    const allLessonIds = enrollment.course.modules.flatMap((m) =>
      m.lessons.map((l) => l.id)
    );

    const completedCount = await db.lessonProgress.count({
      where: {
        userId: session.user.id,
        lessonId: { in: allLessonIds },
        isCompleted: true,
      },
    });

    const totalLessons = allLessonIds.length;

    const newProgress =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    const quizIds = await db.quiz.findMany({
      where: { lessonId: { in: allLessonIds } },
      select: { id: true },
    });
    const passedQuizAttempts = quizIds.length
      ? await db.quizAttempt.findMany({
          where: {
            userId,
            quizId: { in: quizIds.map((q) => q.id) },
            passed: true,
          },
          select: { quizId: true },
        })
      : [];
    const passedQuizIds = new Set(passedQuizAttempts.map((a) => a.quizId));
    const quizzesComplete = quizIds.every((q) => passedQuizIds.has(q.id));

    const courseTasks = await db.task.findMany({
      where: { courseId: enrollment.course.id, isActive: true },
      include: {
        submissions: {
          where: { userId },
          select: { status: true },
        },
      },
    });
    const submissionStatuses = new Set(["SUBMITTED", "GRADED", "RETURNED"]);
    const tasksComplete = courseTasks.every((task) =>
      task.submissions.some((s) => submissionStatuses.has(s.status))
    );

    const courseProjects = await db.project.findMany({
      where: {
        courseId: enrollment.course.id,
        scope: "COURSE",
        isActive: true,
      },
      include: {
        submissions: {
          where: { userId },
          select: { status: true },
        },
      },
    });
    const projectsComplete = courseProjects.every((project) =>
      project.submissions.some((s) => submissionStatuses.has(s.status))
    );

    const certificateEnabled = Boolean(enrollment.course.certificate);
    const certificateEligible =
      newProgress === 100 &&
      quizzesComplete &&
      tasksComplete &&
      projectsComplete;
    const canCompleteEnrollment =
      newProgress === 100 && (!certificateEnabled || certificateEligible);

    await db.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: newProgress,
        status: canCompleteEnrollment ? "COMPLETED" : "ACTIVE",
        completedAt: canCompleteEnrollment ? now : null,
      },
    });

    const moduleTasks = courseTasks.filter(
      (task) => task.moduleId === lesson.moduleId
    );
    const pendingModuleTask = moduleTasks.find(
      (task) =>
        !task.submissions.some((s) => submissionStatuses.has(s.status))
    );
    const moduleTaskId =
      pendingModuleTask?.id ?? moduleTasks[0]?.id ?? null;

    return NextResponse.json({
      success: true,
      progress: newProgress,
      courseCompleted: newProgress === 100,
      certificateEnabled,
      certificateEligible: certificateEnabled ? certificateEligible : true,
      certificateMissing: certificateEnabled
        ? {
            lessons: newProgress < 100,
            quizzes: !quizzesComplete,
            tasks: !tasksComplete,
            projects: !projectsComplete,
          }
        : null,
      message: resetResult?.reset
        ? "Lesson completed. Quiz attempts have been reset!"
        : "Lesson completed.",
      resetQuiz: resetResult?.reset,
      quizId: lessonQuiz?.id || null,
      taskRequired: moduleTasks.length > 0,
      moduleTaskId,
      moduleTaskSubmitted: moduleTasks.length === 0 || !pendingModuleTask,
      moduleHasQuiz: Boolean(resetResult?.quizId),
    });
  } catch (error) {
    console.error("Lesson completion error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
