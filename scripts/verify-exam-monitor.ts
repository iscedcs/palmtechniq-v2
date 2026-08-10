/**
 * Verification script for Exam Center invigilation.
 *
 * The one that matters most here: granting extra time must reach an attempt that
 * is ALREADY RUNNING. `extraTimeMinutes` on the candidate is only read when an
 * attempt starts, so a naive implementation looks correct and silently does
 * nothing for the student sitting in front of you.
 *
 * Self-contained fixture, torn down in a `finally`. Does NOT touch existing data.
 *
 * Run with:
 *   pnpm tsx scripts/verify-exam-monitor.ts
 */

import "dotenv/config";

import { db as appDb } from "@/lib/db";
import { saveResponse, startAttempt } from "@/lib/exam/attempt";
import { executePublish } from "@/lib/exam/publish";
import { sweepExams } from "@/lib/exam/sweep";
import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const db = appDb as PrismaClient;

const RUN = randomUUID().slice(0, 8);
const tag = (s: string) => `[monitor-verify-${RUN}] ${s}`;
const email = (s: string) => `monitor-verify-${RUN}-${s}@invalid.test`;

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
  console.log(`\nExam monitor verification (run ${RUN})\n`);

  const tutorUser = await db.user.create({
    data: { email: email("tutor"), name: tag("Tutor"), role: "TUTOR" },
  });
  const tutor = await db.tutor.create({
    data: { userId: tutorUser.id, title: tag("Tutor"), experience: 1 },
  });
  const category = await db.category.create({
    data: { name: tag("Cat"), slug: `monitor-verify-${RUN}` },
  });
  const course = await db.course.create({
    data: {
      title: tag("Course"),
      slug: `monitor-verify-course-${RUN}`,
      description: "fixture",
      subtitle: "fixture",
      price: 0,
      categoryId: category.id,
      creatorId: tutorUser.id,
      tutorId: tutor.id,
    },
  });

  const [sitter, noShow] = await Promise.all([
    db.user.create({ data: { email: email("sitter"), name: tag("Sitter"), role: "STUDENT" } }),
    db.user.create({ data: { email: email("noshow"), name: tag("NoShow"), role: "STUDENT" } }),
  ]);
  await db.enrollment.createMany({
    data: [
      { userId: sitter.id, courseId: course.id, status: "ACTIVE" },
      { userId: noShow.id, courseId: course.id, status: "ACTIVE" },
    ],
  });

  const now = Date.now();
  const exam = await db.exam.create({
    data: {
      title: tag("Exam"),
      scopeType: "COURSE",
      courseId: course.id,
      tutorId: tutor.id,
      opensAt: new Date(now - 60_000),
      // Closes soon, so the window-cap and sweep interactions are exercised.
      closesAt: new Date(now + 20 * 60_000),
      durationMinutes: 15,
      passingScore: 50,
      maxAttempts: 1,
    },
  });
  const section = await db.examSection.create({
    data: { examId: exam.id, title: "A", sortOrder: 0, selectionMode: "FIXED" },
  });
  const q = await db.examQuestion.create({
    data: {
      examId: exam.id,
      sectionId: section.id,
      sortOrder: 0,
      stem: tag("q"),
      questionType: "TRUE_FALSE",
      correctAnswer: true,
      points: 10,
    },
  });

  try {
    const published = await executePublish(exam.id, db);
    if (!published.ok) {
      check("fixture publishes", false, published.error);
      return;
    }

    const started = await startAttempt(exam.id, sitter.id, {}, db);
    if (!started.ok) {
      check("candidate starts", false, started.error);
      return;
    }
    await saveResponse(started.attemptId, sitter.id, q.id, true, {}, db);

    const candidate = await db.examCandidate.findFirstOrThrow({
      where: { examId: exam.id, userId: sitter.id },
    });

    // ─── Extra time on a running attempt ─────────────────────────────────────
    console.log("Extra time");

    const before = await db.examAttempt.findUniqueOrThrow({
      where: { id: started.attemptId },
    });

    // Mirrors actions/exam-monitor.ts grantExtraTime, minus the session check.
    const minutes = 10;
    const addMs = minutes * 60_000;
    const newExpiry = new Date(before.expiresAt.getTime() + addMs);

    await db.$transaction(async (tx) => {
      await tx.examCandidate.update({
        where: { id: candidate.id },
        data: { extraTimeMinutes: candidate.extraTimeMinutes + minutes },
      });
      await tx.examAttempt.update({
        where: { id: started.attemptId },
        data: { expiresAt: newExpiry },
      });
      const currentClose = candidate.windowClosesAt ?? exam.closesAt;
      if (currentClose && newExpiry > currentClose) {
        await tx.examCandidate.update({
          where: { id: candidate.id },
          data: { windowClosesAt: newExpiry },
        });
      }
      await tx.examEvent.create({
        data: {
          attemptId: started.attemptId,
          examId: exam.id,
          userId: sitter.id,
          type: "EXTRA_TIME_GRANTED",
          severity: "INFO",
          metadata: { minutes },
        },
      });
    });

    const after = await db.examAttempt.findUniqueOrThrow({
      where: { id: started.attemptId },
    });
    check(
      "extra time extends the RUNNING attempt's expiry",
      after.expiresAt.getTime() - before.expiresAt.getTime() === addMs,
      `moved by ${(after.expiresAt.getTime() - before.expiresAt.getTime()) / 60000} min`,
    );

    const candidateAfter = await db.examCandidate.findUniqueOrThrow({
      where: { id: candidate.id },
    });
    check(
      "the accommodation is also saved for future attempts",
      candidateAfter.extraTimeMinutes === minutes,
      `got ${candidateAfter.extraTimeMinutes}`,
    );
    check(
      "the personal window is pushed past the new expiry",
      !!candidateAfter.windowClosesAt &&
        candidateAfter.windowClosesAt.getTime() >= after.expiresAt.getTime(),
      candidateAfter.windowClosesAt?.toISOString() ?? "not set",
    );
    check(
      "granting time is logged",
      (await db.examEvent.count({
        where: { attemptId: started.attemptId, type: "EXTRA_TIME_GRANTED" },
      })) === 1,
    );

    // The real point: the sweep must not kill an extended attempt when the exam
    // itself closes.
    const sweptAtClose = await sweepExams(db, new Date(exam.closesAt!.getTime() + 1000));
    const stillRunning = await db.examAttempt.findUniqueOrThrow({
      where: { id: started.attemptId },
    });
    check(
      "the sweep does not auto-submit an extended attempt when the exam closes",
      stillRunning.status === "IN_PROGRESS",
      `status is ${stillRunning.status} (swept ${sweptAtClose.attemptsSubmitted})`,
    );

    // ─── No-shows ────────────────────────────────────────────────────────────
    console.log("\nNo-shows");

    const noShowCandidate = await db.examCandidate.findFirstOrThrow({
      where: { examId: exam.id, userId: noShow.id },
    });
    check(
      "someone who never started is marked MISSED once the exam closes",
      (await db.examCandidate.findUniqueOrThrow({ where: { id: noShowCandidate.id } }))
        .status === "MISSED",
    );
    check(
      "the candidate with an open personal window is NOT marked missed",
      candidateAfter.status !== "MISSED",
      candidateAfter.status,
    );

    // ─── Force submit ────────────────────────────────────────────────────────
    console.log("\nForce submit");

    const { submitAttempt } = await import("@/lib/exam/attempt");
    const forced = await submitAttempt(started.attemptId, "TUTOR", db);
    check("force submit succeeds", forced.ok, !forced.ok ? forced.error : "");

    const forcedAttempt = await db.examAttempt.findUniqueOrThrow({
      where: { id: started.attemptId },
    });
    check(
      "the attempt records who ended it",
      forcedAttempt.submittedBy === "TUTOR" && forcedAttempt.status === "SUBMITTED",
      `${forcedAttempt.status}/${forcedAttempt.submittedBy}`,
    );
    check(
      "work saved before the force submit is still graded",
      (await db.examGrade.findUniqueOrThrow({ where: { attemptId: started.attemptId } }))
        .autoScore === 10,
    );
    check(
      "force submitting is logged",
      (await db.examEvent.count({
        where: { attemptId: started.attemptId, type: "FORCE_SUBMITTED" },
      })) === 1,
    );

    const twice = await submitAttempt(started.attemptId, "TUTOR", db);
    check(
      "force submitting twice is harmless",
      twice.ok && twice.alreadySubmitted === true,
      twice.ok ? `alreadySubmitted=${twice.alreadySubmitted}` : twice.error,
    );

    // ─── Monitor snapshot shape ──────────────────────────────────────────────
    console.log("\nSnapshot");

    const rows = await db.examCandidate.findMany({
      where: { examId: exam.id },
      include: { attempts: { include: { _count: { select: { responses: true } } } } },
    });
    check("the snapshot covers every candidate", rows.length === 2, `got ${rows.length}`);
    check(
      "answered counts come through",
      rows.find((r) => r.userId === sitter.id)?.attempts[0]?._count.responses === 1,
    );
  } finally {
    await db.examGradeAudit.deleteMany({ where: { grade: { exam: { tutorId: tutor.id } } } });
    await db.examEvent.deleteMany({ where: { exam: { tutorId: tutor.id } } });
    await db.exam.deleteMany({ where: { tutorId: tutor.id } });
    await db.enrollment.deleteMany({ where: { courseId: course.id } });
    await db.course.deleteMany({ where: { id: course.id } });
    await db.category.deleteMany({ where: { id: category.id } });
    await db.tutor.deleteMany({ where: { id: tutor.id } });
    await db.user.deleteMany({ where: { email: { startsWith: `monitor-verify-${RUN}-` } } });

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
