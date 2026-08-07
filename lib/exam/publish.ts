import { db } from "@/lib/db";
import {
  BootcampEnrollmentStatus,
  EnrollmentStatus,
  ExamStatus,
  // Imported as a value, not just a type — `Prisma.DbNull` is a runtime sentinel.
  Prisma,
  ProgramEnrollmentStatus,
  type PrismaClient,
} from "@prisma/client";

/**
 * Exam Center — publish pipeline.
 *
 * Publishing turns an editable draft into a fixed, rostered event. Three things
 * happen, and they happen together or not at all:
 *
 *   1. Questions are SNAPSHOT out of their bank into `ExamQuestion`. Editing the
 *      bank afterwards never touches a published exam.
 *   2. The roster is MATERIALISED into `ExamCandidate` from whatever the exam is
 *      scoped to. From here on the roster belongs to the exam, not to the
 *      enrolment tables, so it cannot shift underneath a running exam.
 *   3. `totalPoints` is computed and the exam moves DRAFT -> SCHEDULED.
 *
 * This module holds the logic and no authorisation — actions/exam.ts wraps it
 * with the session check. Keeping the two apart is what lets the pipeline be
 * exercised directly by scripts/verify-exam-publish.ts.
 *
 * See docs/EXAM-CENTER-DESIGN.md sections 4.1, 5.5 and 7.1.
 */

/**
 * `db` widens to `any` — lib/db.ts hands back a lazy proxy when DATABASE_URL is
 * missing at build time. Bind it to the real client type once so everything
 * downstream, the transaction callback especially, stays type-checked.
 */
const defaultClient = db as PrismaClient;

/** Accepts either the app client or a transaction handle. */
type AnyClient = PrismaClient | Prisma.TransactionClient;

// ─── Roster eligibility ──────────────────────────────────────────────────────

/**
 * Which enrolment states put someone in an exam hall.
 *
 * Deliberately narrow: an exam roster is not a marketing list. Someone who has
 * dropped, been suspended, or never paid past a pending state is not seeded,
 * though a tutor can always add them by hand.
 */
export const EXAM_ELIGIBLE_COURSE_STATUSES: EnrollmentStatus[] = [
  EnrollmentStatus.ACTIVE,
];

export const EXAM_ELIGIBLE_PROGRAM_STATUSES: ProgramEnrollmentStatus[] = [
  ProgramEnrollmentStatus.ACTIVE,
  ProgramEnrollmentStatus.FULLY_PAID,
  ProgramEnrollmentStatus.FIRST_INSTALLMENT_PAID,
];

export const EXAM_ELIGIBLE_BOOTCAMP_STATUSES: BootcampEnrollmentStatus[] = [
  BootcampEnrollmentStatus.PAID_CONFIRMED,
];

type ExamScopeFields = {
  scopeType: string;
  courseId: string | null;
  cohortId: string | null;
  trackId: string | null;
};

type SeedRow = { userId: string; seededFromId: string };

/**
 * Resolve the people an exam's scope points at.
 *
 * AD_HOC returns nothing on purpose — its roster is whatever the tutor added by
 * hand during the draft, so there is nothing to derive.
 */
export async function resolveRosterSeed(
  client: AnyClient,
  exam: ExamScopeFields,
): Promise<SeedRow[]> {
  switch (exam.scopeType) {
    case "COURSE": {
      if (!exam.courseId) return [];
      const rows = await client.enrollment.findMany({
        where: {
          courseId: exam.courseId,
          status: { in: EXAM_ELIGIBLE_COURSE_STATUSES },
        },
        select: { id: true, userId: true },
      });
      return rows.map((r) => ({ userId: r.userId, seededFromId: r.id }));
    }

    case "PROGRAM_COHORT": {
      if (!exam.cohortId) return [];
      const rows = await client.programEnrollment.findMany({
        where: {
          cohortId: exam.cohortId,
          status: { in: EXAM_ELIGIBLE_PROGRAM_STATUSES },
          // A programme enrolment only gets a userId once the account is
          // provisioned; without one there is nobody to sit the exam.
          userId: { not: null },
        },
        select: { id: true, userId: true },
      });
      return rows
        .filter((r): r is { id: string; userId: string } => !!r.userId)
        .map((r) => ({ userId: r.userId, seededFromId: r.id }));
    }

    case "BOOTCAMP_TRACK": {
      if (!exam.trackId) return [];
      const rows = await client.bootcampEnrollment.findMany({
        where: {
          trackId: exam.trackId,
          status: { in: EXAM_ELIGIBLE_BOOTCAMP_STATUSES },
        },
        select: { id: true, userId: true },
      });
      return rows.map((r) => ({ userId: r.userId, seededFromId: r.id }));
    }

    case "AD_HOC":
    default:
      return [];
  }
}

