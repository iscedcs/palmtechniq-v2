"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { effectiveWindow } from "@/lib/exam/attempt";
import { ExamAttemptStatus, ExamStatus, type PrismaClient } from "@prisma/client";

const prisma = db as PrismaClient;

/** How an exam presents itself to the candidate right now. */
export type ExamAvailability =
  | "UPCOMING" // window has not opened
  | "OPEN" // sittable now
  | "IN_PROGRESS" // an attempt is running
  | "SUBMITTED" // sat and handed in
  | "MISSED" // window passed without an attempt
  | "CLOSED"; // over, and results not out

export type StudentExamSummary = {
  id: string;
  title: string;
  description: string | null;
  courseTitle: string | null;
  opensAt: Date | null;
  closesAt: Date | null;
  durationMinutes: number | null;
  totalPoints: number;
  passingScore: number;
  accessMode: string;
  availability: ExamAvailability;
  attemptsUsed: number;
  attemptsAllowed: number;
  activeAttemptId: string | null;
  resultReleased: boolean;
  percentage: number | null;
  passed: boolean | null;
};

/**
 * Every exam this candidate is rostered onto.
 *
 * Availability is computed against each candidate's own window, so someone with a
 * makeup sitting sees their window rather than the exam's.
 */
export async function getStudentExams(): Promise<StudentExamSummary[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = session.user.id;

  const candidacies = await prisma.examCandidate.findMany({
    where: { userId, excludedAt: null },
    include: {
      exam: { include: { course: { select: { title: true } } } },
      attempts: {
        where: { isPractice: false },
        orderBy: { attemptNumber: "desc" },
        include: { grade: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return candidacies
    .filter((c) => c.exam.status !== ExamStatus.DRAFT)
    .map((candidate) => {
      const exam = candidate.exam;
      const window = effectiveWindow(exam, candidate);

      const active = candidate.attempts.find(
        (a) => a.status === ExamAttemptStatus.IN_PROGRESS && a.expiresAt > now,
      );
      const submitted = candidate.attempts.filter(
        (a) => a.status !== ExamAttemptStatus.IN_PROGRESS,
      );
      const latestGrade = submitted[0]?.grade ?? null;
      const released = latestGrade?.status === "RELEASED";

      const attemptsAllowed = exam.maxAttempts + (candidate.extraAttempts || 0);
      const attemptsLeft = attemptsAllowed - candidate.attempts.length;

      // A personal window lets a candidate sit a makeup after the exam has closed
      // for everyone else — see startAttempt.
      const personalWindowOpen =
        !!candidate.windowClosesAt &&
        candidate.windowClosesAt > now &&
        (!candidate.windowOpensAt || candidate.windowOpensAt <= now);

      const windowOpen =
        personalWindowOpen ||
        ((!window.opensAt || now >= window.opensAt) &&
          (!window.closesAt || now < window.closesAt) &&
          (exam.status === ExamStatus.SCHEDULED || exam.status === ExamStatus.LIVE));

      let availability: ExamAvailability;
      if (active) {
        availability = "IN_PROGRESS";
      } else if (attemptsLeft > 0 && windowOpen) {
        // Open even after a previous submission — this is what makes a granted
        // retry actually usable. Without it, "Allow retry" bumped the allowance
        // and the student still saw a finished exam with no way back in.
        availability = "OPEN";
      } else if (submitted.length > 0) {
        availability = "SUBMITTED";
      } else if (window.opensAt && now < window.opensAt) {
        availability = "UPCOMING";
      } else if (window.closesAt && now >= window.closesAt) {
        availability = "MISSED";
      } else {
        availability = "CLOSED";
      }

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        courseTitle: exam.course?.title ?? null,
        opensAt: window.opensAt,
        closesAt: window.closesAt,
        durationMinutes: exam.durationMinutes,
        totalPoints: exam.totalPoints,
        passingScore: exam.passingScore,
        accessMode: exam.accessMode,
        availability,
        attemptsUsed: candidate.attempts.length,
        attemptsAllowed,
        activeAttemptId: active?.id ?? null,
        resultReleased: released,
        // Scores stay hidden until the tutor releases them.
        percentage: released ? (latestGrade?.percentage ?? null) : null,
        passed: released ? (latestGrade?.passed ?? null) : null,
      };
    });
}

export type ExamBriefing = StudentExamSummary & {
  instructions: string | null;
  requiresAccessCode: boolean;
  questionCount: number;
  extraTimeMinutes: number;
  extraTimeMultiplier: number;
};

/**
 * The pre-exam briefing. Deliberately does not touch questions — reading the
 * briefing must never create an attempt or reveal any of the paper.
 */
export async function getExamBriefing(examId: string): Promise<ExamBriefing | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const all = await getStudentExams();
  const summary = all.find((e) => e.id === examId);
  if (!summary) return null;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { instructions: true, accessMode: true },
  });

  const candidate = await prisma.examCandidate.findUnique({
    where: { examId_userId: { examId, userId: session.user.id } },
    select: { extraTimeMinutes: true, extraTimeMultiplier: true },
  });

  // How many questions this candidate will face — the sum of fixed questions and
  // each drawing section's draw count, never the size of the underlying pool.
  const sections = await prisma.examSection.findMany({
    where: { examId },
    select: {
      selectionMode: true,
      drawCount: true,
      _count: { select: { questions: true } },
    },
  });

  const questionCount = sections.reduce(
    (total, s) =>
      total +
      (s.selectionMode === "FIXED" ? s._count.questions : (s.drawCount ?? 0)),
    0,
  );

  return {
    ...summary,
    instructions: exam?.instructions ?? null,
    requiresAccessCode: exam?.accessMode === "ACCESS_CODE",
    questionCount,
    extraTimeMinutes: candidate?.extraTimeMinutes ?? 0,
    extraTimeMultiplier: candidate?.extraTimeMultiplier ?? 1,
  };
}
