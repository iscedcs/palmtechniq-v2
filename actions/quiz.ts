// Server Action: app/actions/quiz/createQuiz.ts
"use server";

import { db } from "@/lib/db";
import { QuestionType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createQuizForLesson(
  lessonId: string,
  formData: FormData
) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const timeLimit = Number(formData.get("timeLimit")) || null;
  const passingScore = Number(formData.get("passingScore")) || 70;
  const maxAttempts = Number(formData.get("maxAttempts")) || 3;

  const questionsRaw = formData.get("questions") as string;
  const questions = JSON.parse(questionsRaw);

  const quiz = await db.quiz.create({
    data: {
      title,
      description,
      timeLimit,
      passingScore,
      maxAttempts,
      lessonId,
      questions: {
        createMany: {
          data: questions.map((q: any, idx: number) => ({
            question: q.question,
            questionType: q.questionType,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points || 1,
            sortOrder: idx,
          })),
        },
      },
    },
  });

  revalidatePath("/tutor/courses/[courseId]/edit", "page");
  return quiz;
}

export async function updateQuizForLesson(quizId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const timeLimit = Number(formData.get("timeLimit")) || null;
  const passingScore = Number(formData.get("passingScore")) || 70;
  const maxAttempts = Number(formData.get("maxAttempts")) || 3;

  const questionsRaw = formData.get("questions") as string;
  const questions = JSON.parse(questionsRaw) as {
    id?: string;
    question: string;
    questionType: string;
    options: any;
    correctAnswer: any;
    explanation?: string;
    points?: number;
  }[];

  // Update quiz metadata
  await db.quiz.update({
    where: { id: quizId },
    data: {
      title,
      description,
      timeLimit,
      passingScore,
      maxAttempts,
      updatedAt: new Date(),
    },
  });

  // For now: delete existing and recreate questions (can be optimized later)
  await db.question.deleteMany({
    where: { quizId },
  });

  await db.question.createMany({
    data: questions.map((q, idx) => ({
      quizId,
      question: q.question,
      questionType: q.questionType as QuestionType,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points || 1,
      sortOrder: idx,
    })),
  });

  revalidatePath("/tutor/courses/[courseId]/edit", "page");
}
