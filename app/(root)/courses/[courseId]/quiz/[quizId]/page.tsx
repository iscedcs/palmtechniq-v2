import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import QuizRunnerClient from "@/components/pages/courses/courseId/quiz/[quizId]/quiz-client";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return notFound();

  const quiz = await db.quiz.findUnique({
    where: { id: (await params).quizId },
    include: {
      lesson: {
        select: {
          module: { select: { courseId: true } },
        },
      },
      questions: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  const enrollment = await db.enrollment.findFirst({
    where: {
      userId: session.user.id,
      courseId: quiz?.lesson.module.courseId,
    },
  });

  if (!quiz) return notFound();

  return (
    <QuizRunnerClient
      enrollmentId={enrollment?.id}
      quiz={quiz}
      userId={session.user.id}
    />
  );
}