/** The bank query a RANDOM_DRAW section resolves to. */
export function buildDrawFilter(section: {
  drawBankId: string | null;
  drawDifficulty: string | null;
  drawTopics: string[];
}): Prisma.BankQuestionWhereInput {
  return {
    bankId: section.drawBankId ?? undefined,
    isArchived: false,
    ...(section.drawDifficulty ? { difficulty: section.drawDifficulty as never } : {}),
    ...(section.drawTopics.length > 0 ? { topics: { hasSome: section.drawTopics } } : {}),
  };
}

// ─── Pre-publish validation ──────────────────────────────────────────────────

export type PublishCheck = { field: string; message: string };

/**
 * Everything that must be true before an exam can leave DRAFT.
 *
 * The authoring UI can call this to show a live pre-publish checklist rather than
 * letting the tutor find out at the last moment. `executePublish` runs it again —
 * the UI copy is a convenience, this is the gate.
 */
export async function validateExamForPublish(
  examId: string,
  client: PrismaClient = defaultClient,
): Promise<{ ok: boolean; problems: PublishCheck[] }> {
  const exam = await client.exam.findUnique({
    where: { id: examId },
    include: {
      sections: { include: { _count: { select: { questions: true } } } },
      _count: { select: { candidates: true } },
    },
  });

  if (!exam) return { ok: false, problems: [{ field: "exam", message: "Exam not found" }] };

  const problems: PublishCheck[] = [];

  // Schedule — nullable on a draft, required to publish.
  if (!exam.opensAt) problems.push({ field: "opensAt", message: "Set when the exam opens" });
  if (!exam.closesAt) problems.push({ field: "closesAt", message: "Set when the exam closes" });
  if (!exam.durationMinutes)
    problems.push({ field: "durationMinutes", message: "Set how long candidates get" });

  if (exam.opensAt && exam.closesAt) {
    if (exam.closesAt <= exam.opensAt) {
      problems.push({ field: "closesAt", message: "The exam must close after it opens" });
    } else if (
      exam.durationMinutes &&
      exam.durationMinutes * 60_000 > exam.closesAt.getTime() - exam.opensAt.getTime()
    ) {
      // Otherwise a candidate starting on time still cannot finish before the
      // window shuts, and gets auto-submitted through no fault of their own.
      problems.push({
        field: "durationMinutes",
        message: "The duration is longer than the window it has to run in",
      });
    }
    if (exam.closesAt <= new Date()) {
      problems.push({ field: "closesAt", message: "The window has already passed" });
    }
  }

  // Scope must actually point somewhere.
  const scopeId =
    exam.scopeType === "COURSE"
      ? exam.courseId
      : exam.scopeType === "PROGRAM_COHORT"
        ? exam.cohortId
        : exam.scopeType === "BOOTCAMP_TRACK"
          ? exam.trackId
          : "ad-hoc";
  if (!scopeId) {
    problems.push({ field: "scope", message: "Choose what this exam is set for" });
  }

  if (exam.accessMode === "ACCESS_CODE" && !exam.accessCode) {
    problems.push({
      field: "accessCode",
      message: "An access code is required in access-code mode",
    });
  }

  if (exam.sections.length === 0) {
    problems.push({ field: "sections", message: "Add at least one section" });
  }

  for (const section of exam.sections) {
    const label = section.title || "Untitled section";

    if (section.selectionMode === "FIXED") {
      if (section._count.questions === 0) {
        problems.push({ field: `section:${section.id}`, message: `"${label}" has no questions` });
      }
      continue;
    }

    // RANDOM_DRAW — the bank has to be able to satisfy the draw.
    if (!section.drawBankId || !section.drawCount) {
      problems.push({
        field: `section:${section.id}`,
        message: `"${label}" is set to draw at random but has no bank or count`,
      });
      continue;
    }

    const poolSize = await client.bankQuestion.count({ where: buildDrawFilter(section) });

    if (poolSize < section.drawCount) {
      problems.push({
        field: `section:${section.id}`,
        message: `"${label}" draws ${section.drawCount} questions but only ${poolSize} match in the bank`,
      });
    }
  }

  // Roster — an exam nobody can sit is not ready to publish.
  if (exam.scopeType === "AD_HOC") {
    if (exam._count.candidates === 0) {
      problems.push({ field: "candidates", message: "Add at least one candidate" });
    }
  } else if (scopeId) {
    const seed = await resolveRosterSeed(client, exam);
    if (seed.length === 0 && exam._count.candidates === 0) {
      problems.push({
        field: "candidates",
        message: "Nobody is currently enrolled for this exam's scope",
      });
    }
  }

  return { ok: problems.length === 0, problems };
}

