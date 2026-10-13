/**
 * Remove the enrolments that only existed because of legacy payments the
 * business does not recognise.
 *
 *   npx tsx scripts/remove-unrecognized-enrollments.ts            # dry run (default)
 *   npx tsx scripts/remove-unrecognized-enrollments.ts --apply    # delete them
 *
 * WHY
 *
 * Every manually logged payer was enrolled in one bulk pass on 2026-02-08. Once
 * a payment is judged not to be real, the access it granted has nothing behind
 * it. remove-unrecognized-legacy-payments.ts removes the payments; this removes
 * the enrolments they leave behind.
 *
 * WHAT
 *
 * Deletes only enrolments listed in TARGETS that are untouched: ACTIVE, 0%
 * progress, no completion, no certificate, no lesson progress, no quiz
 * attempts, not part of a group purchase, and with no COMPLETED payment left
 * for that buyer and course. One that shows real use is BLOCKED: it is skipped
 * and reported with the detail, never deleted, because deleting an enrolment
 * also deletes the progress attached to it. A wrong buyer, or a recognised
 * payment still on record, stops the script outright.
 *
 * An entry marked `afterPaymentRemoved` is skipped, not failed, while its
 * payment still exists, so the two scripts can be run in either order.
 *
 * SAFETY
 *
 *   - Dry run by default; one database transaction; asserts before writing.
 *   - The enrolments are saved to a JSON file in your home folder (outside the
 *     repo) before anything is deleted.
 *   - Re-running is safe: enrolments already gone are skipped.
 */
import "dotenv/config";

import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { db } from "@/lib/db";

function fail(message: string): never {
  throw new Error(`Refusing to continue: ${message}`);
}

const TARGETS: {
  who: string;
  email: string;
  course: string;
  afterPaymentRemoved?: boolean;
  /**
   * Allow deleting lesson progress with the enrolment, but only when it shows
   * no real use (nothing completed, no watch time). Decided case by case.
   */
  allowEmptyProgress?: boolean;
}[] = [
  { who: "Zach", email: "dragonwarrioroftheearth@gmail.com", course: "Cyber Security" },
  { who: "Ogochi", email: "stellinaella2227@gmail.com", course: "Digital Marketing" },
  { who: "Favour", email: "ezehfavour35@gmail.com", course: "SmartHome Automation" },
  // Decided 2026-10-13: 3 lesson progress rows, none completed, no watch time.
  { who: "Preciousgift", email: "chukwusomagachukwujekwu@gmail.com", course: "web-development", allowEmptyProgress: true },
  { who: "Preciousgift", email: "chukwusomagachukwujekwu@gmail.com", course: "Mobile App Development" },
  { who: "Chinedu", email: "chineduabalogu@gmail.com", course: "Digital Marketing", afterPaymentRemoved: true },
];

type Enrolment = {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  progress: number;
  completedAt: Date | null;
  certificateIssued: boolean;
  groupPurchaseId: string | null;
  enrolledAt: Date;
  user: { name: string | null; email: string | null };
  course: { title: string };
  _count: { lessonProgress: number; quizAttempts: number };
};

