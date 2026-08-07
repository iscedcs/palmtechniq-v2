import { db } from "@/lib/db";
import { isAutoGraded } from "@/lib/exam/grading";
import {
  ExamGradeStatus,
  ExamStatus,
  Prisma,
  type PrismaClient,
} from "@prisma/client";
import { randomUUID } from "crypto";

/**
 * Exam Center — manual grading and results release.
 *
 * Two rules shape everything here:
 *
 *   1. Every score change is audited — who, when, old, new, why (design doc §5.7).
 *      A disputed grade has to be reconstructable months later.
 *   2. Release is deliberate and separate from grading. Marking a paper does not
 *      show anyone anything; releasing does, and that is also the moment
 *      certificates are issued (§7.4).
 */

const defaultClient = db as PrismaClient;
type AnyClient = PrismaClient | Prisma.TransactionClient;

// ─── Audit ───────────────────────────────────────────────────────────────────

async function audit(
  client: AnyClient,
  gradeId: string,
  changedById: string | null,
  field: string,
  oldValue: unknown,
  newValue: unknown,
  reason?: string | null,
) {
  await client.examGradeAudit.create({
    data: {
      gradeId,
      changedById,
      field,
      oldValue: oldValue === null || oldValue === undefined ? null : String(oldValue),
      newValue: newValue === null || newValue === undefined ? null : String(newValue),
      reason: reason ?? null,
    },
  });
}

// ─── Recompute ───────────────────────────────────────────────────────────────

export type RecomputedGrade = {
  autoScore: number;
  manualScore: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  pendingManual: number;
};

/**
 * Recompute a grade from its responses.
 *
 * The single source of truth for what an attempt is worth. Marking a paper,
 * overriding a score, and submitting all funnel through this so the three can
 * never disagree.
 *
 * Note it recomputes from `questionOrder`, not from the responses that exist —
 * an unanswered question still contributes its points to `maxScore`, so skipping
 * a question is never rewarded with a smaller denominator.
 */
export async function recomputeGrade(
  client: AnyClient,
  attemptId: string,
): Promise<RecomputedGrade> {
  const attempt = await client.examAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    select: { questionOrder: true, exam: { select: { passingScore: true } } },
  });

  const questions = await client.examQuestion.findMany({
    where: { id: { in: attempt.questionOrder } },
    select: { id: true, questionType: true, points: true },
  });

  const responses = await client.examResponse.findMany({
    where: { attemptId },
    select: { questionId: true, autoScore: true, manualScore: true },
  });
  const byQuestion = new Map(responses.map((r) => [r.questionId, r]));

  let autoScore = 0;
  let manualScore = 0;
  let maxScore = 0;
  let pendingManual = 0;

  for (const question of questions) {
    maxScore += question.points;
    const response = byQuestion.get(question.id);

    if (isAutoGraded(question.questionType)) {
      autoScore += response?.autoScore ?? 0;
      continue;
    }

    if (response?.manualScore === null || response?.manualScore === undefined) {
      pendingManual++;
    } else {
      manualScore += response.manualScore;
    }
  }

  const totalScore = autoScore + manualScore;
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    autoScore,
    manualScore,
    totalScore,
    maxScore,
    percentage,
    // A paper with marking outstanding is never "passed" — the number is provisional.
    passed: pendingManual === 0 && percentage >= attempt.exam.passingScore,
    pendingManual,
  };
}

// ─── Manual marking ──────────────────────────────────────────────────────────

/**
 * Mark one subjective answer.
 *
 * Rejects a score above the question's own points — a typo in the marking box
 * should not hand out 500% on an essay.
 */
