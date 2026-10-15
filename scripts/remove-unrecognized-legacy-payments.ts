/**
 * Second cleanup of the legacy manual payments: remove the ones the business
 * does not recognise.
 *
 *   npx tsx scripts/remove-unrecognized-legacy-payments.ts            # dry run (default)
 *   npx tsx scripts/remove-unrecognized-legacy-payments.ts --apply    # delete them
 *
 * WHY
 *
 * fix-legacy-transactions.ts corrected the amounts and statuses of the 17
 * manually logged payments. On review, some of them are not payments the
 * business recognises (the buyer never enrolled, or only one of several
 * entries for the same buyer is real). They are removed from the table so they
 * stop counting as revenue, in batches as each is confirmed.
 *
 * WHAT
 *
 * Deletes exactly the transaction rows listed in TARGETS, identified by
 * reference. Each is
 * checked against the buyer, amount and status audited on 2026-10-12, and must
 * carry the tag the first cleanup left (metadata.legacyCleanup), so the script
 * cannot touch a row it was not written for. Nothing else is deleted: enrolments
 * are only listed, never changed, because an enrolment grants access to a course
 * and removing one is a separate decision.
 *
 * SAFETY
 *
 *   - Dry run by default; one database transaction; asserts before writing.
 *   - The rows and the buyers' enrolments are saved to a JSON file in your home
 *     folder (outside the repo) before anything is deleted.
 *   - Re-running is safe: rows already gone are skipped.
 */
import "dotenv/config";

import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { db } from "@/lib/db";

const naira = (n: number) => `N${Math.round(n).toLocaleString("en-NG")}`;

function fail(message: string): never {
  throw new Error(`Refusing to continue: ${message}`);
}

/**
 * Batch 2. Amounts are the corrected ones left by the first cleanup.
 *
 * Batch 1 (7 rows) was applied on 2026-10-12: Zach (cybersecurity-1722545115026),
 * Ogochi (digital-marketing-1734778913944), Favour (smart-home-automation-
 * 1751037377929), Preciousgift x3 (web-development-1737832637236, mobile-app-
 * development-1738685292, web-development-1738743466957) and Emmanuella's
 * earlier duplicate (digital-marketing-1738738150219).
 */
const TARGETS = [
  { ref: "course-digital-marketing-1741907344524", who: "Chinedu", amount: 90_000 },
];

type Row = {
  id: string;
  transactionId: string;
  amount: number;
  status: string;
  createdAt: Date;
  userId: string;
  courseId: string | null;
  metadata: unknown;
  user: { name: string | null; email: string | null } | null;
  course: { title: string } | null;
  lineItems: unknown[];
  tutorEarnings: unknown[];
  vatEntries: unknown | null;
  promoRedemptions: unknown[];
};

