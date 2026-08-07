import { db } from "@/lib/db";
import { isAutoGraded, scoreResponse, shuffledOptionOrder } from "@/lib/exam/grading";
import {
  ExamAttemptStatus,
  ExamCandidateStatus,
  ExamEventSeverity,
  ExamEventType,
  ExamGradeStatus,
  ExamStatus,
  ExamSubmittedBy,
  Prisma,
  type PrismaClient,
} from "@prisma/client";

/**
 * Exam Center — the attempt engine.
 *
 * The rules this file exists to enforce, from docs/EXAM-CENTER-DESIGN.md §5:
 *
 *   1. The SERVER owns the clock. `expiresAt` is computed once, at start, and
 *      stored. Resuming after a disconnect returns the original value — losing
 *      your connection costs you the time you were away, and gains you nothing.
 *   2. Correct answers NEVER reach the client mid-attempt.
 *   3. Autosave is idempotent and tolerates out-of-order flushes after an
 *      offline period.
 *   4. Submit is idempotent. Manual submit, auto-submit and a retried request
 *      converge on exactly one grade.
 *   6. One active attempt per candidate. A second device is refused and logged.
 */

const defaultClient = db as PrismaClient;
type AnyClient = PrismaClient | Prisma.TransactionClient;

export type EngineFailure = { ok: false; error: string; code?: string };

// ─── Timing ──────────────────────────────────────────────────────────────────

/**
 * The window this specific candidate may sit in, after accommodations.
 *
 * A per-candidate window overrides the exam's entirely, which is what makes
 * makeup sittings work without any separate machinery.
 */
export function effectiveWindow(
  exam: { opensAt: Date | null; closesAt: Date | null },
  candidate: { windowOpensAt: Date | null; windowClosesAt: Date | null },
): { opensAt: Date | null; closesAt: Date | null } {
  return {
    opensAt: candidate.windowOpensAt ?? exam.opensAt,
    closesAt: candidate.windowClosesAt ?? exam.closesAt,
  };
}

/**
 * How long this candidate gets, in milliseconds, after accommodations.
 * The multiplier applies first, then flat extra minutes are added.
 */
export function effectiveDurationMs(
  exam: { durationMinutes: number | null },
  candidate: { extraTimeMultiplier: number; extraTimeMinutes: number },
): number {
  const base = (exam.durationMinutes ?? 0) * (candidate.extraTimeMultiplier || 1);
  return Math.round((base + (candidate.extraTimeMinutes || 0)) * 60_000);
}

/**
 * When this attempt dies.
 *
 * Capped at the window close: a candidate starting ten minutes before the end
 * gets ten minutes, not the full duration, because the hall shuts on time.
 */
export function computeExpiry(
  startedAt: Date,
  durationMs: number,
  windowClosesAt: Date | null,
): Date {
  const byDuration = new Date(startedAt.getTime() + durationMs);
  if (!windowClosesAt) return byDuration;
  return byDuration < windowClosesAt ? byDuration : windowClosesAt;
}

// ─── Paper selection ─────────────────────────────────────────────────────────

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Build this candidate's paper: the ordered question ids they will answer.
 *
 * FIXED sections contribute every question. RANDOM_DRAW sections contribute a
 * random `drawCount` from the pool that publish snapshotted — which is how two
 * candidates sit different papers cut from identical, frozen material.
 */
export async function drawPaper(
  client: AnyClient,
  examId: string,
  shuffleQuestions: boolean,
): Promise<string[]> {
  const sections = await client.examSection.findMany({
    where: { examId },
    orderBy: { sortOrder: "asc" },
    include: { questions: { orderBy: { sortOrder: "asc" }, select: { id: true } } },
  });

  const paper: string[] = [];

  for (const section of sections) {
    const ids = section.questions.map((q) => q.id);

    if (section.selectionMode === "FIXED") {
      paper.push(...(shuffleQuestions ? shuffle(ids) : ids));
      continue;
    }

    const take = Math.min(section.drawCount ?? ids.length, ids.length);
    paper.push(...shuffle(ids).slice(0, take));
  }

  return paper;
}

