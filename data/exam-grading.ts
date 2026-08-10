"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AUTO_GRADED_TYPES } from "@/lib/exam/grading";
import type { PrismaClient } from "@prisma/client";

const prisma = db as PrismaClient;

/** A tutor may grade their own exam; admins may grade any. */
async function canGrade(examId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  if (session.user.role === "ADMIN" || session.user.role === "SUPERIOR") return true;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { tutor: { select: { userId: true } } },
  });
  return exam?.tutor.userId === session.user.id;
}

export type GradingQueueItem = {
  responseId: string;
  attemptId: string;
  questionId: string;
  stem: string;
  questionType: string;
  points: number;
  answer: unknown;
  manualScore: number | null;
  feedback: string | null;
  candidateName: string;
  candidateId: string;
};

/**
 * Everything on this exam awaiting a human.
 *
 * Ordered by question rather than by candidate: marking the same question across
 * twenty papers in a row is both faster and fairer than marking twenty whole
 * papers, because the standard stays put.
 */
export async function getGradingQueue(examId: string): Promise<GradingQueueItem[]> {
  if (!(await canGrade(examId))) return [];

  const responses = await prisma.examResponse.findMany({
    where: {
      attempt: { examId, isPractice: false, status: { not: "IN_PROGRESS" } },
      question: { questionType: { notIn: AUTO_GRADED_TYPES } },
    },
    include: {
      question: { select: { id: true, stem: true, questionType: true, points: true, sortOrder: true } },
      attempt: { select: { id: true, userId: true, user: { select: { id: true, name: true } } } },
    },
    orderBy: [{ question: { sortOrder: "asc" } }, { attempt: { startedAt: "asc" } }],
  });

  return responses.map((r) => ({
    responseId: r.id,
    attemptId: r.attempt.id,
    questionId: r.question.id,
    stem: r.question.stem,
    questionType: r.question.questionType,
    points: r.question.points,
    answer: r.answer,
    manualScore: r.manualScore,
    feedback: r.feedback,
    candidateName: r.attempt.user.name,
    candidateId: r.attempt.user.id,
  }));
}

export type ExamResultRow = {
  gradeId: string;
  attemptId: string;
  candidateName: string;
  candidateEmail: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  status: string;
  overridden: boolean;
  certificateId: string | null;
  submittedAt: Date | null;
};

export async function getExamResults(examId: string): Promise<ExamResultRow[]> {
  if (!(await canGrade(examId))) return [];

  const grades = await prisma.examGrade.findMany({
    where: { examId },
    include: {
      user: { select: { name: true, email: true } },
      attempt: { select: { submittedAt: true } },
    },
    orderBy: { percentage: "desc" },
  });

  return grades.map((g) => ({
    gradeId: g.id,
    attemptId: g.attemptId,
    candidateName: g.user.name,
    candidateEmail: g.user.email,
    totalScore: g.totalScore,
    maxScore: g.maxScore,
    percentage: g.percentage,
    passed: g.passed,
    status: g.status,
    overridden: !!g.overriddenAt,
    certificateId: g.certificateId,
    submittedAt: g.attempt.submittedAt,
  }));
}

/**
 * Per-question statistics. Which questions everyone got wrong is a teaching
 * signal, not just an admin one.
 */
export async function getItemAnalysis(examId: string) {
  if (!(await canGrade(examId))) return [];

  const questions = await prisma.examQuestion.findMany({
    where: { examId },
    select: {
      id: true,
      stem: true,
      questionType: true,
      points: true,
      sortOrder: true,
      responses: {
        where: { attempt: { isPractice: false, status: { not: "IN_PROGRESS" } } },
        select: { isCorrect: true, autoScore: true, manualScore: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return questions
    .filter((q) => q.responses.length > 0)
    .map((q) => {
      const answered = q.responses.length;
      const correct = q.responses.filter((r) => r.isCorrect === true).length;
      const scored = q.responses.reduce(
        (sum, r) => sum + (r.manualScore ?? r.autoScore ?? 0),
        0,
      );

      return {
        id: q.id,
        stem: q.stem,
        questionType: q.questionType,
        points: q.points,
        answered,
        correct,
        correctRate: answered > 0 ? (correct / answered) * 100 : 0,
        averageScore: answered > 0 ? scored / answered : 0,
      };
    });
}
