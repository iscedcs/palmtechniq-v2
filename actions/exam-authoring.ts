"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyExamScheduled } from "@/lib/exam/notifications";
import { createExamSchema, examSectionSchema, updateExamSchema } from "@/schemas/exam";
import { ExamStatus, Prisma, type PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Exam Center — tutor authoring.
 *
 * Everything here edits a DRAFT. Once an exam is published its questions are
 * snapshots and its roster is materialised, so structural edits are refused
 * rather than quietly corrupting an exam people may already be sitting.
 */

const prisma = db as PrismaClient;

type Guard =
  | { ok: true; tutorId: string; userId: string }
  | { ok: false; error: string };

/** Resolve the acting tutor. Admins act on behalf of the exam's owner. */
async function requireTutor(): Promise<Guard> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const tutor = await prisma.tutor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!tutor) return { ok: false, error: "You need a tutor profile to create exams" };
  return { ok: true, tutorId: tutor.id, userId: session.user.id };
}

/**
 * Authorise editing an exam, and optionally require it still be a draft.
 *
 * `draftOnly` is the guard that keeps published exams immutable — see the module
 * comment. Metadata edits (title, instructions) are allowed after publish;
 * anything structural is not.
 */
async function requireEditableExam(
  examId: string,
  { draftOnly }: { draftOnly: boolean },
): Promise<{ ok: true; status: ExamStatus } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERIOR";

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { status: true, tutor: { select: { userId: true } } },
  });
  if (!exam) return { ok: false, error: "Exam not found" };

  if (!isAdmin && exam.tutor.userId !== session.user.id) {
    return { ok: false, error: "Unauthorized" };
  }

  if (draftOnly && exam.status !== ExamStatus.DRAFT) {
    return {
      ok: false,
      error: "This exam is published. Questions and sections can no longer be changed.",
    };
  }

  return { ok: true, status: exam.status };
}

function revalidateExam(examId?: string) {
  revalidatePath("/tutor/exams");
  if (examId) revalidatePath(`/tutor/exams/${examId}`);
}

// ─── Exam ────────────────────────────────────────────────────────────────────

export async function createExam(input: unknown) {
  const guard = await requireTutor();
  if (!guard.ok) return { error: guard.error };

  const parsed = createExamSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }

  const data = parsed.data;

  const exam = await prisma.exam.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      instructions: data.instructions ?? null,
      scopeType: data.scopeType,
      courseId: "courseId" in data ? data.courseId : null,
      cohortId: "cohortId" in data ? data.cohortId : null,
      trackId: "trackId" in data ? data.trackId : null,
      tutorId: guard.tutorId,
      createdById: guard.userId,
    },
    select: { id: true },
  });

  revalidateExam(exam.id);
  return { success: true, examId: exam.id };
}

export async function updateExam(examId: string, input: unknown) {
  // Metadata and rules stay editable after publish; the structural guards live
  // on the section and question actions.
  const guard = await requireEditableExam(examId, { draftOnly: false });
  if (!guard.ok) return { error: guard.error };

  const parsed = updateExamSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }

  const data = parsed.data;

  // Changing the window on a live exam would move the goalposts mid-sitting.
  if (guard.status !== ExamStatus.DRAFT) {
    const touchesSchedule =
      data.opensAt !== undefined ||
      data.closesAt !== undefined ||
      data.durationMinutes !== undefined ||
      data.maxAttempts !== undefined;
    if (touchesSchedule) {
      return { error: "The schedule cannot be changed once an exam is published" };
    }
  }

  await prisma.exam.update({ where: { id: examId }, data });

  revalidateExam(examId);
  return { success: true };
}

export async function deleteExam(examId: string) {
  const guard = await requireEditableExam(examId, { draftOnly: true });
  if (!guard.ok) return { error: guard.error };

  await prisma.exam.delete({ where: { id: examId } });

  revalidateExam();
  return { success: true };
}

