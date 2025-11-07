import { auth } from "@/auth";
import { db } from "@/lib/db";
import { resetQuizAttemptsForModule } from "@/lib/quiz-utils";
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
          include: {
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

    const resetResult = await resetQuizAttemptsForModule(
      userId,
      lesson.moduleId
    );
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

    await db.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: newProgress,
        status: newProgress === 100 ? "COMPLETED" : "ACTIVE",
        completedAt: newProgress === 100 ? now : null,
      },
    });

    return NextResponse.json({
      success: true,
      progress: newProgress,
      message: resetResult?.reset
        ? "Lesson completed. Quiz attempts have been reset!"
        : "Lesson completed.",
      resetQuiz: resetResult?.reset,
      quizId: resetResult?.quizId,
    });
  } catch (error) {
    console.error("Lesson completion error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
