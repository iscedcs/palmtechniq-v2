"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { effectiveWindow } from "@/lib/exam/attempt";
import { ExamAttemptStatus, type PrismaClient } from "@prisma/client";

const prisma = db as PrismaClient;

export type MonitorRow = {
  candidateId: string;
  userId: string;
  name: string;
  email: string;
  status: string;
  excluded: boolean;
  admitted: boolean;
  attemptId: string | null;
  attemptStatus: string | null;
  startedAt: Date | null;
  expiresAt: Date | null;
  submittedAt: Date | null;
  submittedBy: string | null;
  lastHeartbeatAt: Date | null;
  answered: number;
  totalQuestions: number;
  extraTimeMinutes: number;
  flags: { warning: number; critical: number; total: number };
};

export type MonitorSnapshot = {
  examId: string;
  title: string;
  status: string;
  serverTime: Date;
  opensAt: Date | null;
  closesAt: Date | null;
  durationMinutes: number | null;
  counts: {
    total: number;
    notStarted: number;
    inProgress: number;
    submitted: number;
    missed: number;
  };
  rows: MonitorRow[];
};

/**
 * A point-in-time view of who is sitting the exam.
 *
 * Deliberately returns `serverTime` alongside the rows so the page can count
 * down against the same clock the engine uses. A monitor that disagreed with the
 * server about how long someone has left would be worse than no monitor.
 */
export async function getExamMonitor(examId: string): Promise<MonitorSnapshot | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERIOR";

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      tutor: { select: { userId: true } },
      candidates: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          attempts: {
            where: { isPractice: false },
            orderBy: { attemptNumber: "desc" },
            include: {
              _count: { select: { responses: true } },
              events: { select: { severity: true } },
            },
          },
        },
      },
    },
  });

  if (!exam) return null;
  if (!isAdmin && exam.tutor.userId !== session.user.id) return null;

  const serverTime = new Date();

  const rows: MonitorRow[] = exam.candidates.map((candidate) => {
    const latest = candidate.attempts[0] ?? null;
    const events = latest?.events ?? [];

    return {
      candidateId: candidate.id,
      userId: candidate.user.id,
      name: candidate.user.name,
      email: candidate.user.email,
      status: candidate.status,
      excluded: !!candidate.excludedAt,
      admitted: !!candidate.admittedAt,
      attemptId: latest?.id ?? null,
      attemptStatus: latest?.status ?? null,
      startedAt: latest?.startedAt ?? null,
      expiresAt: latest?.expiresAt ?? null,
      submittedAt: latest?.submittedAt ?? null,
      submittedBy: latest?.submittedBy ?? null,
      lastHeartbeatAt: latest?.lastHeartbeatAt ?? null,
      answered: latest?._count.responses ?? 0,
      totalQuestions: latest?.questionOrder.length ?? 0,
      extraTimeMinutes: candidate.extraTimeMinutes,
      flags: {
        warning: events.filter((e) => e.severity === "WARNING").length,
        critical: events.filter((e) => e.severity === "CRITICAL").length,
        total: events.length,
      },
    };
  });

  const active = rows.filter((r) => !r.excluded);
  const window = effectiveWindow(exam, {
    windowOpensAt: null,
    windowClosesAt: null,
  });

  return {
    examId: exam.id,
    title: exam.title,
    status: exam.status,
    serverTime,
    opensAt: window.opensAt,
    closesAt: window.closesAt,
    durationMinutes: exam.durationMinutes,
    counts: {
      total: active.length,
      notStarted: active.filter((r) => !r.attemptId).length,
      inProgress: active.filter((r) => r.attemptStatus === ExamAttemptStatus.IN_PROGRESS)
        .length,
      submitted: active.filter(
        (r) =>
          r.attemptStatus === ExamAttemptStatus.SUBMITTED ||
          r.attemptStatus === ExamAttemptStatus.AUTO_SUBMITTED,
      ).length,
      missed: active.filter((r) => r.status === "MISSED").length,
    },
    rows,
  };
}

/** The integrity log for one attempt, for the drill-down. */
export async function getAttemptEvents(attemptId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: { exam: { select: { tutor: { select: { userId: true } } } } },
  });
  if (!attempt) return [];

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERIOR";
  if (!isAdmin && attempt.exam.tutor.userId !== session.user.id) return [];

  return prisma.examEvent.findMany({
    where: { attemptId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      type: true,
      severity: true,
      metadata: true,
      ipAddress: true,
      createdAt: true,
    },
  });
}