// ─── Publish ─────────────────────────────────────────────────────────────────

export type PublishResult =
  | { ok: false; error: string; problems?: PublishCheck[] }
  | {
      ok: true;
      alreadyPublished?: boolean;
      status: ExamStatus;
      totalPoints: number;
      candidatesSeeded: number;
      candidateCount: number;
    };

/**
 * DRAFT -> SCHEDULED.
 *
 * Idempotent: publishing an already-published exam reports success without doing
 * anything, so a double-clicked button or a retried request cannot re-snapshot
 * questions or reset a roster that candidates may already be sitting against.
 */
export async function executePublish(
  examId: string,
  client: PrismaClient = defaultClient,
): Promise<PublishResult> {
  const existing = await client.exam.findUnique({
    where: { id: examId },
    select: { status: true, totalPoints: true },
  });
  if (!existing) return { ok: false, error: "Exam not found" };

  if (existing.status !== ExamStatus.DRAFT) {
    if (existing.status === ExamStatus.SCHEDULED || existing.status === ExamStatus.LIVE) {
      const candidateCount = await client.examCandidate.count({ where: { examId } });
      return {
        ok: true,
        alreadyPublished: true,
        status: existing.status,
        totalPoints: existing.totalPoints,
        candidatesSeeded: 0,
        candidateCount,
      };
    }
    return { ok: false, error: `An exam that is ${existing.status.toLowerCase()} cannot be published` };
  }

  const check = await validateExamForPublish(examId, client);
  if (!check.ok) {
    return { ok: false, error: "This exam is not ready to publish", problems: check.problems };
  }

  try {
    const result = await client.$transaction(
      async (tx) => {
        const exam = await tx.exam.findUniqueOrThrow({
          where: { id: examId },
          include: { sections: { orderBy: { sortOrder: "asc" } } },
        });

        // Defensive: a draft should never have attempts. If one somehow does,
        // refuse rather than rewrite questions out from under it.
        const attemptCount = await tx.examAttempt.count({
          where: { examId, isPractice: false },
        });
        if (attemptCount > 0) {
          throw new Error("This exam already has attempts and cannot be republished");
        }

        let totalPoints = 0;
        for (const section of exam.sections) {
          totalPoints +=
            section.selectionMode === "FIXED"
              ? await refreshFixedSection(tx, section.id)
              : await snapshotDrawPool(tx, examId, section);
        }

        const seeded = await seedRoster(tx, examId, exam);

        await tx.exam.update({
          where: { id: examId },
          data: {
            status: ExamStatus.SCHEDULED,
            publishedAt: new Date(),
            totalPoints,
          },
        });

        const candidateCount = await tx.examCandidate.count({ where: { examId } });
        return { totalPoints, seeded, candidateCount };
      },
      { timeout: 30_000, maxWait: 10_000 },
    );

    return {
      ok: true,
      status: ExamStatus.SCHEDULED,
      totalPoints: result.totalPoints,
      candidatesSeeded: result.seeded,
      candidateCount: result.candidateCount,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not publish this exam",
    };
  }
}

/**
 * Re-copy a FIXED section's questions from their source bank, so the snapshot
 * reflects the bank as it stands at publish rather than whenever the tutor first
 * picked the question. Questions written directly onto the exam have no source
 * and are left alone.
 *
 * Returns the section's contribution to `totalPoints`.
 */
