/**
 * Verification script for Exam Center notifications.
 *
 * Runs with EXAM_NOTIFICATIONS_DRY_RUN=1, so nothing is actually mailed — the
 * point is the idempotency rules, which are the part that would otherwise be
 * discovered by a student receiving the same email four times.
 *
 * Self-contained fixture, torn down in a `finally`. Does NOT touch existing data.
 *
 * The bootstrap preload is required — it sets the dry-run flag and stubs
 * `server-only` before any module is loaded. Statements at the top of this file
 * would run too late, because TypeScript hoists every require above them.
 *
 * Run with:
 *   pnpm tsx --require ./scripts/_exam-test-bootstrap.cjs scripts/verify-exam-notifications.ts
 */

import "dotenv/config";

import { db as appDb } from "@/lib/db";
import { saveResponse, startAttempt, submitAttempt } from "@/lib/exam/attempt";
import {
  notifyExamScheduled,
  notifyResultsReleased,
  notifyUpcomingExams,
} from "@/lib/exam/notifications";
import { executePublish } from "@/lib/exam/publish";
import { releaseExamResults } from "@/lib/exam/results";
import { ExamSubmittedBy, type PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const db = appDb as PrismaClient;

const RUN = randomUUID().slice(0, 8);
const tag = (s: string) => `[notif-verify-${RUN}] ${s}`;
const email = (s: string) => `notif-verify-${RUN}-${s}@invalid.test`;

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
  // Refuse to run for real. Without the bootstrap this would mail every fixture
  // address, and a verification script must never be able to send mail.
  if (process.env.EXAM_NOTIFICATIONS_DRY_RUN !== "1") {
    console.error(
      "Refusing to run: dry-run is not enabled.\n" +
        "Run with: pnpm tsx --require ./scripts/_exam-test-bootstrap.cjs scripts/verify-exam-notifications.ts",
    );
    process.exitCode = 1;
    return;
  }

  console.log(`\nExam notification verification (run ${RUN}) — DRY RUN, no mail sent\n`);

  const tutorUser = await db.user.create({
    data: { email: email("tutor"), name: tag("Tutor"), role: "TUTOR" },
  });
  const tutor = await db.tutor.create({
    data: { userId: tutorUser.id, title: tag("Tutor"), experience: 1 },
  });
  const category = await db.category.create({
    data: { name: tag("Cat"), slug: `notif-verify-${RUN}` },
  });
  const course = await db.course.create({
    data: {
      title: tag("Course"),
      slug: `notif-verify-course-${RUN}`,
      description: "fixture",
      subtitle: "fixture",
      price: 0,
      categoryId: category.id,
      creatorId: tutorUser.id,
      tutorId: tutor.id,
    },
  });

  const [alice, bob] = await Promise.all([
    db.user.create({ data: { email: email("alice"), name: tag("Alice"), role: "STUDENT" } }),
    db.user.create({ data: { email: email("bob"), name: tag("Bob"), role: "STUDENT" } }),
  ]);
  await db.enrollment.createMany({
    data: [
      { userId: alice.id, courseId: course.id, status: "ACTIVE" },
      { userId: bob.id, courseId: course.id, status: "ACTIVE" },
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
      closesAt: new Date(now + 6 * 60 * 60_000),
      durationMinutes: 30,
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
    await executePublish(exam.id, db);

    // ─── Scheduled notice ────────────────────────────────────────────────────
    console.log("Scheduled notice");

    const first = await notifyExamScheduled(exam.id, db);
    check("everyone on the roster is notified", first.sent === 2, `sent ${first.sent}`);

    const second = await notifyExamScheduled(exam.id, db);
    check(
      "notifying again sends nothing",
      second.sent === 0,
      `sent ${second.sent} — ${second.reason ?? ""}`,
    );

    const stamped = await db.examCandidate.count({
      where: { examId: exam.id, notifiedAt: { not: null } },
    });
    check("both candidates are stamped as notified", stamped === 2, `got ${stamped}`);

    // A late joiner gets the notice; the original roster does not get it twice.
    const late = await db.user.create({
      data: { email: email("late"), name: tag("Late"), role: "STUDENT" },
    });
    await db.examCandidate.create({
      data: { examId: exam.id, userId: late.id, addedManually: true },
    });

    const third = await notifyExamScheduled(exam.id, db);
    check("a late addition is notified", third.sent === 1, `sent ${third.sent}`);
    check("the original roster is not notified again", third.attempted === 1);

    // An excluded candidate must never be mailed.
    const excluded = await db.user.create({
      data: { email: email("excluded"), name: tag("Excluded"), role: "STUDENT" },
    });
    await db.examCandidate.create({
      data: {
        examId: exam.id,
        userId: excluded.id,
        addedManually: true,
        excludedAt: new Date(),
      },
    });
    const fourth = await notifyExamScheduled(exam.id, db);
    check("an excluded candidate is not mailed", fourth.sent === 0, `sent ${fourth.sent}`);

    // ─── Reminders ───────────────────────────────────────────────────────────
    console.log("\nReminders");

    // Reminders only cover exams that have not opened yet.
    const upcoming = await db.exam.create({
      data: {
        title: tag("Upcoming"),
        scopeType: "COURSE",
        courseId: course.id,
        tutorId: tutor.id,
        opensAt: new Date(now + 6 * 60 * 60_000),
        closesAt: new Date(now + 12 * 60 * 60_000),
        durationMinutes: 30,
        status: "SCHEDULED",
      },
    });
    await db.examCandidate.createMany({
      data: [
        { examId: upcoming.id, userId: alice.id },
        { examId: upcoming.id, userId: bob.id },
      ],
    });

    const reminders = await notifyUpcomingExams(db, new Date(now));
    check(
      "candidates for an exam opening within 24h are reminded",
      reminders.sent === 2,
      `sent ${reminders.sent}`,
    );

    const remindAgain = await notifyUpcomingExams(db, new Date(now));
    check(
      "the reminder sweep does not re-send",
      remindAgain.sent === 0,
      `sent ${remindAgain.sent}`,
    );

    // An exam further out than the horizon is left alone.
    const distant = await db.exam.create({
      data: {
        title: tag("Distant"),
        scopeType: "COURSE",
        courseId: course.id,
        tutorId: tutor.id,
        opensAt: new Date(now + 10 * 24 * 60 * 60_000),
        closesAt: new Date(now + 11 * 24 * 60 * 60_000),
        durationMinutes: 30,
        status: "SCHEDULED",
      },
    });
    await db.examCandidate.create({ data: { examId: distant.id, userId: alice.id } });

    const distantReminders = await notifyUpcomingExams(db, new Date(now));
    check(
      "an exam beyond the horizon is not reminded about",
      distantReminders.sent === 0,
      `sent ${distantReminders.sent}`,
    );

    // ─── Results ─────────────────────────────────────────────────────────────
    console.log("\nResults");

    const beforeRelease = await notifyResultsReleased(exam.id, db);
    check(
      "nothing is sent before results are released",
      beforeRelease.sent === 0,
      beforeRelease.reason ?? `sent ${beforeRelease.sent}`,
    );

    const attempt = await startAttempt(exam.id, alice.id, {}, db);
    if (attempt.ok) {
      await saveResponse(attempt.attemptId, alice.id, q.id, true, {}, db);
      await submitAttempt(attempt.attemptId, ExamSubmittedBy.STUDENT, db);
    }

    await releaseExamResults(exam.id, tutorUser.id, db);

    const resultNotice = await notifyResultsReleased(exam.id, db);
    check(
      "only the candidate whose result was released is mailed",
      resultNotice.sent === 1,
      `sent ${resultNotice.sent}`,
    );

    const resultAgain = await notifyResultsReleased(exam.id, db);
    check(
      "results notices are not re-sent",
      resultAgain.sent === 0,
      `sent ${resultAgain.sent}`,
    );

    // ─── In-app notifications ────────────────────────────────────────────────
    console.log("\nIn-app");

    const inApp = await db.notification.count({
      where: { userId: { in: [alice.id, bob.id] }, title: { contains: "exam" } },
    });
    check("in-app notifications are created alongside the email", inApp >= 2, `got ${inApp}`);
  } finally {
    await db.notification.deleteMany({
      where: { user: { email: { startsWith: `notif-verify-${RUN}-` } } },
    });
    await db.examGradeAudit.deleteMany({ where: { grade: { exam: { tutorId: tutor.id } } } });
    await db.examEvent.deleteMany({ where: { exam: { tutorId: tutor.id } } });
    await db.certificate.deleteMany({ where: { courseId: course.id } });
    await db.exam.deleteMany({ where: { tutorId: tutor.id } });
    await db.enrollment.deleteMany({ where: { courseId: course.id } });
    await db.course.deleteMany({ where: { id: course.id } });
    await db.category.deleteMany({ where: { id: category.id } });
    await db.tutor.deleteMany({ where: { id: tutor.id } });
    await db.user.deleteMany({ where: { email: { startsWith: `notif-verify-${RUN}-` } } });

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
