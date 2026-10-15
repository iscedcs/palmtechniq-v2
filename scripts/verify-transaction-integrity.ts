/**
 * Read-only health check for the transactions table and tutor wallets.
 *
 *   npx tsx scripts/verify-transaction-integrity.ts
 *
 * Writes nothing. Exits 1 if a FAIL is found, so it can gate a deploy or run on
 * a schedule.
 *
 * WHY
 *
 * Three kinds of bad data got into the live table and nothing flagged them: 17
 * hand-logged payments entered 100x too large, a Paystack test-mode payment
 * counted as revenue, and the wallet credit that test payment produced. Each of
 * these is now a check.
 *
 *   FAIL  a COMPLETED test-mode payment (it must never count as revenue)
 *   FAIL  a legacy row still at an inflated amount (>= N1,000,000)
 *   WARN  a live payment whose VAT + tutor share + platform share is not its amount
 *   WARN  a live course payment with no line item, or no tutor earning
 *   WARN  a wallet whose balance is not the sum of its ledger entries
 *
 * WARN is something to look at, not necessarily wrong: a wallet credit applied
 * at checkout can explain a share mismatch, and balances from before the wallet
 * ledger existed have no entries to sum.
 */
import "dotenv/config";

import { db } from "@/lib/db";
import {
  SUMMARY_STATUSES,
  classifyTransaction,
  summariseTransactions,
  type TransactionOrigin,
} from "@/lib/payments/transaction-origin";

const naira = (n: number) => `N${Math.round(n).toLocaleString("en-NG")}`;
const INFLATED_MIN = 1_000_000;

type Row = {
  id: string;
  transactionId: string;
  status: string;
  amount: number;
  vatAmount: number | null;
  tutorShareAmount: number | null;
  platformShareAmount: number | null;
  metadata: unknown;
  createdAt: Date;
  _count: { lineItems: number; tutorEarnings: number };
};

async function main() {
  const dbName = (
    (await db.$queryRawUnsafe("select current_database()::text as name")) as { name: string }[]
  )[0].name;
  console.log(`Database: ${dbName} (read-only check)\n`);

  const rows = (await db.transaction.findMany({
    select: {
      id: true,
      transactionId: true,
      status: true,
      amount: true,
      vatAmount: true,
      tutorShareAmount: true,
      platformShareAmount: true,
      metadata: true,
      createdAt: true,
      _count: { select: { lineItems: true, tutorEarnings: true } },
    },
  })) as Row[];

  const summary = summariseTransactions(rows);
  console.log("TRANSACTIONS BY ORIGIN AND STATUS");
  for (const origin of ["live", "legacy", "test"] as TransactionOrigin[]) {
    for (const status of SUMMARY_STATUSES) {
      const b = summary[origin][status];
      if (b.count === 0) continue;
      console.log(
        `  ${origin.padEnd(7)} ${status.padEnd(10)} ${String(b.count).padStart(4)} rows  ${naira(b.gross).padStart(12)}`,
      );
    }
  }

  const fails: string[] = [];
  const warns: string[] = [];

  for (const r of rows) {
    const origin = classifyTransaction(r);
    const ref = r.transactionId.slice(0, 36);
    const isMentorship = (r.metadata as { productType?: string } | null)?.productType === "MENTORSHIP";

    if (origin === "test" && r.status === "COMPLETED") {
      fails.push(`COMPLETED test-mode payment counted as a sale: ${ref} (${naira(r.amount)})`);
    }
    if (origin === "legacy" && r.amount >= INFLATED_MIN) {
      fails.push(`legacy row still inflated: ${ref} (${naira(r.amount)})`);
    }
    if (origin !== "live" || r.status !== "COMPLETED") continue;

    const parts = (r.vatAmount ?? 0) + (r.tutorShareAmount ?? 0) + (r.platformShareAmount ?? 0);
    if (!isMentorship && Math.abs(r.amount - parts) > 1) {
      warns.push(`shares do not add up to the amount: ${ref} (amount ${naira(r.amount)}, VAT + shares ${naira(parts)})`);
    }
    if (!isMentorship && r._count.lineItems === 0) warns.push(`live course payment with no line item: ${ref}`);
    if (!isMentorship && r._count.tutorEarnings === 0) warns.push(`live course payment with no tutor earning: ${ref}`);
  }

  // Wallet invariant: balance === sum(ledger entries). See lib/payments/wallet.ts.
  const entrySums = (await db.walletEntry.groupBy({
    by: ["userId"],
    _sum: { amount: true },
  })) as { userId: string; _sum: { amount: number | null } }[];
  const sumByUser = new Map(entrySums.map((e) => [e.userId, e._sum.amount ?? 0]));
  const wallets = (await db.user.findMany({
    where: { OR: [{ walletBalance: { not: 0 } }, { id: { in: [...sumByUser.keys()] } }] },
    select: { id: true, name: true, walletBalance: true },
  })) as { id: string; name: string | null; walletBalance: number }[];

  for (const u of wallets) {
    const sum = sumByUser.get(u.id) ?? 0;
    if (Math.abs(u.walletBalance - sum) > 0.005) {
      warns.push(
        `wallet of ${u.name ?? u.id}: balance ${naira(u.walletBalance)} but ledger entries sum to ${naira(sum)} (difference ${naira(u.walletBalance - sum)})`,
      );
    }
  }

  console.log(`\nFAIL (${fails.length})`);
  for (const f of fails) console.log(`  ${f}`);
  console.log(`\nWARN (${warns.length})`);
  for (const w of warns) console.log(`  ${w}`);
  console.log(fails.length === 0 ? "\nNo failures." : "\nFailures found.");

  if (fails.length > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect?.();
  });