// ─── Start / resume ──────────────────────────────────────────────────────────

export type StartResult =
  | EngineFailure
  | {
      ok: true;
      attemptId: string;
      resumed: boolean;
      expiresAt: Date;
      questionCount: number;
    };

export type StartOptions = {
  accessCode?: string | null;
  deviceToken?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  isPractice?: boolean;
};

/**
 * Start a new attempt, or resume the one already running.
 *
 * Resuming is the same call — a candidate whose laptop died just calls start
 * again and gets their original attempt back, original expiry included.
 */
export async function startAttempt(
  examId: string,
  userId: string,
  options: StartOptions = {},
  client: PrismaClient = defaultClient,
): Promise<StartResult> {
  const exam = await client.exam.findUnique({ where: { id: examId } });
  if (!exam) return { ok: false, error: "Exam not found", code: "NOT_FOUND" };

  if (exam.status !== ExamStatus.SCHEDULED && exam.status !== ExamStatus.LIVE) {
    return {
      ok: false,
      error: `This exam is not open (${exam.status.toLowerCase()})`,
      code: "NOT_OPEN",
    };
  }

  const candidate = await client.examCandidate.findUnique({
    where: { examId_userId: { examId, userId } },
  });
  if (!candidate) {
    return { ok: false, error: "You are not on the roster for this exam", code: "NOT_ENROLLED" };
  }
  if (candidate.excludedAt) {
    return { ok: false, error: "You have been excluded from this exam", code: "EXCLUDED" };
  }

  const now = new Date();
  const window = effectiveWindow(exam, candidate);

  if (window.opensAt && now < window.opensAt) {
    return { ok: false, error: "This exam has not opened yet", code: "TOO_EARLY" };
  }
  if (window.closesAt && now >= window.closesAt) {
    return { ok: false, error: "This exam has closed", code: "TOO_LATE" };
  }

  if (exam.accessMode === "ACCESS_CODE") {
    if (!options.accessCode || options.accessCode.trim() !== exam.accessCode) {
      return { ok: false, error: "That access code is not correct", code: "BAD_CODE" };
    }
  }
  if (exam.accessMode === "MANUAL_RELEASE" && !candidate.admittedAt) {
    return {
      ok: false,
      error: "Your tutor has not admitted you to this exam yet",
      code: "NOT_ADMITTED",
    };
  }

  // ── Resume path ──
  const live = await client.examAttempt.findFirst({
    where: { examId, userId, status: ExamAttemptStatus.IN_PROGRESS, isPractice: false },
    orderBy: { attemptNumber: "desc" },
  });

  if (live) {
    // Expired but never submitted — close it out, then fall through to decide
    // whether another attempt is allowed.
    if (live.expiresAt <= now) {
      await submitAttempt(live.id, ExamSubmittedBy.AUTO, client);
    } else {
      // One active attempt per candidate. A different device is refused, not
      // silently handed the paper.
      if (
        options.deviceToken &&
        live.deviceLockToken &&
        live.deviceLockToken !== options.deviceToken
      ) {
        await logEvent(client, {
          attemptId: live.id,
          examId,
          userId,
          type: ExamEventType.SECOND_DEVICE_BLOCKED,
          severity: ExamEventSeverity.WARNING,
          ipAddress: options.ipAddress,
        });
        return {
          ok: false,
          error: "This exam is already open on another device",
          code: "SECOND_DEVICE",
        };
      }

      await client.examAttempt.update({
        where: { id: live.id },
        data: { lastHeartbeatAt: now },
      });

      return {
        ok: true,
        attemptId: live.id,
        resumed: true,
        // The ORIGINAL expiry. Reconnecting never buys time.
        expiresAt: live.expiresAt,
        questionCount: live.questionOrder.length,
      };
    }
  }

  // ── New attempt ──
  const used = await client.examAttempt.count({
    where: { examId, userId, isPractice: false },
  });
  const allowed = exam.maxAttempts + (candidate.extraAttempts || 0);
  if (used >= allowed) {
    return { ok: false, error: "You have used all your attempts", code: "NO_ATTEMPTS_LEFT" };
  }

  const paper = await drawPaper(client, examId, exam.shuffleQuestions);
  if (paper.length === 0) {
    return { ok: false, error: "This exam has no questions", code: "EMPTY_EXAM" };
  }

  const startedAt = new Date();
  const expiresAt = computeExpiry(
    startedAt,
    effectiveDurationMs(exam, candidate),
    window.closesAt,
  );

  try {
    const attempt = await client.examAttempt.create({
      data: {
        examId,
        candidateId: candidate.id,
        userId,
        attemptNumber: used + 1,
        status: ExamAttemptStatus.IN_PROGRESS,
        startedAt,
        expiresAt,
        lastHeartbeatAt: startedAt,
        questionOrder: paper,
        deviceLockToken: options.deviceToken ?? null,
        ipAddress: options.ipAddress ?? null,
        userAgent: options.userAgent ?? null,
        isPractice: options.isPractice ?? false,
      },
    });

    if (!attempt.isPractice) {
      await client.examCandidate.update({
        where: { id: candidate.id },
        data: { status: ExamCandidateStatus.IN_PROGRESS },
      });

      // First candidate through the door takes the exam live.
      if (exam.status === ExamStatus.SCHEDULED) {
        await client.exam.updateMany({
          where: { id: examId, status: ExamStatus.SCHEDULED },
          data: { status: ExamStatus.LIVE },
        });
      }
    }

    await logEvent(client, {
      attemptId: attempt.id,
      examId,
      userId,
      type: ExamEventType.ATTEMPT_STARTED,
      severity: ExamEventSeverity.INFO,
      ipAddress: options.ipAddress,
    });

    return {
      ok: true,
      attemptId: attempt.id,
      resumed: false,
      expiresAt: attempt.expiresAt,
      questionCount: paper.length,
    };
  } catch (error) {
    // Two tabs raced. The [examId, userId, attemptNumber] unique caught it —
    // hand back whichever attempt actually won rather than erroring.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await client.examAttempt.findFirst({
        where: { examId, userId, status: ExamAttemptStatus.IN_PROGRESS, isPractice: false },
        orderBy: { attemptNumber: "desc" },
      });
      if (existing) {
        return {
          ok: true,
          attemptId: existing.id,
          resumed: true,
          expiresAt: existing.expiresAt,
          questionCount: existing.questionOrder.length,
        };
      }
    }
    throw error;
  }
}

