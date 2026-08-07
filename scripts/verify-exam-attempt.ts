/**
 * Verification script for the Exam Center attempt engine.
 *
 * Covers the rules that are hard to eyeball and expensive to get wrong: the
 * server-owned clock, resume not granting extra time, one-device enforcement,
 * out-of-order autosave, submit idempotency under a simulated race, and objective
 * scoring across every auto-graded question type.
 *
 * Creates a self-contained fixture tagged with a unique run id and deletes it in
 * a `finally`. It does NOT touch pre-existing data.
 *
 * Run with:
 *   pnpm tsx scripts/verify-exam-attempt.ts
 */

// Must come first: lib/db reads DATABASE_URL at module load.
import "dotenv/config";

import { db as appDb } from "@/lib/db";
import {
  computeExpiry,
  effectiveDurationMs,
  expireOverdueAttempts,
  getAttemptPaper,
  saveResponse,
  startAttempt,
  submitAttempt,
} from "@/lib/exam/attempt";
import { scoreResponse, shuffledOptionOrder } from "@/lib/exam/grading";
import { executePublish } from "@/lib/exam/publish";
import { ExamSubmittedBy, type PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const db = appDb as PrismaClient;

const RUN = randomUUID().slice(0, 8);
const tag = (s: string) => `[attempt-verify-${RUN}] ${s}`;
const email = (s: string) => `attempt-verify-${RUN}-${s}@invalid.test`;

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

// ─── Pure-function checks (no database) ────────────────────────────────────────

function verifyScoring() {
  console.log("Scoring");

  const P = { points: 10 };

  check(
    "multiple choice marks an exact match",
    scoreResponse({ ...P, questionType: "MULTIPLE_CHOICE", correctAnswer: "b" }, "b").score === 10,
  );
  check(
    "multiple choice rejects a wrong option",
    scoreResponse({ ...P, questionType: "MULTIPLE_CHOICE", correctAnswer: "b" }, "c").score === 0,
  );
  check(
    "true/false accepts a string where a boolean is stored",
    scoreResponse({ ...P, questionType: "TRUE_FALSE", correctAnswer: true }, "true").isCorrect === true,
  );
  check(
    "multi-select ignores answer order",
    scoreResponse({ ...P, questionType: "MULTI_SELECT", correctAnswer: ["a", "c"] }, ["c", "a"])
      .isCorrect === true,
  );
  check(
    "multi-select rejects a partial answer",
    scoreResponse({ ...P, questionType: "MULTI_SELECT", correctAnswer: ["a", "c"] }, ["a"])
      .isCorrect === false,
  );
  check(
    "numeric honours a stored tolerance",
    scoreResponse(
      { ...P, questionType: "NUMERIC", correctAnswer: { value: 9.8, tolerance: 0.1 } },
      9.85,
    ).isCorrect === true,
  );
  check(
    "numeric rejects outside tolerance",
    scoreResponse(
      { ...P, questionType: "NUMERIC", correctAnswer: { value: 9.8, tolerance: 0.1 } },
      10.5,
    ).isCorrect === false,
  );
  check(
    "numeric survives float representation",
    scoreResponse({ ...P, questionType: "NUMERIC", correctAnswer: 0.3 }, 0.1 + 0.2)
      .isCorrect === true,
  );
  check(
    "fill-in-the-blank accepts any listed wording, case-insensitively",
    scoreResponse(
      { ...P, questionType: "FILL_IN_BLANK", correctAnswer: ["Lagos", "Eko"] },
      "  eko ",
    ).isCorrect === true,
  );
  check(
    "matching requires every pair to agree",
    scoreResponse({ ...P, questionType: "MATCHING", correctAnswer: { a: "1", b: "2" } }, { a: "1", b: "3" })
      .isCorrect === false,
  );
  check(
    "an essay is never auto-marked",
    scoreResponse({ ...P, questionType: "ESSAY", correctAnswer: null }, "an answer").requiresManual,
  );
  check(
    "an unanswered objective question scores zero rather than throwing",
    scoreResponse({ ...P, questionType: "MULTIPLE_CHOICE", correctAnswer: "b" }, null).score === 0,
  );

  console.log("\nOption shuffling");
  const a1 = shuffledOptionOrder("attempt-1", "q1", 5);
  const a2 = shuffledOptionOrder("attempt-1", "q1", 5);
  const b1 = shuffledOptionOrder("attempt-2", "q1", 5);
  check("the same attempt sees a stable order across reloads", a1.join() === a2.join());
  check("a different attempt sees a different order", a1.join() !== b1.join());
  check(
    "shuffling loses no options",
    [...a1].sort().join() === [0, 1, 2, 3, 4].join(),
    a1.join(),
  );

  console.log("\nClock");
  const start = new Date("2026-01-01T10:00:00Z");
  check(
    "expiry is start plus duration when the window is wide",
    computeExpiry(start, 60 * 60_000, new Date("2026-01-01T23:00:00Z")).toISOString() ===
      "2026-01-01T11:00:00.000Z",
  );
  check(
    "expiry is capped at the window close",
    // Starting 30 minutes before close with a 60-minute paper gets 30 minutes.
    computeExpiry(start, 60 * 60_000, new Date("2026-01-01T10:30:00Z")).toISOString() ===
      "2026-01-01T10:30:00.000Z",
  );
  check(
    "accommodations apply the multiplier before the flat bonus",
    // 60 x 1.5 = 90, + 10 = 100 minutes.
    effectiveDurationMs(
      { durationMinutes: 60 },
      { extraTimeMultiplier: 1.5, extraTimeMinutes: 10 },
    ) === 100 * 60_000,
  );
}

// ─── Engine checks (against the database) ─────────────────────────────────────

async function main() {
  console.log(`\nExam attempt engine verification (run ${RUN})\n`);

  verifyScoring();

  const tutorUser = await db.user.create({
    data: { email: email("tutor"), name: tag("Tutor"), role: "TUTOR" },
  });
  const tutor = await db.tutor.create({
    data: { userId: tutorUser.id, title: tag("Tutor"), experience: 1 },
  });
  const category = await db.category.create({
    data: { name: tag("Category"), slug: `attempt-verify-${RUN}` },
  });
  const course = await db.course.create({
    data: {
      title: tag("Course"),
      slug: `attempt-verify-course-${RUN}`,
      description: "fixture",
      subtitle: "fixture",
      price: 0,
      categoryId: category.id,
      creatorId: tutorUser.id,
      tutorId: tutor.id,
    },
  });

  const student = await db.user.create({
    data: { email: email("student"), name: tag("Student"), role: "STUDENT" },
  });
  const student2 = await db.user.create({
    data: { email: email("student2"), name: tag("Student2"), role: "STUDENT" },
  });
  await db.enrollment.createMany({
    data: [
      { userId: student.id, courseId: course.id, status: "ACTIVE" },
      { userId: student2.id, courseId: course.id, status: "ACTIVE" },
    ],
  });

  const now = Date.now();
  const exam = await db.exam.create({
    data: {
      title: tag("Exam"),
      scopeType: "COURSE",
      courseId: course.id,
      tutorId: tutor.id,
      // Opened a minute ago so it can be sat immediately.
      opensAt: new Date(now - 60_000),
      closesAt: new Date(now + 4 * 60 * 60_000),
      durationMinutes: 60,
      passingScore: 50,
      maxAttempts: 1,
    },
  });

  const section = await db.examSection.create({
    data: { examId: exam.id, title: "Section A", sortOrder: 0, selectionMode: "FIXED" },
  });

  // Two objective questions (10 points each) and one essay, so the grade must
  // land in PENDING_MANUAL rather than being declared final.
  const mcq = await db.examQuestion.create({
    data: {
      examId: exam.id,
      sectionId: section.id,
      sortOrder: 0,
      stem: tag("mcq"),
      questionType: "MULTIPLE_CHOICE",
      options: ["a", "b", "c"],
      correctAnswer: "b",
      points: 10,
    },
  });
  const tf = await db.examQuestion.create({
    data: {
      examId: exam.id,
      sectionId: section.id,
      sortOrder: 1,
      stem: tag("tf"),
      questionType: "TRUE_FALSE",
      correctAnswer: true,
      points: 10,
    },
  });
  const essay = await db.examQuestion.create({
    data: {
      examId: exam.id,
      sectionId: section.id,
      sortOrder: 2,
      stem: tag("essay"),
      questionType: "ESSAY",
      correctAnswer: {},
      points: 10,
    },
  });

  try {
    const published = await executePublish(exam.id, db);
    if (!published.ok) {
      check("fixture publishes", false, published.error);
      return;
    }

    // ─── Entry rules ─────────────────────────────────────────────────────────
    console.log("\nEntry");

    const stranger = await db.user.create({
      data: { email: email("stranger"), name: tag("Stranger"), role: "STUDENT" },
    });
    const notRostered = await startAttempt(exam.id, stranger.id, {}, db);
    check(
      "someone off the roster cannot start",
      !notRostered.ok && notRostered.code === "NOT_ENROLLED",
      JSON.stringify(notRostered),
    );

    const started = await startAttempt(
      exam.id,
      student.id,
      { deviceToken: "device-A" },
      db,
    );
    check("a rostered candidate can start", started.ok, !started.ok ? started.error : "");
    if (!started.ok) return;

    const attemptId = started.attemptId;

    // ─── The clock ───────────────────────────────────────────────────────────
    console.log("\nThe clock");

    const attemptRow = await db.examAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    const expectedExpiry = attemptRow.startedAt.getTime() + 60 * 60_000;
    check(
      "expiresAt is computed and stored server-side at start",
      Math.abs(attemptRow.expiresAt.getTime() - expectedExpiry) < 1000,
      `off by ${attemptRow.expiresAt.getTime() - expectedExpiry}ms`,
    );

    // ─── Resume ──────────────────────────────────────────────────────────────
    console.log("\nResume and device lock");

    const resumed = await startAttempt(exam.id, student.id, { deviceToken: "device-A" }, db);
    check(
      "starting again resumes the same attempt",
      resumed.ok && resumed.resumed && resumed.attemptId === attemptId,
      JSON.stringify(resumed),
    );
    check(
      "resuming does not extend the deadline",
      resumed.ok && resumed.expiresAt.getTime() === attemptRow.expiresAt.getTime(),
      resumed.ok ? `${resumed.expiresAt.toISOString()} vs ${attemptRow.expiresAt.toISOString()}` : "",
    );

    const otherDevice = await startAttempt(
      exam.id,
      student.id,
      { deviceToken: "device-B" },
      db,
    );
    check(
      "a second device is refused",
      !otherDevice.ok && otherDevice.code === "SECOND_DEVICE",
      JSON.stringify(otherDevice),
    );
    const blockedEvents = await db.examEvent.count({
      where: { attemptId, type: "SECOND_DEVICE_BLOCKED" },
    });
    check("the refusal is logged as an integrity signal", blockedEvents === 1, `got ${blockedEvents}`);

    // ─── Answer secrecy ──────────────────────────────────────────────────────
    console.log("\nAnswer secrecy");

    const paper = await getAttemptPaper(attemptId, student.id, db);
    check("the candidate can read their paper", paper.ok);
    if (paper.ok) {
      const serialized = JSON.stringify(paper.questions);
      check(
        "the paper carries no correct answers",
        !serialized.includes("correctAnswer") && !serialized.includes("explanation"),
      );
      check("the paper has all three questions", paper.questions.length === 3);
    }

    const wrongUser = await getAttemptPaper(attemptId, student2.id, db);
    check(
      "another candidate cannot read someone else's paper",
      !wrongUser.ok && wrongUser.code === "FORBIDDEN",
    );

    // ─── Autosave ────────────────────────────────────────────────────────────
    console.log("\nAutosave");

    const t2 = new Date(Date.now());
    const t1 = new Date(t2.getTime() - 30_000);

    await saveResponse(attemptId, student.id, mcq.id, "a", { clientSavedAt: t1 }, db);
    const newer = await saveResponse(attemptId, student.id, mcq.id, "b", { clientSavedAt: t2 }, db);
    check("a newer answer overwrites an older one", newer.ok && !newer.stale);

    // The offline queue flushes out of order: an older write lands last.
    const stale = await saveResponse(attemptId, student.id, mcq.id, "c", { clientSavedAt: t1 }, db);
    check("an out-of-order older save is dropped", stale.ok && stale.stale === true);

    const stored = await db.examResponse.findUniqueOrThrow({
      where: { attemptId_questionId: { attemptId, questionId: mcq.id } },
    });
    check("the newer answer survived the stale flush", stored.answer === "b", String(stored.answer));

    const offPaper = await saveResponse(attemptId, student.id, "not-a-question-id", "x", {}, db);
    check(
      "an answer to a question not on the paper is refused",
      !offPaper.ok && offPaper.code === "NOT_ON_PAPER",
    );

    await saveResponse(attemptId, student.id, tf.id, true, {}, db);
    await saveResponse(attemptId, student.id, essay.id, "My essay answer.", {}, db);

    // ─── Submit ──────────────────────────────────────────────────────────────
    console.log("\nSubmit");

    // Two submits fired at once — exactly one must produce a grade.
    const [first, second] = await Promise.all([
      submitAttempt(attemptId, ExamSubmittedBy.STUDENT, db),
      submitAttempt(attemptId, ExamSubmittedBy.AUTO, db),
    ]);

    check("both concurrent submits return success", first.ok && second.ok);
    if (first.ok && second.ok) {
      check(
        "exactly one of them did the grading",
        first.alreadySubmitted !== second.alreadySubmitted,
        `first=${first.alreadySubmitted} second=${second.alreadySubmitted}`,
      );
    }

    const grades = await db.examGrade.count({ where: { attemptId } });
    check("a race produces exactly one grade", grades === 1, `got ${grades}`);

    const grade = await db.examGrade.findUniqueOrThrow({ where: { attemptId } });
    check(
      "the objective portion is scored (10 of 20 objective points)",
      grade.autoScore === 20,
      `got ${grade.autoScore}`,
    );
    check(
      "an essay holds the grade in PENDING_MANUAL",
      grade.status === "PENDING_MANUAL",
      grade.status,
    );
    check(
      "a pending grade is not marked passed",
      grade.passed === false,
      `passed=${grade.passed}`,
    );
    check("maxScore counts every question", grade.maxScore === 30, `got ${grade.maxScore}`);

    const answered = await db.examResponse.findUniqueOrThrow({
      where: { attemptId_questionId: { attemptId, questionId: mcq.id } },
    });
    check("the response is annotated with its mark", answered.isCorrect === true && answered.autoScore === 10);

    const afterSubmit = await saveResponse(attemptId, student.id, tf.id, false, {}, db);
    check(
      "answers are refused after submission",
      !afterSubmit.ok && afterSubmit.code === "NOT_IN_PROGRESS",
    );

    const candidate = await db.examCandidate.findFirstOrThrow({
      where: { examId: exam.id, userId: student.id },
    });
    check("the candidate is marked SUBMITTED", candidate.status === "SUBMITTED", candidate.status);

    const usedUp = await startAttempt(exam.id, student.id, {}, db);
    check(
      "a used-up attempt allowance blocks a restart",
      !usedUp.ok && usedUp.code === "NO_ATTEMPTS_LEFT",
      JSON.stringify(usedUp),
    );

    // ─── Expiry sweep ────────────────────────────────────────────────────────
    console.log("\nExpiry sweep");

    const second2 = await startAttempt(exam.id, student2.id, {}, db);
    check("the second candidate can start", second2.ok);
    if (!second2.ok) return;

    await saveResponse(second2.attemptId, student2.id, mcq.id, "b", {}, db);

    // Backdate the expiry to simulate a candidate who walked away.
    await db.examAttempt.update({
      where: { id: second2.attemptId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const swept = await expireOverdueAttempts(db);
    check("the sweep submits an overdue attempt", swept.submitted >= 1, JSON.stringify(swept));

    const sweptAttempt = await db.examAttempt.findUniqueOrThrow({
      where: { id: second2.attemptId },
    });
    check(
      "an auto-submitted attempt is marked as such",
      sweptAttempt.status === "AUTO_SUBMITTED" && sweptAttempt.submittedBy === "AUTO",
      `${sweptAttempt.status}/${sweptAttempt.submittedBy}`,
    );
    check(
      "work saved before expiry is still graded",
      (await db.examGrade.findUniqueOrThrow({ where: { attemptId: second2.attemptId } }))
        .autoScore === 10,
    );

    const sweptAgain = await expireOverdueAttempts(db);
    check(
      "re-running the sweep submits nothing twice",
      sweptAgain.submitted === 0,
      JSON.stringify(sweptAgain),
    );
  } finally {
    await db.examEvent.deleteMany({ where: { exam: { tutorId: tutor.id } } });
    await db.exam.deleteMany({ where: { tutorId: tutor.id } });
    await db.enrollment.deleteMany({ where: { courseId: course.id } });
    await db.course.deleteMany({ where: { id: course.id } });
    await db.category.deleteMany({ where: { id: category.id } });
    await db.tutor.deleteMany({ where: { id: tutor.id } });
    await db.user.deleteMany({
      where: { email: { startsWith: `attempt-verify-${RUN}-` } },
    });

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
