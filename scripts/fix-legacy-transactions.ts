/**
 * One-time cleanup of the live transactions table.
 *
 *   npx tsx scripts/fix-legacy-transactions.ts            # dry run (default)
 *   npx tsx scripts/fix-legacy-transactions.ts --apply    # write it
 *   ... --wallet-debit=157500                              # override the wallet correction
 *
 * WHY
 *
 * Before payments ran through the platform they were logged by hand, and those
 * 17 rows (reference `course-<slug>-<timestamp>`) were entered 100x too large:
 * a N90,000 payment sits in the table as N9,000,000. Seven of them were also
 * left FAILED although the money was received. The admin dashboard sums every
 * row, so it reports N45M completed and N52M failed against roughly N970K of
 * real revenue. One further row is a Paystack TEST-mode payment that was
 * counted as revenue and credited a tutor wallet.
 *
 * WHAT
 *
 *   1. The 14 inflated legacy rows are divided by 100. The 7 of those that were
 *      FAILED become COMPLETED (confirmed as real payments). The 3 legacy rows
 *      already at N90,000 are left exactly as they are, still FAILED.
 *      All 17 are tagged metadata.source = "legacy-manual", with the original
 *      amount and status kept in metadata.legacyCleanup, so nothing is lost and
 *      dashboards can tell them apart from live Paystack payments.
 *   2. The test payment is deleted, with its tutor earning, VAT row and line
 *      item (these cascade), plus the buyer's enrolment it created.
 *   3. The wallet credit that test earning put into the tutor's balance is
 *      reversed through debitWallet as an ADJUSTMENT, so the ledger records why.
 *
 * SAFETY
 *
 *   - Dry run by default. Everything runs in ONE database transaction, so it
 *     applies completely or not at all.
 *   - Every figure this script assumes is asserted first. If the data is not
 *     what was audited, it stops without writing.
 *   - Before writing, every affected row is saved to a JSON file in your home
 *     folder (outside the repo, because it contains names).
 *   - Re-running is safe: rows already tagged are skipped, and a test payment
 *     that is already gone is skipped.
 */
import "dotenv/config";

import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { db } from "@/lib/db";
import { debitWallet } from "@/lib/payments/wallet";

const LEGACY_REF = /^course-.+-\d{10,}$/;
/** Legacy amounts at or above this were entered 100x too large. */
const INFLATED_MIN = 1_000_000;

// Identified by the audit run on the live database.
const TEST_TX_ID = "cmnokwm0u0005b4fd8orr1bif";
const TEST_TX_REF = "ps_dac171e0-fede-4cef-bb26-db8d981abcad";
const TEST_ENROLLMENT_ID = "cmnokx3b40007b4fd8vgavuhh";
const TEST_EARNING_ID = "cmnokx4et0009b4fdbfra3vh3";

const naira = (n: number) => `N${Math.round(n).toLocaleString("en-NG")}`;

function fail(message: string): never {
  throw new Error(`Refusing to continue: ${message}`);
}

type Meta = Record<string, unknown> | null;

type TxRow = {
  id: string;
  transactionId: string;
  amount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt: Date;
  metadata: unknown;
};

