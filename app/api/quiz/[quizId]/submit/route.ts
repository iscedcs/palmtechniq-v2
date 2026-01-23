import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { quizId } = await params;
  const userId = session.user.id;

  const body = await req.json();
  const { answers, score, timeSpent, enrollmentId } = body;

  if (!answers || !enrollmentId || score == null || timeSpent == null) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        lesson: {
          include: {
            module: {
              include: { course: { include: { modules: true } }, lessons: true },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const maxAttempts = quiz.maxAttempts || 3;

    // Count existing attempts
    const attemptsMade = await db.quizAttempt.count({
      where: { quizId, userId, enrollmentId },
    });

    if (attemptsMade >= maxAttempts) {
      return NextResponse.json({
        message:
          "Max attempts reached. Please rewatch the last lesson to unlock the quiz again.",
        passed: false,
        retryLesson: quiz.lesson,
        remainingAttempts: 0,
      });
    }

    let attempt = await db.quizAttempt.findFirst({
      where: { quizId, userId, enrollmentId },
      orderBy: { createdAt: "desc" },
    });

    const passed = score >= quiz.passingScore;
    await db.quizAttempt.create({
      data: {
        userId,
        quizId,
        enrollmentId,
        answers,
        score,
        timeSpent,
        isCompleted: true,
        passed,
      },
    });

    const answerEntries = Object.entries(answers);

    await db.quizAnswer.createMany({
      data: answerEntries.map(([questionId, selectedAnswer]: any) => ({
        userId,
        quizId,
        questionId,
        selectedAnswer,
        isCorrect:
          quiz.questions.find((q: any) => q.id === questionId)
            ?.correctAnswer === selectedAnswer,
      })),
    });

    const remainingAttempts = Math.max(maxAttempts - (attemptsMade + 1), 0);

    if (passed) {
      const moduleLessons = quiz.lesson.module.lessons.sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
      const lessonIndex = moduleLessons.findIndex(
        (l) => l.id === quiz.lessonId
      );
      const nextLessonInModule = moduleLessons[lessonIndex + 1] || null;

      if (nextLessonInModule) {
        await db.lesson.update({
          where: { id: nextLessonInModule.id },
          data: { isLocked: false },
        });
        return NextResponse.json({
          message: "Quiz passed successfully",
          passed: true,
          score,
          remainingAttempts,
          nextLesson: nextLessonInModule,
        });
      }

      const moduleTasks = await db.task.findMany({
        where: { moduleId: quiz.lesson.moduleId, isActive: true },
        select: { id: true },
      });

      if (moduleTasks.length > 0) {
        const taskSubmission = await db.taskSubmission.findFirst({
          where: {
            taskId: { in: moduleTasks.map((t) => t.id) },
            userId,
            status: { in: ["SUBMITTED", "GRADED", "RETURNED"] },
          },
        });

        if (!taskSubmission) {
          return NextResponse.json({
            message:
              "Quiz passed! Please submit the module task before proceeding.",
            passed: true,
            taskRequired: true,
          });
        }
      }

      const modules = quiz.lesson.module.course.modules.sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
      const currentIndex = modules.findIndex(
        (m) => m.id === quiz.lesson.moduleId
      );
      const nextModule = modules[currentIndex + 1];

      let nextLesson = null;
      if (nextModule) {
        const firstLesson = await db.lesson.findFirst({
          where: { moduleId: nextModule.id },
          orderBy: { sortOrder: "asc" },
        });

        if (firstLesson) {
          await db.lesson.update({
            where: { id: firstLesson.id },
            data: { isLocked: false },
          });
          nextLesson = firstLesson;
        }
      }

      return NextResponse.json({
        message: "Quiz passed successfully",
        passed: true,
        score,
        remainingAttempts,
        nextLesson,
      });
    }
    if (remainingAttempts <= 0) {
      return NextResponse.json({
        message:
          "You’ve used all attempts. Please rewatch the last lesson to reset your quiz access.",
        passed: false,
        retryLesson: quiz.lesson,
        remainingAttempts,
      });
    }
    return NextResponse.json({
      message: `You did not pass. Try again! ${remainingAttempts} attempt(s) left.`,
      passed: false,
      score,
      remainingAttempts,
    });
  } catch (error) {
    console.error("Submit quiz failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
