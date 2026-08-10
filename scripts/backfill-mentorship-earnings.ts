/**
 * Backfill: write TutorEarning rows for mentorship payments that credited a
 * wallet without recording a ledger entry.
 *
 * Before the fix in lib/payments/finalizePaystack.ts, the mentorship branch
 * incremented User.walletBalance directly and created no TutorEarning. That
 * money is spendable but invisible to the ledger, so wallet balances cannot be
 * reconciled against earnings.
 *
 * This script only ADDS ledger rows to match money already paid. It never
 * touches walletBalance — the wallet is already correct; it is the ledger that
 * is missing entries.
 *
 * Run with:
 *   pnpm tsx scripts/backfill-mentorship-earnings.ts            (dry run)
 *   pnpm tsx scripts/backfill-mentorship-earnings.ts --apply    (writes)
 */

// Must come first: lib/db reads DATABASE_URL at module load.
import "dotenv/config";

import { db as appDb } from "@/lib/db";
import { computeMentorshipSplit, deriveSplitPercent } from "@/lib/payments/revenue";
import type { PrismaClient } from "@prisma/client";

const db = appDb as PrismaClient;

const apply = process.argv.includes("--apply");

async function main() {
  if (!apply) console.log("DRY RUN — pass --apply to write.\n");

  const transactions = await db.transaction.findMany({
    where: {
      status: "COMPLETED",
      metadata: { path: ["productType"], equals: "MENTORSHIP" } as any,
    },
    select: {
      id: true,
      amount: true,
      tutorShareAmount: true,
      metadata: true,
      createdAt: true,
      transactionId: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${transactions.length} completed mentorship transactions.\n`);

  let created = 0;
  let skipped = 0;
  let total = 0;

  for (const tx of transactions) {
    const metadata = (tx.metadata ?? {}) as Record<string, unknown>;
    const tutorId = metadata.tutorUserId as string | undefined;
    const sessionId = metadata.mentorshipSessionId as string | undefined;

    if (!tutorId) {
      console.log(`  ⏭️  ${tx.transactionId}: no tutorUserId in metadata`);
      skipped += 1;
      continue;
    }

    const amount =
      tx.tutorShareAmount ?? computeMentorshipSplit(tx.amount || 0).tutorShareAmount;
    if (amount <= 0) {
      console.log(`  ⏭️  ${tx.transactionId}: zero share`);
      skipped += 1;
      continue;
    }

    // Verify the session actually exists in the DB — the metadata may reference
    // a deleted or non-existent row, which would violate the FK constraint.
    let validSessionId: string | null = null;
    if (sessionId) {
      const sessionExists = await db.mentorshipSession.findUnique({
        where: { id: sessionId },
        select: { id: true },
      });
      if (sessionExists) {
        validSessionId = sessionId;
      } else {
        console.log(`  ⚠️  ${tx.transactionId}: session ${sessionId} not found in DB, linking by transaction only`);
      }
    }

    // Already ledgered? Match on the session where we have one, else on the
    // transaction, so re-running is safe.
    const existing = await db.tutorEarning.findFirst({
      where: {
        source: "MENTORSHIP",
        ...(validSessionId ? { mentorshipSessionId: validSessionId } : { transactionId: tx.id }),
      },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    console.log(
      `  + ${tx.transactionId}: ₦${amount.toLocaleString()} to ${tutorId}${validSessionId ? ` (session ${validSessionId})` : ""}`,
    );
    total += amount;

    if (apply) {
      await db.tutorEarning.create({
        data: {
          tutorId,
          source: "MENTORSHIP",
          amount,
          splitPercent: deriveSplitPercent({
            discountedPrice: tx.amount || 0,
            tutorShareAmount: amount,
          }),
          status: "AVAILABLE",
          transactionId: tx.id,
          mentorshipSessionId: validSessionId,
          // Date the ledger row to the payment, not to when this script ran,
          // so monthly earnings reports stay historically accurate.
          createdAt: tx.createdAt,
        },
      });
    }
    created += 1;
  }

  console.log(
    `\n${apply ? "Created" : "Would create"} ${created} earning(s) totalling ₦${total.toLocaleString()}. Skipped ${skipped}.`,
  );

  await reportReconciliation();
}

/**
 * The wallet is a running balance, the ledger is lifetime earnings, so they are
 * NOT expected to be equal:
 *
 *   walletBalance = earnings(AVAILABLE + PAID) − withdrawals(PAID) ± cashback
 *
 * Comparing the first two alone makes every tutor who has ever withdrawn look
 * like a discrepancy.
 */
async function reportReconciliation() {
  const [ledger, withdrawn, wallets, cashbacks] = await Promise.all([
    db.tutorEarning.groupBy({
      by: ["tutorId"],
      where: { status: { in: ["AVAILABLE", "PAID"] } },
      _sum: { amount: true },
    }),
    db.withdrawalRequest.groupBy({
      by: ["userId"],
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    db.user.findMany({
      where: { walletBalance: { not: 0 } },
      select: { id: true, name: true, walletBalance: true },
    }),
    db.groupPurchase.findMany({
      where: { cashbackReleased: true, cashbackTotal: { gt: 0 } },
      select: {
        cashbackTotal: true,
        creatorId: true,
        course: { select: { tutor: { select: { userId: true } } } },
      },
    }),
  ]);

  const ledgerByTutor = new Map<string, number>(
    ledger.map((row: any) => [row.tutorId, row._sum.amount ?? 0]),
  );
  const withdrawnByUser = new Map<string, number>(
    withdrawn.map((row: any) => [row.userId, row._sum.amount ?? 0]),
  );

  // Group cashback moves walletBalance on both sides and writes NO ledger row,
  // so it has to be reconstructed from the group records.
  const cashbackByUser = new Map<string, number>();
  for (const group of cashbacks) {
    const creditTo = group.creatorId;
    cashbackByUser.set(
      creditTo,
      (cashbackByUser.get(creditTo) ?? 0) + group.cashbackTotal,
    );
    const fundedBy = group.course?.tutor?.userId;
    if (fundedBy) {
      cashbackByUser.set(
        fundedBy,
        (cashbackByUser.get(fundedBy) ?? 0) - group.cashbackTotal,
      );
    }
  }

  console.log("\nReconciliation  (wallet = earnings − withdrawn ± cashback)");
  for (const user of wallets) {
    const earned = ledgerByTutor.get(user.id) ?? 0;
    const paidOut = withdrawnByUser.get(user.id) ?? 0;
    const cashback = cashbackByUser.get(user.id) ?? 0;
    const expected = earned - paidOut + cashback;
    const drift = user.walletBalance - expected;
    console.log(
      `  ${user.name}\n` +
        `    earnings ₦${earned.toLocaleString()}  withdrawn ₦${paidOut.toLocaleString()}  cashback ₦${cashback.toLocaleString()}\n` +
        `    expected ₦${expected.toLocaleString()}  actual ₦${user.walletBalance.toLocaleString()}  ${drift === 0 ? "✅ reconciled" : `⚠️  drift ₦${drift.toLocaleString()}`}`,
    );
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