// ─── Sections ────────────────────────────────────────────────────────────────

export async function createSection(examId: string, input: unknown) {
  const guard = await requireEditableExam(examId, { draftOnly: true });
  if (!guard.ok) return { error: guard.error };

  const parsed = examSectionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the section and try again" };
  }

  const last = await prisma.examSection.findFirst({
    where: { examId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const section = await prisma.examSection.create({
    data: {
      examId,
      title: parsed.data.title,
      instructions: parsed.data.instructions ?? null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      timeLimitMinutes: parsed.data.timeLimitMinutes ?? null,
      selectionMode: parsed.data.selectionMode,
      drawBankId: parsed.data.drawBankId ?? null,
      drawCount: parsed.data.drawCount ?? null,
      drawDifficulty: parsed.data.drawDifficulty ?? null,
      drawTopics: parsed.data.drawTopics ?? [],
      drawPoints: parsed.data.drawPoints ?? null,
    },
    select: { id: true },
  });

  revalidateExam(examId);
  return { success: true, sectionId: section.id };
}

export async function updateSection(sectionId: string, input: unknown) {
  const section = await prisma.examSection.findUnique({
    where: { id: sectionId },
    select: { examId: true },
  });
  if (!section) return { error: "Section not found" };

  const guard = await requireEditableExam(section.examId, { draftOnly: true });
  if (!guard.ok) return { error: guard.error };

  const parsed = examSectionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the section and try again" };
  }

  await prisma.examSection.update({
    where: { id: sectionId },
    data: {
      title: parsed.data.title,
      instructions: parsed.data.instructions ?? null,
      timeLimitMinutes: parsed.data.timeLimitMinutes ?? null,
      selectionMode: parsed.data.selectionMode,
      drawBankId: parsed.data.drawBankId ?? null,
      drawCount: parsed.data.drawCount ?? null,
      drawDifficulty: parsed.data.drawDifficulty ?? null,
      drawTopics: parsed.data.drawTopics ?? [],
      drawPoints: parsed.data.drawPoints ?? null,
    },
  });

  revalidateExam(section.examId);
  return { success: true };
}

export async function deleteSection(sectionId: string) {
  const section = await prisma.examSection.findUnique({
    where: { id: sectionId },
    select: { examId: true },
  });
  if (!section) return { error: "Section not found" };

  const guard = await requireEditableExam(section.examId, { draftOnly: true });
  if (!guard.ok) return { error: guard.error };

  await prisma.examSection.delete({ where: { id: sectionId } });

  revalidateExam(section.examId);
  return { success: true };
}

// ─── Questions ───────────────────────────────────────────────────────────────

export type QuestionInput = {
  stem: string;
  questionType: string;
  options: unknown;
  correctAnswer: unknown;
  explanation?: string | null;
  points: number;
};

/**
 * Reject a question that cannot be marked.
 *
 * Cheap to check here and expensive to discover on exam day, when a whole cohort
 * has answered a multiple-choice question whose correct option is not among its
 * choices.
 */
function validateQuestion(input: QuestionInput): string | null {
  if (!input.stem?.trim()) return "Give the question some text";
  if (!Number.isFinite(input.points) || input.points < 0) {
    return "Points must be zero or more";
  }

  const needsOptions = ["MULTIPLE_CHOICE", "MULTI_SELECT"];
  if (needsOptions.includes(input.questionType)) {
    const options = Array.isArray(input.options) ? input.options : [];
    if (options.length < 2) return "Add at least two options";

    const answers = Array.isArray(input.correctAnswer)
      ? input.correctAnswer
      : [input.correctAnswer];
    if (answers.length === 0 || answers.every((a) => a === null || a === "")) {
      return "Mark which option is correct";
    }
    const asText = options.map((o) => String(o));
    if (!answers.every((a) => asText.includes(String(a)))) {
      return "The correct answer must be one of the options";
    }
  }

  if (input.questionType === "NUMERIC") {
    const value =
      input.correctAnswer !== null &&
      typeof input.correctAnswer === "object" &&
      "value" in (input.correctAnswer as object)
        ? (input.correctAnswer as { value: unknown }).value
        : input.correctAnswer;
    if (!Number.isFinite(Number(value))) return "Give a numeric correct answer";
  }

  if (input.questionType === "FILL_IN_BLANK") {
    const accepted = Array.isArray(input.correctAnswer)
      ? input.correctAnswer
      : [input.correctAnswer];
    if (accepted.length === 0 || accepted.every((a) => !String(a ?? "").trim())) {
      return "Give at least one accepted answer";
    }
  }

  if (input.questionType === "MATCHING") {
    const pairs = input.correctAnswer as Record<string, unknown> | null;
    if (!pairs || typeof pairs !== "object" || Object.keys(pairs).length === 0) {
      return "Add at least one pair to match";
    }
  }

  return null;
}

export async function createQuestion(sectionId: string, input: QuestionInput) {
  const section = await prisma.examSection.findUnique({
    where: { id: sectionId },
    select: { examId: true, selectionMode: true },
  });
  if (!section) return { error: "Section not found" };

  if (section.selectionMode === "RANDOM_DRAW") {
    return {
      error: "This section draws from a bank. Add the question to the bank instead.",
    };
  }

  const guard = await requireEditableExam(section.examId, { draftOnly: true });
  if (!guard.ok) return { error: guard.error };

  const problem = validateQuestion(input);
  if (problem) return { error: problem };

  const last = await prisma.examQuestion.findFirst({
    where: { sectionId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.examQuestion.create({
    data: {
      examId: section.examId,
      sectionId,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      stem: input.stem.trim(),
      questionType: input.questionType as never,
      options: (input.options ?? Prisma.DbNull) as Prisma.InputJsonValue,
      correctAnswer: (input.correctAnswer ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      explanation: input.explanation?.trim() || null,
      points: input.points,
    },
  });

  revalidateExam(section.examId);
  return { success: true };
}

export async function updateQuestion(questionId: string, input: QuestionInput) {
  const question = await prisma.examQuestion.findUnique({
    where: { id: questionId },
    select: { examId: true },
  });
  if (!question) return { error: "Question not found" };

  const guard = await requireEditableExam(question.examId, { draftOnly: true });
  if (!guard.ok) return { error: guard.error };

  const problem = validateQuestion(input);
  if (problem) return { error: problem };

  await prisma.examQuestion.update({
    where: { id: questionId },
    data: {
      stem: input.stem.trim(),
      questionType: input.questionType as never,
      options: (input.options ?? Prisma.DbNull) as Prisma.InputJsonValue,
      correctAnswer: (input.correctAnswer ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      explanation: input.explanation?.trim() || null,
      points: input.points,
    },
  });

  revalidateExam(question.examId);
  return { success: true };
}

export async function deleteQuestion(questionId: string) {
  const question = await prisma.examQuestion.findUnique({
    where: { id: questionId },
    select: { examId: true },
  });
  if (!question) return { error: "Question not found" };

  const guard = await requireEditableExam(question.examId, { draftOnly: true });
  if (!guard.ok) return { error: guard.error };

  await prisma.examQuestion.delete({ where: { id: questionId } });

  revalidateExam(question.examId);
  return { success: true };
}

export async function reorderQuestions(sectionId: string, orderedIds: string[]) {
  const section = await prisma.examSection.findUnique({
    where: { id: sectionId },
    select: { examId: true },
  });
  if (!section) return { error: "Section not found" };

  const guard = await requireEditableExam(section.examId, { draftOnly: true });
  if (!guard.ok) return { error: guard.error };

  await prisma.$transaction(
    orderedIds.map((id, sortOrder) =>
      prisma.examQuestion.update({ where: { id }, data: { sortOrder } }),
    ),
  );

  revalidateExam(section.examId);
  return { success: true };
}

// ─── Roster (ad-hoc exams and manual additions) ──────────────────────────────

export async function addCandidateByEmail(examId: string, email: string) {
  const guard = await requireEditableExam(examId, { draftOnly: false });
  if (!guard.ok) return { error: guard.error };

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true },
  });
  if (!user) return { error: "No account found with that email" };

  const existing = await prisma.examCandidate.findUnique({
    where: { examId_userId: { examId, userId: user.id } },
    select: { id: true },
  });
  if (existing) return { error: `${user.name} is already on the roster` };

  await prisma.examCandidate.create({
    data: { examId, userId: user.id, addedManually: true },
  });

  // Someone added to an exam that is already published needs telling; on a draft
  // there is nothing to tell them yet, and publish will handle it.
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { status: true },
  });
  if (exam && exam.status !== ExamStatus.DRAFT) {
    await notifyExamScheduled(examId, prisma);
  }

  revalidateExam(examId);
  return { success: true, name: user.name };
}

/**
 * Remove someone from the roster.
 *
 * A candidate who has already started is excluded rather than deleted, so their
 * attempt and anything already graded survive.
 */
export async function removeCandidate(candidateId: string, reason?: string) {
  const candidate = await prisma.examCandidate.findUnique({
    where: { id: candidateId },
    select: { examId: true, _count: { select: { attempts: true } } },
  });
  if (!candidate) return { error: "Candidate not found" };

  const guard = await requireEditableExam(candidate.examId, { draftOnly: false });
  if (!guard.ok) return { error: guard.error };

  if (candidate._count.attempts > 0) {
    await prisma.examCandidate.update({
      where: { id: candidateId },
      data: { excludedAt: new Date(), excludeReason: reason ?? null },
    });
  } else {
    await prisma.examCandidate.delete({ where: { id: candidateId } });
  }

  revalidateExam(candidate.examId);
  return { success: true };
}

/** Grant an accommodation: extra time, extra attempts, or a makeup window. */
export async function updateAccommodation(
  candidateId: string,
  input: {
    extraTimeMultiplier?: number;
    extraTimeMinutes?: number;
    extraAttempts?: number;
    windowOpensAt?: string | null;
    windowClosesAt?: string | null;
  },
) {
  const candidate = await prisma.examCandidate.findUnique({
    where: { id: candidateId },
    select: { examId: true },
  });
  if (!candidate) return { error: "Candidate not found" };

  const guard = await requireEditableExam(candidate.examId, { draftOnly: false });
  if (!guard.ok) return { error: guard.error };

  if (input.extraTimeMultiplier !== undefined && input.extraTimeMultiplier < 1) {
    return { error: "A time multiplier cannot reduce the standard duration" };
  }

  await prisma.examCandidate.update({
    where: { id: candidateId },
    data: {
      extraTimeMultiplier: input.extraTimeMultiplier,
      extraTimeMinutes: input.extraTimeMinutes,
      extraAttempts: input.extraAttempts,
      windowOpensAt: input.windowOpensAt ? new Date(input.windowOpensAt) : undefined,
      windowClosesAt: input.windowClosesAt ? new Date(input.windowClosesAt) : undefined,
    },
  });

  revalidateExam(candidate.examId);
  return { success: true };
}

/** Admit a candidate under MANUAL_RELEASE. */
export async function admitCandidate(candidateId: string) {
  const candidate = await prisma.examCandidate.findUnique({
    where: { id: candidateId },
    select: { examId: true },
  });
  if (!candidate) return { error: "Candidate not found" };

  const guard = await requireEditableExam(candidate.examId, { draftOnly: false });
  if (!guard.ok) return { error: guard.error };

  await prisma.examCandidate.update({
    where: { id: candidateId },
    data: { admittedAt: new Date() },
  });

  revalidateExam(candidate.examId);
  return { success: true };
}