// ─── The paper, as the candidate sees it ─────────────────────────────────────

export type PaperQuestion = {
  id: string;
  sortOrder: number;
  stem: string;
  questionType: string;
  options: unknown;
  points: number;
  mediaUrls: string[];
  answer: unknown;
  isFlagged: boolean;
};

/**
 * The attempt as the candidate is allowed to see it.
 *
 * `correctAnswer` and `explanation` are never selected. This is the read model
 * for sitting an exam; reviewing a finished one is a different query with
 * different rules.
 */
export async function getAttemptPaper(
  attemptId: string,
  userId: string,
  client: PrismaClient = defaultClient,
): Promise<
  | EngineFailure
  | {
      ok: true;
      attemptId: string;
      expiresAt: Date;
      serverTime: Date;
      status: ExamAttemptStatus;
      questions: PaperQuestion[];
    }
> {
  const attempt = await client.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return { ok: false, error: "Attempt not found", code: "NOT_FOUND" };
  if (attempt.userId !== userId) return { ok: false, error: "Unauthorized", code: "FORBIDDEN" };

  const exam = await client.exam.findUniqueOrThrow({
    where: { id: attempt.examId },
    select: { shuffleOptions: true },
  });

  const questions = await client.examQuestion.findMany({
    where: { id: { in: attempt.questionOrder } },
    // Deliberately narrow: no correctAnswer, no explanation.
    select: {
      id: true,
      stem: true,
      questionType: true,
      options: true,
      points: true,
      mediaUrls: true,
    },
  });

  const responses = await client.examResponse.findMany({
    where: { attemptId },
    select: { questionId: true, answer: true, isFlagged: true },
  });
  const responseByQuestion = new Map(responses.map((r) => [r.questionId, r]));

  const byId = new Map(questions.map((q) => [q.id, q]));

  // questionOrder is the authority on sequence — the findMany above does not
  // preserve it.
  const ordered: PaperQuestion[] = attempt.questionOrder.flatMap((id, index) => {
    const q = byId.get(id);
    if (!q) return [];

    let options = q.options as unknown;
    if (exam.shuffleOptions && Array.isArray(options)) {
      const order = shuffledOptionOrder(attemptId, q.id, options.length);
      options = order.map((i) => (options as unknown[])[i]);
    }

    const saved = responseByQuestion.get(id);

    return [
      {
        id: q.id,
        sortOrder: index,
        stem: q.stem,
        questionType: q.questionType,
        options,
        points: q.points,
        mediaUrls: q.mediaUrls,
        answer: saved?.answer ?? null,
        isFlagged: saved?.isFlagged ?? false,
      },
    ];
  });

  return {
    ok: true,
    attemptId: attempt.id,
    expiresAt: attempt.expiresAt,
    // The client renders its countdown against this, not against its own clock.
    serverTime: new Date(),
    status: attempt.status,
    questions: ordered,
  };
}

