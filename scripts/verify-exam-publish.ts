/**
 * Verification script for the Exam Center publish pipeline.
 *
 * Creates a self-contained fixture (its own tutor, students, course, bank and
 * exam), runs the pipeline against it, asserts the invariants, then deletes
 * everything it made. Every record it creates is tagged with a unique run id, and
 * cleanup runs in a `finally` so a failed assertion still tears the fixture down.
 *
 * It does NOT touch pre-existing data.
 *
 * Run with:
 *   pnpm tsx scripts/verify-exam-publish.ts
 */

// Must come first: lib/db reads DATABASE_URL at module load, so the env has to
// be populated before that import is evaluated.
import "dotenv/config";

import { db as appDb } from "@/lib/db";
import {
  executePublish,
  executeResyncRoster,
  validateExamForPublish,
} from "@/lib/exam/publish";
import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

// Reuse the app's client rather than `new PrismaClient()` — Prisma 7 requires a
// driver adapter, and lib/db already wires up the Neon one.
const db = appDb as PrismaClient;

const RUN = randomUUID().slice(0, 8);
const tag = (s: string) => `[exam-verify-${RUN}] ${s}`;
const email = (s: string) => `exam-verify-${RUN}-${s}@invalid.test`;

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log(`\nExam publish verification (run ${RUN})\n`);

  // ─── Fixture ───────────────────────────────────────────────────────────────

  const tutorUser = await db.user.create({
    data: { email: email("tutor"), name: tag("Tutor"), role: "TUTOR" },
  });

  const tutor = await db.tutor.create({
    data: { userId: tutorUser.id, title: tag("Tutor"), experience: 1 },
  });

  const category = await db.category.create({
    data: { name: tag("Category"), slug: `exam-verify-${RUN}` },
  });

  const course = await db.course.create({
    data: {
      title: tag("Course"),
      slug: `exam-verify-course-${RUN}`,
      description: "fixture",
      subtitle: "fixture",
      price: 0,
      categoryId: category.id,
      creatorId: tutorUser.id,
      tutorId: tutor.id,
    },
  });

  // Three students: two ACTIVE (eligible), one DROPPED (must NOT be seeded).
  const students = await Promise.all(
    (["active-1", "active-2", "dropped"] as const).map((slug) =>
      db.user.create({
        data: { email: email(slug), name: tag(slug), role: "STUDENT" },
      }),
    ),
  );

  await db.enrollment.createMany({
    data: [
      { userId: students[0].id, courseId: course.id, status: "ACTIVE" },
      { userId: students[1].id, courseId: course.id, status: "ACTIVE" },
      { userId: students[2].id, courseId: course.id, status: "DROPPED" },
    ],
  });

  // Bank: 5 questions, 3 EASY + 2 HARD, so a difficulty-filtered draw is testable.
  const bank = await db.questionBank.create({
    data: { title: tag("Bank"), ownerId: tutor.id },
  });

  await db.bankQuestion.createMany({
    data: [1, 2, 3].map((n) => ({
      bankId: bank.id,
      stem: tag(`easy ${n}`),
      questionType: "MULTIPLE_CHOICE" as const,
      options: ["a", "b"],
      correctAnswer: "a",
      difficulty: "EASY" as const,
      topics: ["algebra"],
    })),
  });
  await db.bankQuestion.createMany({
    data: [1, 2].map((n) => ({
      bankId: bank.id,
      stem: tag(`hard ${n}`),
      questionType: "MULTIPLE_CHOICE" as const,
      options: ["a", "b"],
      correctAnswer: "b",
      difficulty: "HARD" as const,
      topics: ["calculus"],
    })),
  });

  const fixedSource = await db.bankQuestion.create({
    data: {
      bankId: bank.id,
      stem: "ORIGINAL WORDING",
      questionType: "TRUE_FALSE",
      correctAnswer: true,
      difficulty: "MEDIUM",
      version: 1,
    },
  });

  const now = Date.now();
  const exam = await db.exam.create({
    data: {
      title: tag("Exam"),
      scopeType: "COURSE",
      courseId: course.id,
      tutorId: tutor.id,
      createdById: tutorUser.id,
      opensAt: new Date(now + 60 * 60_000),
      closesAt: new Date(now + 4 * 60 * 60_000),
      durationMinutes: 60,
    },
  });

  const fixedSection = await db.examSection.create({
    data: { examId: exam.id, title: "Section A (fixed)", sortOrder: 0, selectionMode: "FIXED" },
  });

  // A snapshot taken during drafting, pointing at the bank question above.
  await db.examQuestion.create({
    data: {
      examId: exam.id,
      sectionId: fixedSection.id,
      sortOrder: 0,
      sourceBankQuestionId: fixedSource.id,
      sourceVersion: 1,
      stem: "ORIGINAL WORDING",
      questionType: "TRUE_FALSE",
      correctAnswer: true,
      points: 10,
    },
  });

  const drawSection = await db.examSection.create({
    data: {
      examId: exam.id,
      title: "Section B (draw)",
      sortOrder: 1,
      selectionMode: "RANDOM_DRAW",
      drawBankId: bank.id,
      drawCount: 2,
      drawDifficulty: "EASY",
      drawPoints: 5,
    },
  });

  try {
    // ─── 1. Validation catches an impossible draw ────────────────────────────
    console.log("Validation");

    await db.examSection.update({
      where: { id: drawSection.id },
      data: { drawCount: 99 },
    });
    const tooBig = await validateExamForPublish(exam.id, db);
    check(
      "a draw larger than its pool blocks publish",
      !tooBig.ok && tooBig.problems.some((p) => p.message.includes("only 3 match")),
      JSON.stringify(tooBig.problems),
    );
    await db.examSection.update({ where: { id: drawSection.id }, data: { drawCount: 2 } });

    // A duration that cannot fit inside its own window.
    await db.exam.update({ where: { id: exam.id }, data: { durationMinutes: 600 } });
    const tooLong = await validateExamForPublish(exam.id, db);
    check(
      "a duration longer than the window blocks publish",
      !tooLong.ok && tooLong.problems.some((p) => p.field === "durationMinutes"),
      JSON.stringify(tooLong.problems),
    );
    await db.exam.update({ where: { id: exam.id }, data: { durationMinutes: 60 } });

    // A draw with no bank chosen is a legal DRAFT state — the section schema
    // deliberately permits it, because a tutor switches a section to "draw from
    // a bank" before picking the bank. Publish is therefore the only thing
    // standing between an incomplete draw and a live exam, so it has to hold.
    await db.examSection.update({
      where: { id: drawSection.id },
      data: { drawBankId: null },
    });
    const noBank = await validateExamForPublish(exam.id, db);
    check(
      "a draw with no bank chosen blocks publish",
      !noBank.ok && noBank.problems.some((p) => /no bank or count/i.test(p.message)),
      JSON.stringify(noBank.problems),
    );

    const stillDraft = await db.exam.findUniqueOrThrow({ where: { id: exam.id } });
    check(
      "and the exam is left as a draft",
      stillDraft.status === "DRAFT",
      stillDraft.status,
    );

    await db.examSection.update({
      where: { id: drawSection.id },
      data: { drawBankId: bank.id },
    });

    const ready = await validateExamForPublish(exam.id, db);
    check("a complete exam validates", ready.ok, JSON.stringify(ready.problems));

    // ─── 2. Snapshot freshness ───────────────────────────────────────────────
    console.log("\nPublish");

    // Edit the bank AFTER drafting. Publish must pick up the new wording...
    await db.bankQuestion.update({
      where: { id: fixedSource.id },
      data: { stem: "EDITED BEFORE PUBLISH", version: 2 },
    });

    const result = await executePublish(exam.id, db);
    check("publish succeeds", result.ok, !result.ok ? result.error : "");
    if (!result.ok) return;

    const fixedQ = await db.examQuestion.findFirstOrThrow({
      where: { sectionId: fixedSection.id },
    });
    check(
      "a fixed question is refreshed from its bank at publish",
      fixedQ.stem === "EDITED BEFORE PUBLISH" && fixedQ.sourceVersion === 2,
      `got "${fixedQ.stem}" v${fixedQ.sourceVersion}`,
    );

    // ...and must ignore edits made afterwards.
    await db.bankQuestion.update({
      where: { id: fixedSource.id },
      data: { stem: "EDITED AFTER PUBLISH", version: 3 },
    });
    const afterEdit = await db.examQuestion.findUniqueOrThrow({ where: { id: fixedQ.id } });
    check(
      "editing the bank after publish does not touch the snapshot",
      afterEdit.stem === "EDITED BEFORE PUBLISH",
      `got "${afterEdit.stem}"`,
    );

    // Deleting the source must leave the frozen copy standing.
    await db.bankQuestion.delete({ where: { id: fixedSource.id } });
    const orphaned = await db.examQuestion.findUnique({ where: { id: fixedQ.id } });
    check(
      "deleting a bank question leaves the published snapshot intact",
      !!orphaned && orphaned.stem === "EDITED BEFORE PUBLISH" && orphaned.sourceBankQuestionId === null,
      orphaned ? `sourceId=${orphaned.sourceBankQuestionId}` : "snapshot was deleted",
    );

    // ─── 3. Draw pool ────────────────────────────────────────────────────────
    const pool = await db.examQuestion.findMany({ where: { sectionId: drawSection.id } });
    check(
      "the draw snapshots the whole eligible pool, not just drawCount",
      pool.length === 3,
      `pool is ${pool.length}, expected the 3 EASY questions`,
    );
    check(
      "the draw respects its difficulty filter",
      pool.every((q) => q.stem.includes("easy")),
      pool.map((q) => q.stem).join(", "),
    );

    // ─── 4. Points ───────────────────────────────────────────────────────────
    // 10 (fixed) + 2 drawn x 5 = 20. The 3-question pool must NOT inflate this.
    check(
      "totalPoints counts drawCount, not pool size",
      result.totalPoints === 20,
      `got ${result.totalPoints}, expected 20`,
    );

    // ─── 5. Roster ───────────────────────────────────────────────────────────
    console.log("\nRoster");

    const candidates = await db.examCandidate.findMany({ where: { examId: exam.id } });
    check("only eligible enrolments are seeded", candidates.length === 2, `got ${candidates.length}`);
    check(
      "the dropped student is not on the roster",
      !candidates.some((c) => c.userId === students[2].id),
    );
    check(
      "seeding records its provenance",
      candidates.every((c) => !!c.seededFromId),
    );

    // ─── 6. Idempotency ──────────────────────────────────────────────────────
    console.log("\nIdempotency");

    const second = await executePublish(exam.id, db);
    check(
      "re-publishing is a no-op success",
      second.ok && second.alreadyPublished === true,
      !second.ok ? second.error : `alreadyPublished=${second.ok && second.alreadyPublished}`,
    );

    const afterRepublish = await db.examQuestion.count({ where: { examId: exam.id } });
    check(
      "re-publishing does not duplicate questions",
      afterRepublish === 4,
      `got ${afterRepublish}, expected 4`,
    );

    // ─── 7. Roster re-sync ───────────────────────────────────────────────────
    const latecomer = await db.user.create({
      data: { email: email("late"), name: tag("late"), role: "STUDENT" },
    });
    await db.enrollment.create({
      data: { userId: latecomer.id, courseId: course.id, status: "ACTIVE" },
    });

    const resync = await executeResyncRoster(exam.id, db);
    check("re-sync picks up a late enroller", resync.ok && resync.added === 1,
      resync.ok ? `added ${resync.added}` : resync.error);

    const resyncAgain = await executeResyncRoster(exam.id, db);
    check(
      "re-sync is additive only and adds nobody twice",
      resyncAgain.ok && resyncAgain.added === 0,
      resyncAgain.ok ? `added ${resyncAgain.added}` : resyncAgain.error,
    );

    const finalRoster = await db.examCandidate.count({ where: { examId: exam.id } });
    check("final roster is 3", finalRoster === 3, `got ${finalRoster}`);
  } finally {
    // ─── Cleanup ─────────────────────────────────────────────────────────────
    // Cascades handle sections, questions and candidates via the exam and course.
    await db.exam.deleteMany({ where: { tutorId: tutor.id } });
    await db.questionBank.deleteMany({ where: { ownerId: tutor.id } });
    await db.enrollment.deleteMany({ where: { courseId: course.id } });
    await db.course.deleteMany({ where: { id: course.id } });
    await db.category.deleteMany({ where: { id: category.id } });
    await db.tutor.deleteMany({ where: { id: tutor.id } });
    await db.user.deleteMany({ where: { email: { startsWith: `exam-verify-${RUN}-` } } });

    console.log(`\n${passed} passed, ${failed} failed\n`);
  }

  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
