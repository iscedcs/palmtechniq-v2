"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logEvent, submitAttempt } from "@/lib/exam/attempt";
import {
  ExamAttemptStatus,
  ExamEventSeverity,
  ExamEventType,
  ExamSubmittedBy,
  type PrismaClient,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Exam Center — invigilation actions.
 *
 * What a tutor can do to an exam that is already running.
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

/**
 * Give a candidate more time.
 *
 * The subtlety this exists to handle: `extraTimeMinutes` on the candidate is read
 * when an attempt STARTS, so setting it alone does nothing for someone already
 * sitting. This pushes the running attempt's `expiresAt` too — and their personal
 * window, so the sweep does not close the exam out from under the extension they
 * were just granted.
 */
export async function grantExtraTime(candidateId: string, minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return { error: "Enter how many minutes to add" };
  }

  const candidate = await prisma.examCandidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      examId: true,
      userId: true,
      extraTimeMinutes: true,
      windowClosesAt: true,
      exam: { select: { closesAt: true } },
    },
  });
  if (!candidate) return { error: "Candidate not found" };

  const authorized = await authorizeExam(candidate.examId);
  if (!authorized.ok) return { error: authorized.error };

  const addMs = minutes * 60_000;

  const running = await prisma.examAttempt.findFirst({
    where: {
      candidateId,
      status: ExamAttemptStatus.IN_PROGRESS,
      isPractice: false,
    },
    orderBy: { attemptNumber: "desc" },
    select: { id: true, expiresAt: true },
  });

  await prisma.$transaction(async (tx) => {
    // Applies to any future attempt.
    await tx.examCandidate.update({
      where: { id: candidateId },
      data: { extraTimeMinutes: candidate.extraTimeMinutes + minutes },
    });

    if (running) {
      const newExpiry = new Date(running.expiresAt.getTime() + addMs);

      await tx.examAttempt.update({
        where: { id: running.id },
        data: { expiresAt: newExpiry },
      });

      // Keep the personal window at least as long as the new expiry, or the
      // sweep would close them out mid-extension.
      const currentClose = candidate.windowClosesAt ?? candidate.exam.closesAt;
      if (currentClose && newExpiry > currentClose) {
        await tx.examCandidate.update({
          where: { id: candidateId },
          data: { windowClosesAt: newExpiry },
        });
      }

      await logEvent(tx, {
        attemptId: running.id,
        examId: candidate.examId,
        userId: candidate.userId,
        type: ExamEventType.EXTRA_TIME_GRANTED,
        severity: ExamEventSeverity.INFO,
        metadata: { minutes, newExpiresAt: newExpiry.toISOString() },
      });
    }
  });

  revalidatePath(`/tutor/exams/${candidate.examId}/monitor`);

  return {
    success: true,
    appliedToRunningAttempt: !!running,
    minutes,
  };
}

/**
 * End someone's attempt from the invigilator's side.
 *
 * Marks and grades exactly as a normal submission would — the work they saved
 * still counts.
 */
export async function forceSubmit(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: { examId: true, status: true },
  });
  if (!attempt) return { error: "Attempt not found" };

  const authorized = await authorizeExam(attempt.examId);
  if (!authorized.ok) return { error: authorized.error };

  if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
    return { error: "That attempt is already submitted" };
  }

  const result = await submitAttempt(attemptId, ExamSubmittedBy.TUTOR, prisma);
  if (!result.ok) return { error: result.error };

  revalidatePath(`/tutor/exams/${attempt.examId}/monitor`);

  return { success: true, pendingManual: result.pendingManual };
}

/**
 * Let a candidate sit again — the answer to "my laptop died".
 *
 * Grants an extra attempt rather than reopening the old one: a submitted attempt
 * has been graded, and un-submitting it would mean unpicking a grade and any
 * certificate that followed.
 */
export async function grantAnotherAttempt(candidateId: string) {
  const candidate = await prisma.examCandidate.findUnique({
    where: { id: candidateId },
    select: { examId: true, extraAttempts: true },
  });
  if (!candidate) return { error: "Candidate not found" };

  const authorized = await authorizeExam(candidate.examId);
  if (!authorized.ok) return { error: authorized.error };

  await prisma.examCandidate.update({
    where: { id: candidateId },
    data: { extraAttempts: candidate.extraAttempts + 1 },
  });

  revalidatePath(`/tutor/exams/${candidate.examId}/monitor`);

  return { success: true };
}
