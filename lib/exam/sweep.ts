import { db } from "@/lib/db";
import { expireOverdueAttempts } from "@/lib/exam/attempt";
import { notifyUpcomingExams } from "@/lib/exam/notifications";
import {
  ExamAttemptStatus,
  ExamCandidateStatus,
  ExamStatus,
  type PrismaClient,
} from "@prisma/client";

/**
 * Exam Center — the periodic sweep.
 *
 * Everything here is the backstop for something a browser would normally do but
 * cannot be relied upon to. A candidate who closes their laptop mid-exam never
 * fires the auto-submit; an exam whose window passes overnight never gets closed
 * by anyone looking at it.
 *
 * All three passes are idempotent, so running this more often than necessary is
 * harmless and a missed run only delays the effect. That matters because the
 * scheduler driving it (GitHub Actions cron) makes no punctuality guarantees.
 */

const defaultClient = db as PrismaClient;

export type SweepReport = {
  attemptsExamined: number;
  attemptsSubmitted: number;
  examsClosed: number;
  candidatesMarkedMissed: number;
  remindersSent: number;
  remindersFailed: number;
};

export async function sweepExams(
  client: PrismaClient = defaultClient,
  now: Date = new Date(),
): Promise<SweepReport> {
  // 1. Auto-submit anything past its expiry. Grading happens inside submit, so a
  //    candidate who walked away still gets marked on the work they saved.
  const attempts = await expireOverdueAttempts(client, now);

  // 2. Close exams whose window has passed. Done after the submit pass so no
  //    attempt is still running under a closed exam.
  const closed = await client.exam.updateMany({
    where: {
      status: { in: [ExamStatus.SCHEDULED, ExamStatus.LIVE] },
      closesAt: { lte: now },
    },
    data: { status: ExamStatus.CLOSED, closedAt: now },
  });

  // 3. Mark no-shows. Only for exams that have actually closed, and only for
  //    candidates with no attempt at all — someone who sat it is never MISSED.
  //    An individual makeup window is respected, so a candidate whose own window
  //    is still open is left alone.
  const missed = await client.examCandidate.updateMany({
    where: {
      status: ExamCandidateStatus.INVITED,
      excludedAt: null,
      attempts: { none: {} },
      exam: {
        status: { in: [ExamStatus.CLOSED, ExamStatus.GRADING, ExamStatus.RELEASED] },
      },
      OR: [{ windowClosesAt: null }, { windowClosesAt: { lte: now } }],
    },
    data: { status: ExamCandidateStatus.MISSED },
  });

  // 4. Remind anyone whose exam opens in the next day. Wrapped because a mail
  //    provider outage must not stop the sweep doing its real work above.
  let remindersSent = 0;
  let remindersFailed = 0;
  try {
    const reminders = await notifyUpcomingExams(client, now);
    remindersSent = reminders.sent;
    remindersFailed = reminders.failed;
  } catch (error) {
    console.error("[exam-sweep] reminders failed:", error);
  }

  return {
    attemptsExamined: attempts.examined,
    attemptsSubmitted: attempts.submitted,
    examsClosed: closed.count,
    candidatesMarkedMissed: missed.count,
    remindersSent,
    remindersFailed,
  };
}

/** Attempts still running, for the sweep endpoint to report on. */
export async function countLiveAttempts(
  client: PrismaClient = defaultClient,
): Promise<number> {
  return client.examAttempt.count({
    where: { status: ExamAttemptStatus.IN_PROGRESS, isPractice: false },
  });
}
