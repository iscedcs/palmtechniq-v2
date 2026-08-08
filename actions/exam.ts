"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyExamScheduled, resendExamEmails } from "@/lib/exam/notifications";
import {
  executePublish,
  executeResyncRoster,
  validateExamForPublish as validatePublish,
} from "@/lib/exam/publish";
import type { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Exam Center — server actions.
 *
 * These are a thin authorisation and cache-invalidation layer. The pipeline
 * itself lives in lib/exam/publish.ts so it can be exercised without a session;
 * see scripts/verify-exam-publish.ts.
 */

const prisma = db as PrismaClient;

/** An exam is managed by the tutor who owns it, or by an admin. */
async function authorizeExam(
  examId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
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

  return { ok: true };
}

/** Pre-publish checklist for the authoring UI. */
export async function getPublishChecklist(examId: string) {
  const authorized = await authorizeExam(examId);
  if (!authorized.ok) return { error: authorized.error };

  const { ok, problems } = await validatePublish(examId, prisma);
  return { success: true, ready: ok, problems };
}

/** DRAFT -> SCHEDULED. Snapshots questions, seeds the roster, fixes the total. */
export async function publishExam(examId: string) {
  const authorized = await authorizeExam(examId);
  if (!authorized.ok) return { error: authorized.error };

  const result = await executePublish(examId, prisma);
  if (!result.ok) return { error: result.error, problems: result.problems };

  // Tell the roster. Deliberately after the publish transaction has committed
  // and outside it: a mail provider outage must not roll back a published exam.
  const notified = await notifyExamScheduled(examId, prisma);

  revalidatePath("/tutor/exams");
  revalidatePath(`/tutor/exams/${examId}`);

  return {
    success: true,
    alreadyPublished: result.alreadyPublished ?? false,
    status: result.status,
    totalPoints: result.totalPoints,
    candidatesSeeded: result.candidatesSeeded,
    candidateCount: result.candidateCount,
    notified: notified.sent,
    notificationsFailed: notified.emailsFailed,
    emailError: notified.emailError,
  };
}

/**
 * Re-send the "exam scheduled" email to the whole roster.
 *
 * The recovery path for a mail provider that was down, rate-limited or holding a
 * bad key at publish time. Students were told in-app regardless; this gets the
 * email out afterwards without touching `notifiedAt`.
 */
export async function resendExamNotifications(examId: string) {
  const authorized = await authorizeExam(examId);
  if (!authorized.ok) return { error: authorized.error };

  const result = await resendExamEmails(examId, prisma);

  return {
    success: true,
    emailsSent: result.emailsSent,
    emailsFailed: result.emailsFailed,
    emailError: result.emailError,
    reason: result.reason,
  };
}

/** Pull in people who joined the scope after the exam was published. */
export async function resyncRoster(examId: string) {
  const authorized = await authorizeExam(examId);
  if (!authorized.ok) return { error: authorized.error };

  const result = await executeResyncRoster(examId, prisma);
  if (!result.ok) return { error: result.error };

  // Late joiners get the same notice everyone else already had. `notifiedAt`
  // means the original roster is not mailed a second time.
  const notified = result.added > 0 ? await notifyExamScheduled(examId, prisma) : null;

  revalidatePath(`/tutor/exams/${examId}`);

  return { success: true, added: result.added, notified: notified?.sent ?? 0 };
}
