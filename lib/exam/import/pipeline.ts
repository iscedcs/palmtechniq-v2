import { db } from "@/lib/db";
import {
  parseQuestions,
  type ImportFormat,
  type ParsedQuestion,
  type ParsedRow,
} from "@/lib/exam/import/parsers";
import { Prisma, type PrismaClient, type QuestionType } from "@prisma/client";

/**
 * Exam Center — the import pipeline.
 *
 *   parse -> preview & fix -> validate -> commit
 *
 * The preview-and-fix step is the whole point, and the thing the third-party
 * tool got wrong: a bad row is returned WITH its error and its original text so
 * the tutor can correct three rows in place, instead of re-uploading a 200-row
 * file blind. Nothing is written until they commit.
 */

const defaultClient = db as PrismaClient;

export type ReviewRow = ParsedRow & {
  /** False when the row cannot be imported as it stands. */
  valid: boolean;
};

export type ImportPreview = {
  format: ImportFormat;
  rows: ReviewRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
};

/**
 * Final validation, run on parse AND again on commit.
 *
 * Run twice on purpose: the tutor edits rows between the two, and the second
 * pass is the one that actually guards the database.
 */
export function validateQuestion(q: Partial<ParsedQuestion>): string[] {
  const errors: string[] = [];

  if (!q.stem?.trim()) errors.push("No question text");
  if (q.stem && q.stem.trim().length > 5000) errors.push("Question text is too long");

  const type = q.questionType;
  if (!type) errors.push("No question type");

  const points = q.points ?? 1;
  if (!Number.isFinite(points) || points < 0) errors.push("Marks must be zero or more");

  const options = Array.isArray(q.options) ? (q.options as unknown[]) : [];

  if (type === "MULTIPLE_CHOICE" || type === "MULTI_SELECT") {
    if (options.length < 2) {
      errors.push("Needs at least two options");
    } else {
      const answers = Array.isArray(q.correctAnswer)
        ? (q.correctAnswer as unknown[])
        : [q.correctAnswer];
      const cleaned = answers.filter((a) => a !== null && a !== undefined && a !== "");
      if (cleaned.length === 0) {
        errors.push("No correct answer");
      } else {
        const texts = options.map((o) => String(o).toLowerCase());
        const missing = cleaned.filter((a) => !texts.includes(String(a).toLowerCase()));
        if (missing.length > 0) {
          errors.push(`Correct answer "${missing[0]}" is not one of the options`);
        }
      }
    }
  }

  if (type === "TRUE_FALSE" && typeof q.correctAnswer !== "boolean") {
    errors.push("Correct answer must be true or false");
  }

  if (type === "NUMERIC") {
    const value =
      q.correctAnswer !== null &&
      typeof q.correctAnswer === "object" &&
      "value" in (q.correctAnswer as object)
        ? (q.correctAnswer as { value: unknown }).value
        : q.correctAnswer;
    if (!Number.isFinite(Number(value))) errors.push("Correct answer must be a number");
  }

  if (type === "FILL_IN_BLANK") {
    const accepted = Array.isArray(q.correctAnswer)
      ? (q.correctAnswer as unknown[])
      : [q.correctAnswer];
    if (accepted.filter((a) => String(a ?? "").trim()).length === 0) {
      errors.push("Needs at least one accepted answer");
    }
  }

  return errors;
}

/** Parse and validate, without writing anything. */
export function previewImport(text: string, format?: ImportFormat): ImportPreview {
  const { format: used, rows } = parseQuestions(text, format);

  const reviewed: ReviewRow[] = rows.map((row) => {
    // Parser errors plus schema errors, de-duplicated — the two overlap.
    const errors = Array.from(new Set([...row.errors, ...validateQuestion(row.question)]));
    return { ...row, errors, valid: errors.length === 0 };
  });

  return {
    format: used,
    rows: reviewed,
    totalRows: reviewed.length,
    validRows: reviewed.filter((r) => r.valid).length,
    invalidRows: reviewed.filter((r) => !r.valid).length,
  };
}

export type CommitResult =
  | { ok: false; error: string }
  | {
      ok: true;
      batchId: string;
      imported: number;
      skipped: number;
      duplicates: number;
    };

/**
 * Write the accepted rows into a bank.
 *
 * Everything lands in one QuestionImportBatch so a bad import can be reviewed,
 * attributed, or rolled back as a unit rather than hunted for question by
 * question.
 */
