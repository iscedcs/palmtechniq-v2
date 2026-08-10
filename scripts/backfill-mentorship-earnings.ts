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

    // Already ledgered? Match on the session where we have one, else on the
    // transaction, so re-running is safe.
    const existing = await db.tutorEarning.findFirst({
      where: {
        source: "MENTORSHIP",
        ...(sessionId ? { mentorshipSessionId: sessionId } : { transactionId: tx.id }),
      },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    console.log(
      `  + ${tx.transactionId}: ₦${amount.toLocaleString()} to ${tutorId}${sessionId ? ` (session ${sessionId})` : ""}`,
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
          mentorshipSessionId: sessionId ?? null,
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

  // Report the reconciliation position so the effect is measurable.
  const [ledger, wallets] = await Promise.all([
    db.tutorEarning.groupBy({
      by: ["tutorId"],
      where: { status: { in: ["AVAILABLE", "PAID"] } },
      _sum: { amount: true },
    }),
    db.user.findMany({
      where: { walletBalance: { not: 0 } },
      select: { id: true, name: true, walletBalance: true },
    }),
  ]);

  const ledgerByTutor = new Map(
    ledger.map((row: any) => [row.tutorId, row._sum.amount ?? 0]),
  );

  console.log("\nWallet vs ledger:");
  for (const user of wallets) {
    const ledgered = ledgerByTutor.get(user.id) ?? 0;
    const gap = user.walletBalance - ledgered;
    console.log(
      `  ${user.name}: wallet ₦${user.walletBalance.toLocaleString()} | ledger ₦${ledgered.toLocaleString()} | gap ₦${gap.toLocaleString()}`,
    );
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
