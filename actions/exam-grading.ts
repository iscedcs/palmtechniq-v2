"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyResultsReleased } from "@/lib/exam/notifications";
import {
  applyManualScore,
  overrideGrade as override,
  releaseExamResults,
} from "@/lib/exam/results";
import type { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Exam Center — grading and release actions.
 *
 * Authorisation only; the logic and the audit trail live in lib/exam/results.ts.
 */

const prisma = db as PrismaClient;

type Auth = { ok: true; userId: string } | { ok: false; error: string };

async function authorizeExam(examId: string): Promise<Auth> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERIOR";

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { tutor: { select: { userId: true } } },
  });
  if (!exam) return { ok: false, error: "Exam not found" };

  if (!isAdmin && exam.tutor.userId !== session.user.id) {
    return { ok: false, error: "Unauthorized" };
  }
  return { ok: true, userId: session.user.id };
}

/** Mark one subjective answer. */
export async function gradeResponse(input: {
  responseId: string;
  score: number;
  feedback?: string | null;
}) {
  const response = await prisma.examResponse.findUnique({
    where: { id: input.responseId },
    select: { attempt: { select: { examId: true } } },
  });
  if (!response) return { error: "Answer not found" };

  const authorized = await authorizeExam(response.attempt.examId);
  if (!authorized.ok) return { error: authorized.error };

  const result = await applyManualScore(
    input.responseId,
    input.score,
    authorized.userId,
    input.feedback?.trim() || null,
    prisma,
  );

  if (!result.ok) return { error: result.error };

  revalidatePath(`/tutor/exams/${response.attempt.examId}/grading`);
  revalidatePath(`/tutor/exams/${response.attempt.examId}`);

  return {
    success: true,
    pendingManual: result.grade.pendingManual,
    totalScore: result.grade.totalScore,
  };
}

/** Override a final score. Requires a reason, and is always audited. */
export async function overrideGrade(input: {
  gradeId: string;
  newTotal: number;
  reason: string;
}) {
  const grade = await prisma.examGrade.findUnique({
    where: { id: input.gradeId },
    select: { examId: true },
  });
  if (!grade) return { error: "Grade not found" };

  const authorized = await authorizeExam(grade.examId);
  if (!authorized.ok) return { error: authorized.error };

  const result = await override(
    input.gradeId,
    input.newTotal,
    input.reason,
    authorized.userId,
    prisma,
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(`/tutor/exams/${grade.examId}/grading`);

  return { success: true, passed: result.passed };
}

/** Release results. Issues certificates for a course-scoped final assessment. */
export async function releaseResults(examId: string) {
  const authorized = await authorizeExam(examId);
  if (!authorized.ok) return { error: authorized.error };

  const result = await releaseExamResults(examId, authorized.userId, prisma);
  if (!result.ok) return { error: result.error };

  // Outside the release transaction — a mail failure must not un-release results
  // or un-issue a certificate.
  const notified = await notifyResultsReleased(examId, prisma);

  revalidatePath(`/tutor/exams/${examId}`);
  revalidatePath(`/tutor/exams/${examId}/grading`);
  revalidatePath("/student/exams");

  return {
    success: true,
    notified: notified.sent,
    released: result.released,
    skippedPendingManual: result.skippedPendingManual,
    certificatesIssued: result.certificatesIssued,
    certificatesSkipped: result.certificatesSkipped,
    certificateNote: result.certificateNote,
  };
}