async function main() {
  const apply = process.argv.includes("--apply");
  const walletArg = process.argv.find((a) => a.startsWith("--wallet-debit="));

  const dbName = (
    (await db.$queryRawUnsafe("select current_database()::text as name")) as { name: string }[]
  )[0].name;
  console.log(`Database: ${dbName}`);
  console.log(apply ? "Mode: APPLY (will write)" : "Mode: dry run (nothing will be written)");

  // ── Part 1: legacy manual rows ─────────────────────────────────────────────
  const legacyAll = (
    (await db.transaction.findMany({
      where: { transactionId: { startsWith: "course-" } },
      orderBy: { createdAt: "asc" },
    })) as TxRow[]
  ).filter((t) => LEGACY_REF.test(t.transactionId));

  const pending = legacyAll.filter((t) => !(t.metadata as Meta)?.legacyCleanup);

  const changes = pending.map((t) => {
    const inflated = t.amount >= INFLATED_MIN;
    return {
      row: t,
      inflated,
      newAmount: inflated ? t.amount / 100 : t.amount,
      newStatus: inflated && t.status === "FAILED" ? "COMPLETED" : t.status,
    };
  });

  if (pending.length > 0) {
    const inflated = changes.filter((c) => c.inflated);
    const normal = changes.filter((c) => !c.inflated);
    if (pending.length !== 17) fail(`expected 17 untouched legacy rows, found ${pending.length}`);
    if (inflated.length !== 14) fail(`expected 14 inflated rows, found ${inflated.length}`);
    if (inflated.filter((c) => c.row.status === "FAILED").length !== 7)
      fail("expected 7 inflated rows that are FAILED");
    if (inflated.filter((c) => c.row.status === "COMPLETED").length !== 7)
      fail("expected 7 inflated rows that are COMPLETED");
    if (inflated.some((c) => c.row.amount % 100 !== 0)) fail("an inflated amount is not divisible by 100");
    if (normal.length !== 3 || normal.some((c) => c.row.amount !== 90_000 || c.row.status !== "FAILED"))
      fail("expected exactly 3 correct rows of N90,000, all FAILED");
    const completedAfter = changes
      .filter((c) => c.newStatus === "COMPLETED")
      .reduce((s, c) => s + c.newAmount, 0);
    if (completedAfter !== 960_000) fail(`legacy completed total would be ${completedAfter}, expected 960000`);
  }

  console.log(`\nPART 1: legacy manual rows (${pending.length} to change, ${legacyAll.length - pending.length} already done)\n`);
  for (const c of changes) {
    const r = c.row;
    console.log(
      `  ${r.createdAt.toISOString().slice(0, 10)}  ${r.status.padEnd(9)} ${naira(r.amount).padStart(12)}` +
        `  ->  ${c.newStatus.padEnd(9)} ${naira(c.newAmount).padStart(9)}   ${r.transactionId.slice(0, 40)}`,
    );
  }

  // ── Part 2: the test-mode payment ─────────────────────────────────────────
  const testTx = await db.transaction.findUnique({
    where: { id: TEST_TX_ID },
    include: { lineItems: true, tutorEarnings: true, vatEntries: true, promoRedemptions: true },
  });

  let tutor: { id: string; name: string | null; walletBalance: number } | null = null;
  let enrollment: Awaited<ReturnType<typeof db.enrollment.findUnique>> = null;
  let walletDebit = 0;

  if (testTx) {
    const domain = (testTx.metadata as { verify?: { domain?: string } } | null)?.verify?.domain;
    if (testTx.transactionId !== TEST_TX_REF) fail("test transaction reference does not match");
    if (testTx.amount !== 322_500 || testTx.status !== "COMPLETED")
      fail("test transaction is not the audited N322,500 COMPLETED row");
    if (domain !== "test") fail("Paystack does not mark this transaction as test mode");
    if (testTx.promoRedemptions.length > 0) fail("test transaction has promo redemptions");

    const earning = testTx.tutorEarnings[0];
    if (testTx.tutorEarnings.length !== 1 || earning.id !== TEST_EARNING_ID)
      fail("expected exactly the one audited tutor earning");
    if (earning.amount !== 150_000 || earning.status !== "AVAILABLE" || earning.releasedAt)
      fail("test earning is not the audited unreleased N150,000");

    enrollment = await db.enrollment.findUnique({ where: { id: TEST_ENROLLMENT_ID } });
    if (!enrollment) fail("the test enrolment was not found");
    if (enrollment.userId !== testTx.userId || enrollment.courseId !== testTx.courseId)
      fail("the enrolment does not belong to the test buyer and course");

    tutor = await db.user.findUnique({
      where: { id: earning.tutorId },
      select: { id: true, name: true, walletBalance: true },
    });
    if (!tutor) fail("the tutor was not found");

    walletDebit = walletArg ? Number(walletArg.split("=")[1]) : earning.amount;
    if (!Number.isFinite(walletDebit) || walletDebit <= 0) fail("invalid --wallet-debit amount");
    if (walletDebit > tutor.walletBalance)
      fail(`wallet debit ${naira(walletDebit)} exceeds the balance ${naira(tutor.walletBalance)}`);

    console.log(`\nPART 2: test-mode payment\n`);
    console.log(`  Delete transaction  ${testTx.transactionId}  ${naira(testTx.amount)}  (Paystack domain: test)`);
    console.log(`  Cascades with it:   ${testTx.tutorEarnings.length} earning (${naira(earning.amount)}), ${testTx.vatEntries ? 1 : 0} VAT row, ${testTx.lineItems.length} line item`);
    console.log(`  Delete enrolment    ${enrollment.id} (${enrollment.status})`);
    console.log(
      `  Wallet ${tutor.name}: ${naira(tutor.walletBalance)} -> ${naira(tutor.walletBalance - walletDebit)}  (ADJUSTMENT of -${naira(walletDebit)})`,
    );
  } else {
    console.log("\nPART 2: test-mode payment already removed, skipping");
  }

  if (!apply) {
    if (pending.length > 0 || testTx) console.log("\nRe-run with --apply to write these changes.");
    return;
  }

  // ── Backup, then write ────────────────────────────────────────────────────
  const backupDir = join(homedir(), "palmtechniq-backups");
  mkdirSync(backupDir, { recursive: true });
  const backupPath = join(backupDir, `transactions-cleanup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  const tutorEntries = tutor
    ? await db.walletEntry.findMany({ where: { userId: tutor.id }, orderBy: { createdAt: "asc" } })
    : [];
  writeFileSync(
    backupPath,
    JSON.stringify({ database: dbName, legacyRows: pending, testTransaction: testTx, testEnrollment: enrollment, tutor, tutorWalletEntries: tutorEntries }, null, 2),
  );
  console.log(`\nBackup written: ${backupPath}`);

  const stamp = new Date().toISOString();
  await db.$transaction(
    async (tx: any) => {
      for (const c of changes) {
        const r = c.row;
        await tx.transaction.update({
          where: { id: r.id },
          data: {
            amount: c.newAmount,
            status: c.newStatus,
            metadata: {
              ...((r.metadata as Meta) ?? {}),
              source: "legacy-manual",
              legacyCleanup: {
                at: stamp,
                originalAmount: r.amount,
                originalStatus: r.status,
                reason: c.inflated
                  ? "Manually logged amount was entered 100x too large; divided by 100."
                  : "Tagged as legacy manual entry; amount and status already correct.",
              },
            },
            // Keep the original audit dates instead of stamping today.
            updatedAt: r.updatedAt,
            verifiedAt: r.verifiedAt,
          },
        });
      }

      if (testTx && tutor && enrollment) {
        await debitWallet(tx, {
          userId: tutor.id,
          amount: walletDebit,
          type: "ADJUSTMENT",
          transactionId: testTx.id,
          tutorEarningId: TEST_EARNING_ID,
          description: `Reversal of test-mode earning from Paystack test payment ${TEST_TX_REF} (cleanup)`,
        });
        await tx.enrollment.delete({ where: { id: enrollment.id } });
        await tx.transaction.delete({ where: { id: testTx.id } });
      }
    },
    { timeout: 120_000, maxWait: 30_000 },
  );

  // ── Report what the dashboard will now show ───────────────────────────────
  const after = await db.transaction.groupBy({
    by: ["status"],
    _count: { _all: true },
    _sum: { amount: true },
  });
  console.log("\nApplied. Dashboard totals now:");
  for (const g of after) {
    console.log(`  ${g.status.padEnd(10)} ${String(g._count._all).padStart(3)} rows  ${naira(g._sum.amount ?? 0)}`);
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
