"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ImportFormat, ParsedQuestion } from "@/lib/exam/import/parsers";
import { CSV_TEMPLATE } from "@/lib/exam/import/parsers";
import {
  commitImport,
  exportBankAsCsv,
  previewImport,
  rollbackImport,
  validateQuestion,
} from "@/lib/exam/import/pipeline";
import { Prisma, type PrismaClient, type QuestionType } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Exam Center — question banks and import.
 *
 * Authorisation plus cache invalidation; the parsing and import logic is in
 * lib/exam/import/ so it can be verified without a session.
 */

const prisma = db as PrismaClient;

type Access =
  | { ok: true; tutorId: string; userId: string; canEdit: boolean }
  | { ok: false; error: string };

async function requireTutor(): Promise<
  { ok: true; tutorId: string; userId: string } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const tutor = await prisma.tutor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!tutor) return { ok: false, error: "You need a tutor profile to use question banks" };

  return { ok: true, tutorId: tutor.id, userId: session.user.id };
}

/** Owner has full access; a share may grant only VIEW. */
async function requireBank(bankId: string, needsEdit: boolean): Promise<Access> {
  const tutor = await requireTutor();
  if (!tutor.ok) return tutor;

  const bank = await prisma.questionBank.findUnique({
    where: { id: bankId },
    select: {
      ownerId: true,
      shares: { where: { tutorId: tutor.tutorId }, select: { access: true } },
    },
  });
  if (!bank) return { ok: false, error: "Question bank not found" };

  const isOwner = bank.ownerId === tutor.tutorId;
  const share = bank.shares[0];
  if (!isOwner && !share) return { ok: false, error: "Unauthorized" };

  const canEdit = isOwner || share?.access === "EDIT";
  if (needsEdit && !canEdit) {
    return { ok: false, error: "You have view-only access to this bank" };
  }

  return { ok: true, tutorId: tutor.tutorId, userId: tutor.userId, canEdit };
}

function revalidateBank(bankId?: string) {
  revalidatePath("/tutor/question-banks");
  if (bankId) revalidatePath(`/tutor/question-banks/${bankId}`);
}

// ─── Banks ───────────────────────────────────────────────────────────────────

export async function createBank(input: {
  title: string;
  description?: string | null;
  courseId?: string | null;
}) {
  const tutor = await requireTutor();
  if (!tutor.ok) return { error: tutor.error };

  if (!input.title?.trim() || input.title.trim().length < 2) {
    return { error: "Give the bank a name" };
  }

  const bank = await prisma.questionBank.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      courseId: input.courseId || null,
      ownerId: tutor.tutorId,
    },
    select: { id: true },
  });

  revalidateBank(bank.id);
  return { success: true, bankId: bank.id };
}

export async function updateBank(
  bankId: string,
  input: { title?: string; description?: string | null; courseId?: string | null },
) {
  const access = await requireBank(bankId, true);
  if (!access.ok) return { error: access.error };

  await prisma.questionBank.update({
    where: { id: bankId },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.courseId !== undefined ? { courseId: input.courseId || null } : {}),
    },
  });

  revalidateBank(bankId);
  return { success: true };
}

/**
 * Archive rather than delete.
 *
 * Published exams hold snapshots, not references, so deleting would be safe for
 * them — but a bank is months of a tutor's work and "delete" should not be a
 * one-click mistake.
 */
export async function archiveBank(bankId: string) {
  const access = await requireBank(bankId, true);
  if (!access.ok) return { error: access.error };

  await prisma.questionBank.update({
    where: { id: bankId },
    data: { isArchived: true },
  });

  revalidateBank(bankId);
  return { success: true };
}

export async function shareBank(bankId: string, email: string, access: "VIEW" | "EDIT") {
  const guard = await requireBank(bankId, true);
  if (!guard.ok) return { error: guard.error };

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, tutorProfile: { select: { id: true } } },
  });
  if (!user) return { error: "No account found with that email" };
  if (!user.tutorProfile) return { error: `${user.name} is not a tutor` };
  if (user.tutorProfile.id === guard.tutorId) return { error: "You already own this bank" };

  await prisma.questionBankShare.upsert({
    where: { bankId_tutorId: { bankId, tutorId: user.tutorProfile.id } },
    create: { bankId, tutorId: user.tutorProfile.id, access, grantedById: guard.userId },
    update: { access },
  });

  revalidateBank(bankId);
  return { success: true, name: user.name };
}

export async function revokeShare(shareId: string) {
  const share = await prisma.questionBankShare.findUnique({
    where: { id: shareId },
    select: { bankId: true },
  });
  if (!share) return { error: "Share not found" };

  const access = await requireBank(share.bankId, true);
  if (!access.ok) return { error: access.error };

  await prisma.questionBankShare.delete({ where: { id: shareId } });

  revalidateBank(share.bankId);
  return { success: true };
}

// ─── Questions ───────────────────────────────────────────────────────────────

export type BankQuestionInput = {
  stem: string;
  questionType: string;
  options: unknown;
  correctAnswer: unknown;
  explanation?: string | null;
  points: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topics: string[];
};