async function main() {
  const apply = process.argv.includes("--apply");

  const dbName = (
    (await db.$queryRawUnsafe("select current_database()::text as name")) as { name: string }[]
  )[0].name;
  console.log(`Database: ${dbName}`);
  console.log(apply ? "Mode: APPLY (will write)" : "Mode: dry run (nothing will be written)");

  const toDelete: Enrolment[] = [];
  const notes: string[] = [];
  const blocked: { label: string; reasons: string[] }[] = [];
  const progressBackup: unknown[] = [];

  for (const t of TARGETS) {
    const matches = (await db.enrollment.findMany({
      where: {
        user: { email: { equals: t.email, mode: "insensitive" } },
        course: { title: t.course },
      },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
        _count: { select: { lessonProgress: true, quizAttempts: true } },
      },
    })) as Enrolment[];

    if (matches.length === 0) {
      notes.push(`${t.who} / ${t.course}: no enrolment found (already removed)`);
      continue;
    }
    if (matches.length > 1) fail(`${t.who} / ${t.course} matches ${matches.length} enrolments`);
    const e = matches[0];

    if (!(e.user.name ?? "").toLowerCase().startsWith(t.who.toLowerCase()))
      fail(`${t.email} belongs to "${e.user.name}", expected ${t.who}`);

    const payments = await db.transaction.count({
      where: { userId: e.userId, courseId: e.courseId, status: "COMPLETED" },
    });
    if (payments > 0) {
      if (t.afterPaymentRemoved) {
        notes.push(`${t.who} / ${t.course}: skipped, a recognised payment still exists (remove the payment first)`);
        continue;
      }
      fail(`${t.who} / ${t.course} still has ${payments} COMPLETED payment(s)`);
    }

    // Anything that shows the enrolment was actually used blocks it: it is
    // skipped and reported, never deleted, because deleting it deletes the
    // progress attached to it.
    const reasons: string[] = [];
    if (e.status !== "ACTIVE") reasons.push(`status is ${e.status}`);
    if (e.progress !== 0) reasons.push(`${e.progress}% progress`);
    if (e.completedAt || e.certificateIssued) reasons.push("completed or has a certificate");
    if (e.groupPurchaseId) reasons.push("part of a group purchase");
    if (e._count.quizAttempts > 0) reasons.push(`${e._count.quizAttempts} quiz attempt(s)`);
    if (e._count.lessonProgress > 0) {
      const rows = (await db.lessonProgress.findMany({
        where: { enrollmentId: e.id },
        select: { isCompleted: true, watchTime: true, updatedAt: true },
      })) as { isCompleted: boolean; watchTime: number; updatedAt: Date }[];
      const done = rows.filter((r) => r.isCompleted).length;
      const watched = rows.reduce((sum, r) => sum + r.watchTime, 0);
      const last = rows.map((r) => r.updatedAt.getTime()).sort((a, b) => a - b)[rows.length - 1];
      const detail = `${rows.length} lesson progress row(s), ${done} completed, total watch time ${watched}, last activity ${new Date(last).toISOString().slice(0, 10)}`;
      if (t.allowEmptyProgress && done === 0 && watched === 0) {
        notes.push(`${t.who} / ${t.course}: its ${detail} will be deleted with the enrolment`);
        progressBackup.push(
          ...(await db.lessonProgress.findMany({ where: { enrollmentId: e.id } })),
        );
      } else {
        reasons.push(detail);
      }
    }

    if (reasons.length > 0) {
      blocked.push({ label: `${t.who} / ${t.course} (${e.user.email})`, reasons });
      continue;
    }

    toDelete.push(e);
  }

  console.log(`\nTO REMOVE (${toDelete.length} enrolments)\n`);
  for (const e of toDelete) {
    console.log(
      `  ${(e.user.name ?? "?").slice(0, 26).padEnd(26)} ${e.course.title.slice(0, 24).padEnd(24)} ` +
        `${e.status} ${Math.round(e.progress)}% since ${e.enrolledAt.toISOString().slice(0, 10)}  ${e.user.email}`,
    );
  }
  if (blocked.length > 0) {
    console.log(`\nBLOCKED, NOT DELETED (${blocked.length}): these show real use, so they need a decision\n`);
    for (const b of blocked) {
      console.log(`  ${b.label}`);
      for (const r of b.reasons) console.log(`      ${r}`);
    }
  }
  if (notes.length > 0) {
    console.log("\nNOTES\n");
    for (const n of notes) console.log(`  ${n}`);
  }

  if (!apply) {
    if (toDelete.length > 0) console.log("\nRe-run with --apply to delete the enrolments above.");
    return;
  }
  if (toDelete.length === 0) return;

  const backupDir = join(homedir(), "palmtechniq-backups");
  mkdirSync(backupDir, { recursive: true });
  const backupPath = join(backupDir, `unrecognized-enrollments-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(backupPath, JSON.stringify({ database: dbName, enrolments: toDelete, lessonProgress: progressBackup }, null, 2));
  console.log(`\nBackup written: ${backupPath}`);

  await db.$transaction(
    async (tx: any) => {
      const res = await tx.enrollment.deleteMany({ where: { id: { in: toDelete.map((e) => e.id) } } });
      if (res.count !== toDelete.length) throw new Error(`deleted ${res.count} enrolments, expected ${toDelete.length}`);
    },
    { timeout: 60_000, maxWait: 30_000 },
  );

  console.log(`\nApplied. ${toDelete.length} enrolment(s) removed.`);
}

main()
  .catch((err) => {
    console.error(`\n${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect?.();
  });