// ─── Autosave ────────────────────────────────────────────────────────────────

export type SaveResult =
  | EngineFailure
  | { ok: true; savedAt: Date; stale?: boolean; expired?: boolean };

/**
 * Save one answer.
 *
 * Idempotent, and safe to call out of order: a queue flushed after an offline
 * period may arrive with older writes last, so an incoming save carrying an
 * older `clientSavedAt` than what is already stored is dropped rather than
 * clobbering newer work.
 */
export async function saveResponse(
  attemptId: string,
  userId: string,
  questionId: string,
  answer: unknown,
  options: { clientSavedAt?: Date | null; isFlagged?: boolean } = {},
  client: PrismaClient = defaultClient,
): Promise<SaveResult> {
  const attempt = await client.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      status: true,
      expiresAt: true,
      questionOrder: true,
    },
  });

  if (!attempt) return { ok: false, error: "Attempt not found", code: "NOT_FOUND" };
  if (attempt.userId !== userId) return { ok: false, error: "Unauthorized", code: "FORBIDDEN" };

  if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
    return { ok: false, error: "This attempt is already submitted", code: "NOT_IN_PROGRESS" };
  }

  // Past expiry the answer is refused and the attempt is closed out, so a client
  // with a slow clock cannot keep writing after time is up.
  if (attempt.expiresAt <= new Date()) {
    await submitAttempt(attemptId, ExamSubmittedBy.AUTO, client);
    return { ok: false, error: "Your time has run out", code: "EXPIRED" };
  }

  // Only questions actually on this candidate's paper.
  if (!attempt.questionOrder.includes(questionId)) {
    return { ok: false, error: "That question is not on your paper", code: "NOT_ON_PAPER" };
  }

  const existing = await client.examResponse.findUnique({
    where: { attemptId_questionId: { attemptId, questionId } },
    select: { clientSavedAt: true, savedAt: true },
  });

  if (
    existing?.clientSavedAt &&
    options.clientSavedAt &&
    existing.clientSavedAt > options.clientSavedAt
  ) {
    return { ok: true, savedAt: existing.savedAt, stale: true };
  }

  const savedAt = new Date();
  const payload = {
    answer: (answer ?? Prisma.DbNull) as Prisma.InputJsonValue,
    isFlagged: options.isFlagged ?? false,
    savedAt,
    clientSavedAt: options.clientSavedAt ?? null,
  };

  await client.examResponse.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, ...payload },
    update: payload,
  });

  await client.examAttempt.update({
    where: { id: attemptId },
    data: { lastHeartbeatAt: savedAt },
  });

  return { ok: true, savedAt };
}

