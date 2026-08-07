"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
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

  revalidatePath("/tutor/exams");
  revalidatePath(`/tutor/exams/${examId}`);

  return {
    success: true,
    alreadyPublished: result.alreadyPublished ?? false,
    status: result.status,
    totalPoints: result.totalPoints,
    candidatesSeeded: result.candidatesSeeded,
    candidateCount: result.candidateCount,
  };
}

/** Pull in people who joined the scope after the exam was published. */
export async function resyncRoster(examId: string) {
  const authorized = await authorizeExam(examId);
  if (!authorized.ok) return { error: authorized.error };

  const result = await executeResyncRoster(examId, prisma);
  if (!result.ok) return { error: result.error };

  revalidatePath(`/tutor/exams/${examId}`);

  return { success: true, added: result.added };
}