export async function applyManualScore(
  responseId: string,
  score: number,
  graderId: string,
  feedback: string | null,
  client: PrismaClient = defaultClient,
): Promise<{ ok: false; error: string } | { ok: true; grade: RecomputedGrade }> {
  const response = await client.examResponse.findUnique({
    where: { id: responseId },
    include: {
      question: { select: { points: true, questionType: true } },
      attempt: { select: { id: true, examId: true } },
    },
  });
  if (!response) return { ok: false, error: "Answer not found" };

  if (isAutoGraded(response.question.questionType)) {
    return { ok: false, error: "This question is marked automatically" };
  }
  if (!Number.isFinite(score) || score < 0) {
    return { ok: false, error: "A score cannot be negative" };
  }
  if (score > response.question.points) {
    return {
      ok: false,
      error: `This question is worth ${response.question.points} points`,
    };
  }

  const result = await client.$transaction(async (tx) => {
    const previous = response.manualScore;

    await tx.examResponse.update({
      where: { id: responseId },
      data: {
        manualScore: score,
        feedback,
        gradedById: graderId,
        gradedAt: new Date(),
        isCorrect: score >= response.question.points,
      },
    });

    const recomputed = await recomputeGrade(tx, response.attempt.id);

    const grade = await tx.examGrade.findUnique({
      where: { attemptId: response.attempt.id },
      select: { id: true, status: true },
    });

    if (grade) {
      await tx.examGrade.update({
        where: { id: grade.id },
        data: {
          autoScore: recomputed.autoScore,
          manualScore: recomputed.manualScore,
          totalScore: recomputed.totalScore,
          maxScore: recomputed.maxScore,
          percentage: recomputed.percentage,
          passed: recomputed.passed,
          // Marking after release keeps it released — the student already has a
          // result and hiding it again would be worse than updating it.
          status:
            grade.status === ExamGradeStatus.RELEASED
              ? ExamGradeStatus.RELEASED
              : recomputed.pendingManual > 0
                ? ExamGradeStatus.PENDING_MANUAL
                : ExamGradeStatus.GRADED,
        },
      });

      await audit(
        tx,
        grade.id,
        graderId,
        `response:${responseId}`,
        previous,
        score,
        feedback ? "marked with feedback" : "marked",
      );
    }

    return recomputed;
  });

  return { ok: true, grade: result };
}

// ─── Override ────────────────────────────────────────────────────────────────

/**
 * Override a final score, with a reason.
 *
 * If the override pushes someone below the pass mark and a certificate was
 * already issued, it is REVOKED rather than deleted — the id may already be in
 * circulation and a verification lookup must still resolve, showing it as void
 * (design doc §7.4).
 */
export async function overrideGrade(
  gradeId: string,
  newTotal: number,
  reason: string,
  userId: string,
  client: PrismaClient = defaultClient,
): Promise<{ ok: false; error: string } | { ok: true; passed: boolean }> {
  if (!reason?.trim()) {
    return { ok: false, error: "An override needs a reason" };
  }

  const grade = await client.examGrade.findUnique({
    where: { id: gradeId },
    include: { exam: { select: { passingScore: true } } },
  });
  if (!grade) return { ok: false, error: "Grade not found" };

  if (!Number.isFinite(newTotal) || newTotal < 0 || newTotal > grade.maxScore) {
    return { ok: false, error: `A score must be between 0 and ${grade.maxScore}` };
  }

  const percentage = grade.maxScore > 0 ? (newTotal / grade.maxScore) * 100 : 0;
  const passed = percentage >= grade.exam.passingScore;

  await client.$transaction(async (tx) => {
    await tx.examGrade.update({
      where: { id: gradeId },
      data: {
        totalScore: newTotal,
        percentage,
        passed,
        overriddenById: userId,
        overrideReason: reason.trim(),
        overriddenAt: new Date(),
      },
    });

    await audit(tx, gradeId, userId, "totalScore", grade.totalScore, newTotal, reason.trim());

    if (grade.certificateId) {
      const shouldRevoke = !passed;
      const certificate = await tx.certificate.findUnique({
        where: { id: grade.certificateId },
        select: { isRevoked: true },
      });

      if (certificate && certificate.isRevoked !== shouldRevoke) {
        await tx.certificate.update({
          where: { id: grade.certificateId },
          data: { isRevoked: shouldRevoke },
        });
        await audit(
          tx,
          gradeId,
          userId,
          "certificate.isRevoked",
          certificate.isRevoked,
          shouldRevoke,
          shouldRevoke ? "score fell below the pass mark" : "score restored above the pass mark",
        );
      }
    }
  });

  return { ok: true, passed };
}

// ─── Release ─────────────────────────────────────────────────────────────────

export type ReleaseReport = {
  released: number;
  skippedPendingManual: number;
  certificatesIssued: number;
  certificatesSkipped: number;
  certificateNote?: string;
};