// ─── Submit ──────────────────────────────────────────────────────────────────

export type SubmitResult =
  | EngineFailure
  | {
      ok: true;
      alreadySubmitted: boolean;
      gradeId: string;
      autoScore: number;
      maxScore: number;
      percentage: number;
      passed: boolean;
      status: ExamGradeStatus;
      pendingManual: number;
    };

/**
 * Submit an attempt and grade its objective portion.
 *
 * Idempotent by construction. The status flip is a conditional `updateMany` on
 * `status = IN_PROGRESS`, so exactly one caller can ever win it — whichever of
 * the manual submit, the auto-submit sweep, or a retried request gets there
 * first. Everyone else reads back the grade the winner wrote.
 *
 * The claim and the grading share ONE transaction, and that is load-bearing.
 * With the two split apart there is a window where the status has flipped but
 * the grade row does not exist yet, and a caller arriving inside it finds
 * nothing to return. Holding the row lock until the grade is committed means the
 * loser blocks, then reads a grade that is guaranteed to be there — so a
 * candidate pressing Submit at the same moment the sweep fires still gets their
 * result rather than a spurious error.
 */
export async function submitAttempt(
  attemptId: string,
  submittedBy: ExamSubmittedBy = ExamSubmittedBy.STUDENT,
  client: PrismaClient = defaultClient,
): Promise<SubmitResult> {
  return client.$transaction(
    async (tx): Promise<SubmitResult> => {
      const attempt = await tx.examAttempt.findUnique({
        where: { id: attemptId },
        include: { exam: true },
      });
      if (!attempt) return { ok: false, error: "Attempt not found", code: "NOT_FOUND" };

      const submittedAt = new Date();

      // The race gate. Only the caller that transitions the row proceeds; the
      // others block here until this transaction commits.
      const claimed = await tx.examAttempt.updateMany({
        where: { id: attemptId, status: ExamAttemptStatus.IN_PROGRESS },
        data: {
          status:
            submittedBy === ExamSubmittedBy.AUTO
              ? ExamAttemptStatus.AUTO_SUBMITTED
              : ExamAttemptStatus.SUBMITTED,
          submittedAt,
          submittedBy,
          timeSpentSeconds: Math.max(
            0,
            Math.round((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000),
          ),
        },
      });

      if (claimed.count === 0) {
        // Someone else submitted this. Their grade is committed by now.
        const existing = await tx.examGrade.findUnique({ where: { attemptId } });
        if (!existing) {
          return {
            ok: false,
            error: "This attempt is already submitted",
            code: "ALREADY_SUBMITTED",
          };
        }
        return {
          ok: true,
          alreadySubmitted: true,
          gradeId: existing.id,
          autoScore: existing.autoScore,
          maxScore: existing.maxScore,
          percentage: existing.percentage,
          passed: existing.passed,
          status: existing.status,
          pendingManual: 0,
        };
      }

      // ── Grade the objective portion ──
      const questions = await tx.examQuestion.findMany({
        where: { id: { in: attempt.questionOrder } },
        select: { id: true, questionType: true, correctAnswer: true, points: true },
      });

      const responses = await tx.examResponse.findMany({ where: { attemptId } });
      const responseByQuestion = new Map(responses.map((r) => [r.questionId, r]));

      let autoScore = 0;
      let maxScore = 0;
      let pendingManual = 0;

      for (const question of questions) {
        maxScore += question.points;

        const response = responseByQuestion.get(question.id);
        const outcome = scoreResponse(question, response?.answer ?? null);

        if (outcome.requiresManual) {
          pendingManual++;
          continue;
        }

        autoScore += outcome.score ?? 0;

        // Unanswered objective questions have no response row to annotate.
        if (response) {
          await tx.examResponse.update({
            where: { id: response.id },
            data: { autoScore: outcome.score, isCorrect: outcome.isCorrect },
          });
        }
      }

      const status =
        pendingManual > 0 ? ExamGradeStatus.PENDING_MANUAL : ExamGradeStatus.GRADED;

      // Percentage is provisional while anything is pending manual marking.
      const percentage = maxScore > 0 ? (autoScore / maxScore) * 100 : 0;
      const passed = pendingManual === 0 && percentage >= attempt.exam.passingScore;

      const grade = await tx.examGrade.upsert({
        where: { attemptId },
        create: {
          attemptId,
          examId: attempt.examId,
          userId: attempt.userId,
          autoScore,
          totalScore: autoScore,
          maxScore,
          percentage,
          passed,
          status,
        },
        update: { autoScore, totalScore: autoScore, maxScore, percentage, passed, status },
      });

      if (!attempt.isPractice) {
        await tx.examCandidate.update({
          where: { id: attempt.candidateId },
          data: { status: ExamCandidateStatus.SUBMITTED },
        });
      }

      await logEvent(tx, {
        attemptId,
        examId: attempt.examId,
        userId: attempt.userId,
        type:
          submittedBy === ExamSubmittedBy.TUTOR
            ? ExamEventType.FORCE_SUBMITTED
            : ExamEventType.ATTEMPT_SUBMITTED,
        severity: ExamEventSeverity.INFO,
        metadata: { submittedBy, pendingManual },
      });

      return {
        ok: true,
        alreadySubmitted: false,
        gradeId: grade.id,
        autoScore,
        maxScore,
        percentage,
        passed,
        status,
        pendingManual,
      };
    },
    { timeout: 30_000, maxWait: 15_000 },
  );
}

// ─── Expiry sweep ────────────────────────────────────────────────────────────

/**
 * Close out attempts whose time has run out.
 *
 * The backstop for a candidate who closed their laptop rather than submitting.
 * Safe to run on a schedule and safe to overlap with itself — `submitAttempt` is
 * idempotent, so a candidate submitting at the same moment cannot be double-graded.
 */
export async function expireOverdueAttempts(
  client: PrismaClient = defaultClient,
  now: Date = new Date(),
): Promise<{ examined: number; submitted: number }> {
  const overdue = await client.examAttempt.findMany({
    where: { status: ExamAttemptStatus.IN_PROGRESS, expiresAt: { lte: now } },
    select: { id: true },
    take: 500,
  });

  let submitted = 0;
  for (const attempt of overdue) {
    const result = await submitAttempt(attempt.id, ExamSubmittedBy.AUTO, client);
    if (result.ok && !result.alreadySubmitted) submitted++;
  }

  return { examined: overdue.length, submitted };
}

// ─── Integrity signals ───────────────────────────────────────────────────────

/**
 * Record an integrity signal. Flags for tutor review; never penalises, never
 * ends an attempt. See design doc §7.2.
 */
export async function logEvent(
  client: AnyClient,
  event: {
    attemptId: string;
    examId: string;
    userId: string;
    type: ExamEventType;
    severity?: ExamEventSeverity;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string | null;
  },
): Promise<void> {
  await client.examEvent.create({
    data: {
      attemptId: event.attemptId,
      examId: event.examId,
      userId: event.userId,
      type: event.type,
      severity: event.severity ?? ExamEventSeverity.INFO,
      metadata: event.metadata ?? Prisma.DbNull,
      ipAddress: event.ipAddress ?? null,
    },
  });
}