export async function createBankQuestion(bankId: string, input: BankQuestionInput) {
  const access = await requireBank(bankId, true);
  if (!access.ok) return { error: access.error };

  const errors = validateQuestion(input as Partial<ParsedQuestion>);
  if (errors.length > 0) return { error: errors[0] };

  await prisma.bankQuestion.create({
    data: {
      bankId,
      stem: input.stem.trim(),
      questionType: input.questionType as QuestionType,
      options: (input.options ?? Prisma.DbNull) as Prisma.InputJsonValue,
      correctAnswer: (input.correctAnswer ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      explanation: input.explanation?.trim() || null,
      points: input.points,
      difficulty: input.difficulty,
      topics: input.topics,
      createdById: access.userId,
    },
  });

  revalidateBank(bankId);
  return { success: true };
}

export async function updateBankQuestion(questionId: string, input: BankQuestionInput) {
  const question = await prisma.bankQuestion.findUnique({
    where: { id: questionId },
    select: { bankId: true, version: true },
  });
  if (!question) return { error: "Question not found" };

  const access = await requireBank(question.bankId, true);
  if (!access.ok) return { error: access.error };

  const errors = validateQuestion(input as Partial<ParsedQuestion>);
  if (errors.length > 0) return { error: errors[0] };

  await prisma.bankQuestion.update({
    where: { id: questionId },
    data: {
      stem: input.stem.trim(),
      questionType: input.questionType as QuestionType,
      options: (input.options ?? Prisma.DbNull) as Prisma.InputJsonValue,
      correctAnswer: (input.correctAnswer ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      explanation: input.explanation?.trim() || null,
      points: input.points,
      difficulty: input.difficulty,
      topics: input.topics,
      // Bumped so an exam snapshot can be traced back to the exact wording used.
      version: question.version + 1,
    },
  });

  revalidateBank(question.bankId);
  return { success: true };
}

/**
 * Archive a question rather than deleting it when an exam has used it, so the
 * snapshot's provenance survives.
 */
export async function deleteBankQuestion(questionId: string) {
  const question = await prisma.bankQuestion.findUnique({
    where: { id: questionId },
    select: { bankId: true, _count: { select: { examUses: true } } },
  });
  if (!question) return { error: "Question not found" };

  const access = await requireBank(question.bankId, true);
  if (!access.ok) return { error: access.error };

  if (question._count.examUses > 0) {
    await prisma.bankQuestion.update({
      where: { id: questionId },
      data: { isArchived: true },
    });
  } else {
    await prisma.bankQuestion.delete({ where: { id: questionId } });
  }

  revalidateBank(question.bankId);
  return { success: true, archived: question._count.examUses > 0 };
}

// ─── Import ──────────────────────────────────────────────────────────────────

/** Parse and validate without writing anything, for the preview step. */
export async function previewQuestionImport(input: {
  bankId: string;
  text: string;
  format?: ImportFormat;
}) {
  const access = await requireBank(input.bankId, true);
  if (!access.ok) return { error: access.error };

  if (!input.text?.trim()) return { error: "Nothing to import" };
  if (input.text.length > 2_000_000) {
    return { error: "That file is too large. Split it into smaller batches." };
  }

  const preview = previewImport(input.text, input.format);

  if (preview.totalRows === 0) {
    return { error: "No questions found. Check the format and try again." };
  }

  return { success: true, ...preview };
}

/** Commit the rows the tutor accepted, after any edits they made in the preview. */
export async function commitQuestionImport(input: {
  bankId: string;
  rows: Partial<ParsedQuestion>[];
  sourceFormat: string;
  sourceName?: string | null;
  totalRows: number;
  skippedRows?: { rowNumber: number; errors: string[]; raw: string }[];
}) {
  const access = await requireBank(input.bankId, true);
  if (!access.ok) return { error: access.error };

  const result = await commitImport(
    input.bankId,
    input.rows,
    {
      importedById: access.userId,
      sourceFormat: input.sourceFormat,
      sourceName: input.sourceName ?? null,
      totalRows: input.totalRows,
      skippedRows: input.skippedRows,
    },
    prisma,
  );

  if (!result.ok) return { error: result.error };

  revalidateBank(input.bankId);
  return {
    success: true,
    imported: result.imported,
    skipped: result.skipped,
    duplicates: result.duplicates,
    batchId: result.batchId,
  };
}

export async function undoQuestionImport(batchId: string) {
  const batch = await prisma.questionImportBatch.findUnique({
    where: { id: batchId },
    select: { bankId: true },
  });
  if (!batch) return { error: "Import not found" };

  const access = await requireBank(batch.bankId, true);
  if (!access.ok) return { error: access.error };

  const result = await rollbackImport(batchId, prisma);
  if (!result.ok) return { error: result.error };

  revalidateBank(batch.bankId);
  return { success: true, removed: result.removed, kept: result.kept };
}

/** CSV export, so a tutor's questions are never trapped here. */
export async function exportBank(bankId: string) {
  const access = await requireBank(bankId, false);
  if (!access.ok) return { error: access.error };

  const csv = await exportBankAsCsv(bankId, prisma);
  return { success: true, csv };
}

/** The importable template, offered as a download. */
export async function getImportTemplate() {
  return { success: true, csv: CSV_TEMPLATE };
}
