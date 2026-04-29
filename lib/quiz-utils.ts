import { db } from "@/lib/db";

/**
 * Resets quiz attempts for a given lesson once the student re-completes it.
 * This allows them to retake the quiz after exhausting all attempts.
 *
 * @param userId - The user who completed the lesson.
 * @param lessonId - The lesson the quiz belongs to.
 */
export async function resetQuizAttemptsForLesson(
  userId: string,
  lessonId: string
) {
  try {
    const quiz = await db.quiz.findFirst({
      where: { lessonId },
    });

    if (!quiz) return { reset: false };

    const maxAttempts = quiz.maxAttempts || 3;
    // Find the latest attempt for this quiz by this user
    const lastAttempt = await db.quizAttempt.findFirst({
      where: {
        userId,
        quizId: quiz.id,
      },
      orderBy: { createdAt: "desc" },
    });

    const attemptsMade = await db.quizAttempt.count({
      where: { userId, quizId: quiz.id },
    });

    // If student had failed and exhausted attempts, reset them
    if (lastAttempt && !lastAttempt.passed && attemptsMade >= maxAttempts) {
      // Delete all past attempts to give them a clean retry
      await db.quizAttempt.deleteMany({
        where: { userId, quizId: quiz.id },
      });

      console.log(
        `✅ Reset quiz attempts for user ${userId} on quiz ${quiz.id}`
      );

      return { reset: true, quizId: quiz.id };
    }

    return { reset: false, quizId: quiz?.id };
  } catch (error) {
    // Find the quiz for the lesson
    console.error("resetQuizAttemptsForLesson error:", error);
    return { reset: false };
  }
}
