/**
 * Run the payment sweep by hand.
 *
 * Same code the cron endpoint calls, without needing CRON_SECRET or a
 * deployed URL. Useful for recovering a specific stranded payment
 * immediately rather than waiting for the schedule.
 *
 * Settles charges that were taken but never finalized, and marks abandoned
 * checkouts FAILED — which is also what returns any course credit that was
 * held for them.
 *
 * Run with:
 *   pnpm tsx scripts/sweep-payments.ts             (respects the 15m grace)
 *   pnpm tsx scripts/sweep-payments.ts --now       (no grace, sweeps everything)
 */

import "dotenv/config";

import { db } from "@/lib/db";
import {
  countDriftingWallets,
  countStrandedPayments,
  sweepPendingPayments,
} from "@/lib/payments/sweep";

async function main() {
  const now = process.argv.includes("--now");
  if (now) {
    console.log(
      "No grace period — this will also touch checkouts started moments ago.\n",
    );
  }

  const report = await sweepPendingPayments(
    now ? { graceMinutes: 0 } : undefined,
  );
  console.log(report);

  const [stranded, drifting] = await Promise.all([
    countStrandedPayments(now ? 0 : 15),
    countDriftingWallets(),
  ]);

  console.log(`\nstill stranded: ${stranded}`);
  console.log(
    drifting === 0
      ? "wallets: all reconcile with the ledger"
      : `⚠️  ${drifting} wallet(s) disagree with the ledger`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