/**
 * Release results for an exam.
 *
 * Only fully-marked grades are released — anything still awaiting a human is
 * left alone and reported, so releasing early cannot publish a provisional score
 * as though it were final.
 *
 * Idempotent: already-released grades are skipped, and a certificate is never
 * issued twice for the same student and course.
 */
export async function releaseExamResults(
  examId: string,
  releasedById: string,
  client: PrismaClient = defaultClient,
): Promise<{ ok: false; error: string } | ({ ok: true } & ReleaseReport)> {
  const exam = await client.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      title: true,
      courseId: true,
      scopeType: true,
      isFinalAssessment: true,
      status: true,
    },
  });
  if (!exam) return { ok: false, error: "Exam not found" };

  const pending = await client.examGrade.count({
    where: { examId, status: ExamGradeStatus.PENDING_MANUAL },
  });

  const ready = await client.examGrade.findMany({
    where: { examId, status: ExamGradeStatus.GRADED },
    select: { id: true, userId: true, passed: true, certificateId: true },
  });

  if (ready.length === 0) {
    return {
      ok: true,
      released: 0,
      skippedPendingManual: pending,
      certificatesIssued: 0,
      certificatesSkipped: 0,
      certificateNote:
        pending > 0 ? "Nothing to release — every paper still has marking outstanding." : undefined,
    };
  }

  const now = new Date();
  let certificatesIssued = 0;
  let certificatesSkipped = 0;
  let certificateNote: string | undefined;

  // A Certificate requires a courseId, so only a course-scoped exam can issue
  // one. A cohort or bootcamp final still releases its results; it just cannot
  // mint a certificate against the current model.
  const canIssueCertificates = exam.isFinalAssessment && !!exam.courseId;
  if (exam.isFinalAssessment && !exam.courseId) {
    certificateNote =
      "Results released, but certificates were not issued: certificates are tied to a course and this exam is not course-scoped.";
  }

  await client.$transaction(
    async (tx) => {
      for (const grade of ready) {
        await tx.examGrade.update({
          where: { id: grade.id },
          data: {
            status: ExamGradeStatus.RELEASED,
            releasedAt: now,
            releasedById,
          },
        });
        await audit(tx, grade.id, releasedById, "status", "GRADED", "RELEASED", "results released");

        if (!canIssueCertificates || !grade.passed || grade.certificateId) continue;

        // Never issue a second certificate for the same student and course.
        const existing = await tx.certificate.findFirst({
          where: { userId: grade.userId, courseId: exam.courseId! },
          select: { id: true },
        });

        if (existing) {
          await tx.examGrade.update({
            where: { id: grade.id },
            data: { certificateId: existing.id },
          });
          certificatesSkipped++;
          continue;
        }

        const user = await tx.user.findUnique({
          where: { id: grade.userId },
          select: { name: true },
        });

        const certificate = await tx.certificate.create({
          data: {
            certificateId: `PTQ-${now.getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
            title: exam.title,
            description: `Awarded for passing ${exam.title}.`,
            userId: grade.userId,
            courseId: exam.courseId!,
            studentName: user?.name ?? "Student",
          },
          select: { id: true },
        });

        await tx.examGrade.update({
          where: { id: grade.id },
          data: { certificateId: certificate.id },
        });
        await audit(
          tx,
          grade.id,
          releasedById,
          "certificateId",
          null,
          certificate.id,
          "certificate issued on release",
        );

        certificatesIssued++;
      }

      // Only move the exam itself on once nothing is outstanding.
      if (pending === 0) {
        await tx.exam.update({
          where: { id: examId },
          data: { status: ExamStatus.RELEASED, resultsReleasedAt: now },
        });
      } else {
        await tx.exam.updateMany({
          where: { id: examId, status: { in: [ExamStatus.CLOSED, ExamStatus.LIVE] } },
          data: { status: ExamStatus.GRADING },
        });
      }
    },
    { timeout: 60_000, maxWait: 15_000 },
  );

  return {
    ok: true,
    released: ready.length,
    skippedPendingManual: pending,
    certificatesIssued,
    certificatesSkipped,
    certificateNote,
  };
}
