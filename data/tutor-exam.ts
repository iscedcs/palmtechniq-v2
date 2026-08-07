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

export async function getTutorExams() {
  const tutorId = await actingTutorId();
  if (!tutorId) return [];

  const exams = await prisma.exam.findMany({
    where: { tutorId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      course: { select: { title: true } },
      cohort: { select: { displayName: true } },
      track: { select: { name: true } },
      _count: { select: { candidates: true, questions: true, attempts: true } },
    },
  });

  return exams.map((exam) => ({
    id: exam.id,
    title: exam.title,
    status: exam.status,
    scopeType: exam.scopeType,
    scopeLabel:
      exam.course?.title ??
      exam.cohort?.displayName ??
      exam.track?.name ??
      "Selected students",
    opensAt: exam.opensAt,
    closesAt: exam.closesAt,
    durationMinutes: exam.durationMinutes,
    totalPoints: exam.totalPoints,
    candidateCount: exam._count.candidates,
    questionCount: exam._count.questions,
    attemptCount: exam._count.attempts,
  }));
}

export type TutorExamDetail = NonNullable<Awaited<ReturnType<typeof getTutorExamDetail>>>;

/**
 * The full editor payload.
 *
 * Unlike the candidate's read model this DOES include correct answers — a tutor
 * is allowed to see them. Authorisation is therefore the whole safety story here.
 */
export async function getTutorExamDetail(examId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERIOR";

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      tutor: { select: { userId: true } },
      course: { select: { id: true, title: true } },
      cohort: { select: { id: true, displayName: true } },
      track: { select: { id: true, name: true } },
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          questions: { orderBy: { sortOrder: "asc" } },
          drawBank: { select: { id: true, title: true } },
        },
      },
      candidates: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          attempts: {
            orderBy: { attemptNumber: "desc" },
            select: { id: true, status: true, submittedAt: true },
          },
        },
      },
      _count: { select: { attempts: true } },
    },
  });

  if (!exam) return null;
  if (!isAdmin && exam.tutor.userId !== session.user.id) return null;

  return exam;
}

/** Everything this tutor could scope a new exam to. */
export async function getExamScopeOptions() {
  const tutorId = await actingTutorId();
  if (!tutorId) return { courses: [], cohorts: [], tracks: [] };

  const [courses, cohorts, tracks] = await Promise.all([
    prisma.course.findMany({
      where: { tutorId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.programCohort.findMany({
      where: { isOpen: true },
      select: { id: true, displayName: true },
      orderBy: { startDate: "desc" },
      take: 50,
    }),
    prisma.bootcampTrack.findMany({
      select: { id: true, name: true, bootcamp: { select: { title: true } } },
      orderBy: { sortOrder: "asc" },
      take: 50,
    }),
  ]);

  return {
    courses,
    cohorts,
    tracks: tracks.map((t) => ({ id: t.id, name: `${t.bootcamp.title} — ${t.name}` })),
  };
}

/** Question banks this tutor may draw from: their own, plus anything shared. */
export async function getAvailableBanks() {
  const tutorId = await actingTutorId();
  if (!tutorId) return [];

  const banks = await prisma.questionBank.findMany({
    where: {
      isArchived: false,
      OR: [{ ownerId: tutorId }, { shares: { some: { tutorId } } }],
    },
    select: {
      id: true,
      title: true,
      ownerId: true,
      _count: { select: { questions: true } },
    },
    orderBy: { title: "asc" },
  });

  return banks.map((b) => ({
    id: b.id,
    title: b.title,
    questionCount: b._count.questions,
    isOwn: b.ownerId === tutorId,
  }));
}