export async function commitImport(
  bankId: string,
  rows: Partial<ParsedQuestion>[],
  meta: {
    importedById: string | null;
    sourceFormat: string;
    sourceName?: string | null;
    totalRows: number;
    skippedRows?: { rowNumber: number; errors: string[]; raw: string }[];
  },
  client: PrismaClient = defaultClient,
): Promise<CommitResult> {
  const bank = await client.questionBank.findUnique({
    where: { id: bankId },
    select: { id: true },
  });
  if (!bank) return { ok: false, error: "Question bank not found" };

  // Validate again. The tutor edited these after the preview, and this is the
  // pass that actually protects the bank.
  const accepted: Partial<ParsedQuestion>[] = [];
  const rejected: { rowNumber: number; errors: string[]; raw: string }[] = [
    ...(meta.skippedRows ?? []),
  ];

  rows.forEach((row, i) => {
    const errors = validateQuestion(row);
    if (errors.length === 0) accepted.push(row);
    else rejected.push({ rowNumber: i + 1, errors, raw: row.stem ?? "" });
  });

  if (accepted.length === 0) {
    return { ok: false, error: "Nothing in this import is valid yet" };
  }

  // Don't re-import questions the bank already has, so running the same file
  // twice does not double the bank.
  const existing = await client.bankQuestion.findMany({
    where: { bankId, isArchived: false },
    select: { stem: true },
  });
  const seen = new Set(existing.map((q) => q.stem.trim().toLowerCase()));

  const fresh: Partial<ParsedQuestion>[] = [];
  let duplicates = 0;
  for (const row of accepted) {
    const key = (row.stem ?? "").trim().toLowerCase();
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    fresh.push(row);
  }

  const result = await client.$transaction(async (tx) => {
    const batch = await tx.questionImportBatch.create({
      data: {
        bankId,
        importedById: meta.importedById,
        sourceFormat: meta.sourceFormat,
        sourceName: meta.sourceName ?? null,
        totalRows: meta.totalRows,
        importedCount: fresh.length,
        skippedCount: rejected.length + duplicates,
        errors:
          rejected.length > 0 ? (rejected as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      },
      select: { id: true },
    });

    if (fresh.length > 0) {
      await tx.bankQuestion.createMany({
        data: fresh.map((q) => ({
          bankId,
          importBatchId: batch.id,
          stem: (q.stem ?? "").trim(),
          questionType: (q.questionType ?? "MULTIPLE_CHOICE") as QuestionType,
          options: (q.options ?? Prisma.DbNull) as Prisma.InputJsonValue,
          correctAnswer: (q.correctAnswer ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          explanation: q.explanation ?? null,
          points: q.points ?? 1,
          difficulty: q.difficulty ?? "MEDIUM",
          topics: q.topics ?? [],
          createdById: meta.importedById,
        })),
      });
    }

    return batch.id;
  });

  return {
    ok: true,
    batchId: result,
    imported: fresh.length,
    skipped: rejected.length,
    duplicates,
  };
}

/**
 * Undo an import.
 *
 * Only removes questions that no published exam has snapshotted — a question
 * already sat by a candidate is left alone, since deleting it would break the
 * provenance of their paper.
 */
export async function rollbackImport(
  batchId: string,
  client: PrismaClient = defaultClient,
): Promise<{ ok: false; error: string } | { ok: true; removed: number; kept: number }> {
  const batch = await client.questionImportBatch.findUnique({
    where: { id: batchId },
    select: { id: true },
  });
  if (!batch) return { ok: false, error: "Import not found" };

  const questions = await client.bankQuestion.findMany({
    where: { importBatchId: batchId },
    select: { id: true, _count: { select: { examUses: true } } },
  });

  const removable = questions.filter((q) => q._count.examUses === 0).map((q) => q.id);
  const kept = questions.length - removable.length;

  if (removable.length > 0) {
    await client.bankQuestion.deleteMany({ where: { id: { in: removable } } });
  }

  return { ok: true, removed: removable.length, kept };
}

/** Export a bank as CSV, so nobody is locked into us either. */
export async function exportBankAsCsv(
  bankId: string,
  client: PrismaClient = defaultClient,
): Promise<string> {
  const questions = await client.bankQuestion.findMany({
    where: { bankId, isArchived: false },
    orderBy: { createdAt: "asc" },
  });

  const escape = (value: unknown): string => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [
    "question,type,options,correct,explanation,points,difficulty,topics",
  ];

  for (const q of questions) {
    const options = Array.isArray(q.options) ? (q.options as unknown[]).join("|") : "";
    const correct = Array.isArray(q.correctAnswer)
      ? (q.correctAnswer as unknown[]).join("|")
      : typeof q.correctAnswer === "object" && q.correctAnswer !== null
        ? JSON.stringify(q.correctAnswer)
        : String(q.correctAnswer ?? "");

    lines.push(
      [
        escape(q.stem),
        escape(q.questionType.toLowerCase()),
        escape(options),
        escape(correct),
        escape(q.explanation ?? ""),
        escape(q.points),
        escape(q.difficulty.toLowerCase()),
        escape(q.topics.join("|")),
      ].join(","),
    );
  }

  return lines.join("\n");
}