async function refreshFixedSection(
  tx: Prisma.TransactionClient,
  sectionId: string,
): Promise<number> {
  const questions = await tx.examQuestion.findMany({
    where: { sectionId },
    select: { id: true, points: true, sourceBankQuestionId: true },
  });

  const sourceIds = questions
    .map((q) => q.sourceBankQuestionId)
    .filter((id): id is string => !!id);

  if (sourceIds.length > 0) {
    const sources = await tx.bankQuestion.findMany({ where: { id: { in: sourceIds } } });
    const byId = new Map(sources.map((s) => [s.id, s]));

    for (const q of questions) {
      const source = q.sourceBankQuestionId ? byId.get(q.sourceBankQuestionId) : undefined;
      // A deleted source leaves the frozen copy exactly as it was — that is the
      // whole point of snapshotting.
      if (!source) continue;

      await tx.examQuestion.update({
        where: { id: q.id },
        data: {
          stem: source.stem,
          questionType: source.questionType,
          options: source.options ?? Prisma.DbNull,
          correctAnswer: source.correctAnswer as Prisma.InputJsonValue,
          explanation: source.explanation,
          mediaUrls: source.mediaUrls,
          sourceVersion: source.version,
        },
      });
    }
  }

  return questions.reduce((sum, q) => sum + q.points, 0);
}

/**
 * Snapshot the whole eligible pool for a RANDOM_DRAW section. Each attempt later
 * draws its own `drawCount` from these frozen rows, which is what lets every
 * candidate get a different paper while the questions themselves stay immutable.
 *
 * Returns the section's contribution to `totalPoints` — `drawCount` questions,
 * NOT the size of the pool, because that is what any one candidate answers.
 */
async function snapshotDrawPool(
  tx: Prisma.TransactionClient,
  examId: string,
  section: {
    id: string;
    drawBankId: string | null;
    drawCount: number | null;
    drawDifficulty: string | null;
    drawTopics: string[];
    drawPoints: number | null;
  },
): Promise<number> {
  // Safe because publish only runs on a DRAFT with no attempts, so no response
  // can be pointing at these rows.
  await tx.examQuestion.deleteMany({ where: { sectionId: section.id } });

  const pool = await tx.bankQuestion.findMany({
    where: buildDrawFilter(section),
    orderBy: { createdAt: "asc" },
  });

  const pointsEach = section.drawPoints ?? 1;

  await tx.examQuestion.createMany({
    data: pool.map((q, index) => ({
      examId,
      sectionId: section.id,
      sortOrder: index,
      sourceBankQuestionId: q.id,
      sourceVersion: q.version,
      stem: q.stem,
      questionType: q.questionType,
      options: q.options ?? Prisma.DbNull,
      correctAnswer: q.correctAnswer as Prisma.InputJsonValue,
      explanation: q.explanation,
      points: pointsEach,
      mediaUrls: q.mediaUrls,
    })),
  });

  return (section.drawCount ?? 0) * pointsEach;
}

/**
 * Materialise the roster. `skipDuplicates` against the `[examId, userId]` unique
 * makes this safe to run more than once — candidates a tutor added by hand during
 * the draft survive, and nobody is seeded twice.
 */
export async function seedRoster(
  client: AnyClient,
  examId: string,
  exam: ExamScopeFields,
): Promise<number> {
  const seed = await resolveRosterSeed(client, exam);
  if (seed.length === 0) return 0;

  const created = await client.examCandidate.createMany({
    data: seed.map((row) => ({
      examId,
      userId: row.userId,
      seededFromId: row.seededFromId,
      addedManually: false,
    })),
    skipDuplicates: true,
  });

  return created.count;
}

/**
 * Pull in people who joined the scope after the exam was published.
 *
 * Strictly additive. It never removes a candidate and never touches one who has
 * started, because a roster that shrinks mid-exam can orphan an in-flight attempt.
 * Removing someone is a separate, deliberate exclusion.
 */
export async function executeResyncRoster(
  examId: string,
  client: PrismaClient = defaultClient,
): Promise<{ ok: false; error: string } | { ok: true; added: number }> {
  const exam = await client.exam.findUnique({
    where: { id: examId },
    select: { status: true, scopeType: true, courseId: true, cohortId: true, trackId: true },
  });
  if (!exam) return { ok: false, error: "Exam not found" };

  if (exam.scopeType === "AD_HOC") {
    return { ok: false, error: "An ad-hoc exam has no scope to re-sync from" };
  }

  const resyncable: ExamStatus[] = [ExamStatus.SCHEDULED, ExamStatus.LIVE];
  if (!resyncable.includes(exam.status)) {
    return {
      ok: false,
      error: `The roster cannot be re-synced while an exam is ${exam.status.toLowerCase()}`,
    };
  }

  const added = await seedRoster(client, examId, exam);
  return { ok: true, added };
}
