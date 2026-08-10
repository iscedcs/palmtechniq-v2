"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { PrismaClient } from "@prisma/client";

const prisma = db as PrismaClient;

async function actingTutorId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const tutor = await prisma.tutor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return tutor?.id ?? null;
}

/** Banks this tutor owns, plus any shared with them. */
export async function getTutorBanks() {
  const tutorId = await actingTutorId();
  if (!tutorId) return [];

  const banks = await prisma.questionBank.findMany({
    where: {
      isArchived: false,
      OR: [{ ownerId: tutorId }, { shares: { some: { tutorId } } }],
    },
    include: {
      course: { select: { title: true } },
      owner: { select: { user: { select: { name: true } } } },
      shares: { where: { tutorId }, select: { access: true } },
      _count: { select: { questions: true, shares: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return banks.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    courseTitle: b.course?.title ?? null,
    ownerName: b.owner.user.name,
    isOwn: b.ownerId === tutorId,
    // An owner always has full access; a share may only grant VIEW.
    canEdit: b.ownerId === tutorId || b.shares[0]?.access === "EDIT",
    questionCount: b._count.questions,
    shareCount: b._count.shares,
    updatedAt: b.updatedAt,
  }));
}

export type BankDetail = NonNullable<Awaited<ReturnType<typeof getBankDetail>>>;

export async function getBankDetail(bankId: string) {
  const tutorId = await actingTutorId();
  if (!tutorId) return null;

  const bank = await prisma.questionBank.findUnique({
    where: { id: bankId },
    include: {
      course: { select: { id: true, title: true } },
      owner: { select: { id: true, user: { select: { name: true } } } },
      shares: {
        include: { tutor: { select: { id: true, user: { select: { name: true, email: true } } } } },
      },
      questions: {
        where: { isArchived: false },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { examUses: true } } },
      },
      _count: { select: { questions: true } },
    },
  });

  if (!bank) return null;

  const isOwner = bank.ownerId === tutorId;
  const share = bank.shares.find((s) => s.tutorId === tutorId);
  if (!isOwner && !share) return null;

  const batches = await prisma.questionImportBatch.findMany({
    where: { bankId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { importedBy: { select: { name: true } } },
  });

  // Topics and difficulties, for the draw filters on an exam section.
  const topicCounts = new Map<string, number>();
  for (const q of bank.questions) {
    for (const topic of q.topics) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
  }

  return {
    id: bank.id,
    title: bank.title,
    description: bank.description,
    courseTitle: bank.course?.title ?? null,
    ownerName: bank.owner.user.name,
    isOwner,
    canEdit: isOwner || share?.access === "EDIT",
    questions: bank.questions.map((q) => ({
      id: q.id,
      stem: q.stem,
      questionType: q.questionType,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points,
      difficulty: q.difficulty,
      topics: q.topics,
      version: q.version,
      usedInExams: q._count.examUses,
      importBatchId: q.importBatchId,
    })),
    shares: bank.shares.map((s) => ({
      id: s.id,
      tutorId: s.tutorId,
      name: s.tutor.user.name,
      email: s.tutor.user.email,
      access: s.access,
    })),
    batches: batches.map((b) => ({
      id: b.id,
      sourceFormat: b.sourceFormat,
      sourceName: b.sourceName,
      totalRows: b.totalRows,
      importedCount: b.importedCount,
      skippedCount: b.skippedCount,
      importedBy: b.importedBy?.name ?? "Unknown",
      createdAt: b.createdAt,
    })),
    topics: Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, count })),
    difficultyCounts: {
      EASY: bank.questions.filter((q) => q.difficulty === "EASY").length,
      MEDIUM: bank.questions.filter((q) => q.difficulty === "MEDIUM").length,
      HARD: bank.questions.filter((q) => q.difficulty === "HARD").length,
    },
  };
}

/**
 * How many questions a draw would actually find.
 *
 * Lets the exam editor tell a tutor "this draws 10 but only 4 match" while they
 * are setting it up, rather than at publish.
 */
export async function countDrawPool(input: {
  bankId: string;
  difficulty?: string | null;
  topics?: string[];
}) {
  const tutorId = await actingTutorId();
  if (!tutorId) return 0;

  return prisma.bankQuestion.count({
    where: {
      bankId: input.bankId,
      isArchived: false,
      ...(input.difficulty ? { difficulty: input.difficulty as never } : {}),
      ...(input.topics && input.topics.length > 0
        ? { topics: { hasSome: input.topics } }
        : {}),
    },
  });
}
