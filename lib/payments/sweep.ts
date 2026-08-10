import { db } from "@/lib/db";
import { finalizePaystackByReference } from "@/lib/payments/finalizePaystack";

/**
 * Backstop for payments that were charged but never settled.
 *
 * The primary path is the Paystack callback and webhook. This catches the
 * cases they miss: the browser closed during redirect, the webhook was lost,
 * or settlement itself threw — which is exactly what a transaction timeout
 * produced during bundle testing, leaving money collected and nothing
 * delivered.
 *
 * Every pass is idempotent. finalizePaystackByReference re-verifies against
 * Paystack and returns early on an already-COMPLETED transaction, so a repeat
 * run does no harm and a missed run is picked up by the next one.
 */

export type PaymentSweepReport = {
  considered: number;
  settled: number;
  failed: number;
  stillPending: number;
  errors: number;
  /** References that threw, so a persistent failure is visible in the log. */
  errorReferences: string[];
};

export async function sweepPendingPayments({
  /**
   * Leave recent transactions alone: a student may still be on the Paystack
   * page. Sweeping too eagerly would mark a live checkout as failed.
   */
  graceMinutes = 15,
  /**
   * Recovery horizon. Deliberately generous: a charge that succeeded weeks ago
   * and never settled is the WORST case, not the least important — that
   * customer has been without access the longest. Cost stays bounded because
   * an abandoned checkout is marked FAILED on its first pass and leaves the
   * PENDING set, so nothing is retried forever.
   */
  maxAgeDays = 90,
  /** Bounded per run so one pass cannot take unbounded time. */
  limit = 25,
}: {
  graceMinutes?: number;
  maxAgeDays?: number;
  limit?: number;
} = {}): Promise<PaymentSweepReport> {
  const now = Date.now();
  const before = new Date(now - graceMinutes * 60 * 1000);
  const after = new Date(now - maxAgeDays * 24 * 60 * 60 * 1000);

  const stranded = await db.transaction.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: before, gt: after },
      paymentMethod: { in: ["PAYSTACK", "paystack"] },
    },
    select: { id: true, transactionId: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const report: PaymentSweepReport = {
    considered: stranded.length,
    settled: 0,
    failed: 0,
    stillPending: 0,
    errors: 0,
    errorReferences: [],
  };

  for (const tx of stranded) {
    try {
      const result = await finalizePaystackByReference(tx.transactionId);
      if (result.ok) {
        report.settled += 1;
      } else if (result.reason === "failed") {
        // Verified with Paystack and the charge did not succeed — an
        // abandoned checkout. finalize has marked it FAILED.
        report.failed += 1;
      } else {
        report.stillPending += 1;
      }
    } catch (error) {
      // One bad reference must not stop the rest of the batch.
      report.errors += 1;
      report.errorReferences.push(tx.transactionId);
      console.error(
        `[payment-sweep] ${tx.transactionId} failed to settle:`,
        error,
      );
    }
  }

  return report;
}

/**
 * Wallets whose balance disagrees with their ledger.
 *
 * Should always be zero. Anything else means a balance moved without a
 * WalletEntry, which is the failure that let group cashback create money
 * unnoticed. Reported by the sweep so it surfaces on its own rather than
 * waiting for someone to go looking.
 */
export async function countDriftingWallets() {
  const [users, entries] = await Promise.all([
    db.user.findMany({
      where: { OR: [{ walletBalance: { not: 0 } }, { walletEntries: { some: {} } }] },
      select: { id: true, walletBalance: true },
    }),
    db.walletEntry.groupBy({ by: ["userId"], _sum: { amount: true } }),
  ]);

  const ledger = new Map<string, number>(
    entries.map((row: any) => [row.userId, row._sum.amount ?? 0]),
  );

  return users.filter(
    (u: any) =>
      Math.round((u.walletBalance - (ledger.get(u.id) ?? 0)) * 100) !== 0,
  ).length;
}

/** Count of transactions still stranded, for visibility in the sweep output. */
export async function countStrandedPayments(graceMinutes = 15) {
  return db.transaction.count({
    where: {
      status: "PENDING",
      createdAt: { lt: new Date(Date.now() - graceMinutes * 60 * 1000) },
    },
  });
}