async function main() {
  const apply = process.argv.includes("--apply");

  const dbName = (
    (await db.$queryRawUnsafe("select current_database()::text as name")) as {
      name: string;
    }[]
  )[0].name;
  console.log(`Database: ${dbName}`);
  console.log(
    apply
      ? "Mode: APPLY (will write)"
      : "Mode: dry run (nothing will be written)",
  );

  const found: { target: (typeof TARGETS)[number]; row: Row }[] = [];
  let alreadyGone = 0;

  for (const target of TARGETS) {
    const matches = (await db.transaction.findMany({
      where: { transactionId: { startsWith: target.ref } },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
        lineItems: true,
        tutorEarnings: true,
        vatEntries: true,
        promoRedemptions: true,
      },
    })) as Row[];

    if (matches.length === 0) {
      alreadyGone++;
      continue;
    }
    if (matches.length > 1)
      fail(`reference ${target.ref} matches ${matches.length} rows`);
    const row = matches[0];

    if (
      !(row.user?.name ?? "").toLowerCase().startsWith(target.who.toLowerCase())
    )
      fail(
        `${target.ref} belongs to "${row.user?.name}", expected ${target.who}`,
      );
    if (row.amount !== target.amount)
      fail(`${target.ref} amount is ${row.amount}, expected ${target.amount}`);
    if (row.status !== "COMPLETED")
      fail(`${target.ref} status is ${row.status}, expected COMPLETED`);
    if (!(row.metadata as { legacyCleanup?: unknown } | null)?.legacyCleanup)
      fail(`${target.ref} was not tagged by the first cleanup`);
    if (
      row.lineItems.length ||
      row.tutorEarnings.length ||
      row.vatEntries ||
      row.promoRedemptions.length
    )
      fail(`${target.ref} has linked earnings, VAT, line items or promo use`);

    found.push({ target, row });
  }

  if (found.length > 0 && found.length !== TARGETS.length)
    fail(
      `found ${found.length} of ${TARGETS.length} targets; the data is not what was audited`,
    );

  console.log(
    `\nTO REMOVE (${found.length} rows${alreadyGone ? `, ${alreadyGone} already gone` : ""})\n`,
  );
  let removedTotal = 0;
  for (const { row } of found) {
    removedTotal += row.amount;
    console.log(
      `  ${row.createdAt.toISOString().slice(0, 10)}  ${naira(row.amount).padStart(8)}  ` +
        `${(row.user?.name ?? "?").slice(0, 28).padEnd(28)} ${(row.course?.title ?? "?").slice(0, 26).padEnd(26)} ${row.user?.email ?? ""}`,
    );
  }
  if (found.length > 0)
    console.log(
      `  ${"".padEnd(12)}${naira(removedTotal).padStart(8)}  total removed`,
    );

  // What stays, so the keep list can be checked by eye.
  const removeIds = new Set(found.map((f) => f.row.id));
  const remaining = (
    (await db.transaction.findMany({
      where: { transactionId: { startsWith: "course-" } },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    })) as Row[]
  ).filter(
    (t) => !removeIds.has(t.id) && /^course-.+-\d{10,}$/.test(t.transactionId),
  );

  console.log(`\nLEGACY ROWS THAT STAY (${remaining.length})\n`);
  for (const t of remaining) {
    console.log(
      `  ${t.createdAt.toISOString().slice(0, 10)}  ${t.status.padEnd(9)} ${naira(t.amount).padStart(8)}  ` +
        `${(t.user?.name ?? "?").slice(0, 28).padEnd(28)} ${(t.course?.title ?? "?").slice(0, 26).padEnd(26)} ${t.user?.email ?? ""}`,
    );
  }

  // Enrolments of the removed buyers: listed only, never changed here.
  const enrolmentInfo: unknown[] = [];
  if (found.length > 0) {
    console.log(
      "\nENROLMENTS OF THE REMOVED BUYERS (not changed by this script)\n",
    );
    for (const { row } of found) {
      if (!row.courseId) continue;
      const enr = await db.enrollment.findFirst({
        where: { userId: row.userId, courseId: row.courseId },
        select: { id: true, status: true, progress: true, enrolledAt: true },
      });
      const otherPayment = await db.transaction.count({
        where: {
          userId: row.userId,
          courseId: row.courseId,
          status: "COMPLETED",
          id: { notIn: [...removeIds] },
        },
      });
      enrolmentInfo.push({
        transaction: row.transactionId,
        enrolment: enr,
        otherCompletedPayments: otherPayment,
      });
      console.log(
        `  ${(row.user?.name ?? "?").slice(0, 24).padEnd(24)} ${(row.course?.title ?? "?").slice(0, 26).padEnd(26)} ` +
          (enr
            ? `${enr.status} ${Math.round(enr.progress)}% since ${enr.enrolledAt.toISOString().slice(0, 10)}`
            : "no enrolment") +
          (enr
            ? otherPayment > 0
              ? "   (another recognised payment covers it)"
              : "   (NO recognised payment left)"
            : ""),
      );
    }
  }

  if (!apply) {
    if (found.length > 0)
      console.log("\nRe-run with --apply to delete the rows above.");
    return;
  }
  if (found.length === 0) return;

  const backupDir = join(homedir(), "palmtechniq-backups");
  mkdirSync(backupDir, { recursive: true });
  const backupPath = join(
    backupDir,
    `unrecognized-payments-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  writeFileSync(
    backupPath,
    JSON.stringify(
      {
        database: dbName,
        removed: found.map((f) => f.row),
        enrolments: enrolmentInfo,
      },
      null,
      2,
    ),
  );
  console.log(`\nBackup written: ${backupPath}`);

  await db.$transaction(
    async (tx: any) => {
      const res = await tx.transaction.deleteMany({
        where: { id: { in: [...removeIds] } },
      });
      if (res.count !== TARGETS.length)
        throw new Error(
          `deleted ${res.count} rows, expected ${TARGETS.length}`,
        );
    },
    { timeout: 60_000, maxWait: 30_000 },
  );

  const after = await db.transaction.groupBy({
    by: ["status"],
    _count: { _all: true },
    _sum: { amount: true },
  });
  console.log("\nApplied. Dashboard totals now:");
  for (const g of after) {
    console.log(
      `  ${g.status.padEnd(10)} ${String(g._count._all).padStart(3)} rows  ${naira(g._sum.amount ?? 0)}`,
    );
  }
}

main()
  .catch((err) => {
    console.error(`\n${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect?.();
  });
