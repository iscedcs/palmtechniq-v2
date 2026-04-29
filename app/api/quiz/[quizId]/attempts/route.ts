import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quiz = await db.quiz.findUnique({
    where: { id: (await params).quizId },
    select: { maxAttempts: true },
  });

  if (!quiz)
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const attemptsMade = await db.quizAttempt.count({
    where: { quizId: (await params).quizId, userId: session.user.id },
  });

  const remaining = Math.max(quiz.maxAttempts - attemptsMade, 0);

  return NextResponse.json({ remaining });
}
