/**
 * Releases course and mentorship earnings whose refund window has closed.
 *
 * Both are accrued as PENDING at settlement and held for the length of the
 * published money-back guarantee, so the money a student could still reclaim
 * is never withdrawable. This moves them into the wallet once that window has
 * passed, which is the only point at which they become the tutor's to take.
 *
 * PROGRAM earnings are deliberately NOT touched here. They carry a second gate
 * (never before the cohort starts, so a cancelled cohort never pays out) and
 * are released by an explicit admin action per cohort, in
 * `actions/program-earnings.ts`. Course and mentorship sales have no
 * equivalent judgement to make, so they release on a timer instead of waiting
 * on someone to click.
 *
 * Idempotent, and safe to run as often as you like. The status change is a
 * conditional update, so a second overlapping run finds nothing to claim and
 * credits nothing. A missed run is picked up by the next one, and a late run
 * does exactly the same work.
 */

import { db } from "@/lib/db";
import { creditWallet } from "@/lib/payments/wallet";
import { notify } from "@/lib/notify";

/** How many earnings one pass will release. Keeps a backlog from timing out. */
const BATCH_SIZE = 500;

type ReleaseResult = {
  released: number;
  total: number;
  tutorsCredited: number;
  /** True when the batch filled, so another pass has work waiting. */
  more: boolean;
};

export async function releaseDueEarnings(
  now: Date = new Date(),
): Promise<ReleaseResult> {
  const due = await db.tutorEarning.findMany({
    where: {
      source: { in: ["COURSE", "MENTORSHIP"] },
      status: "PENDING",
      availableAt: { lte: now },
    },
    orderBy: { availableAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true, tutorId: true, amount: true, source: true },
  });

  if (due.length === 0) {
    return { released: 0, total: 0, tutorsCredited: 0, more: false };
  }

  // Per-tutor totals, so a tutor with twenty released sales gets one notice
  // for the sum rather than twenty notices for a few naira each.
  const byTutor = new Map<string, number>();
  let released = 0;
  let total = 0;

  // One transaction per earning rather than one for the batch. A single
  // transaction over 500 rows holds locks long enough to collide with
  // settlement, and a failure part-way would roll back work already done
  // correctly. Each earning is independent, so each one commits on its own and
  // a failure costs exactly that earning, which the next pass retries.
  for (const earning of due) {
    try {
      const credited = await db.$transaction(async (tx: any) => {
        // Re-check the status inside the transaction. This is what makes an
        // overlapping run a no-op instead of a second credit.
        const claimed = await tx.tutorEarning.updateMany({
          where: { id: earning.id, status: "PENDING" },
          data: { status: "AVAILABLE", releasedAt: now },
        });
        if (claimed.count === 0) return false;

        await creditWallet(tx, {
          userId: earning.tutorId,
          amount: earning.amount,
          type:
            earning.source === "MENTORSHIP"
              ? "MENTORSHIP_EARNING"
              : "COURSE_EARNING",
          tutorEarningId: earning.id,
          description:
            earning.source === "MENTORSHIP"
              ? "Mentorship earnings released"
              : "Course earnings released",
        });
        return true;
      });

      if (!credited) continue;

      released += 1;
      total += earning.amount;
      byTutor.set(
        earning.tutorId,
        (byTutor.get(earning.tutorId) ?? 0) + earning.amount,
      );
    } catch (error) {
      // Logged and skipped, not thrown. One tutor's bad row must not stop the
      // rest of the batch from being paid, and the next pass retries it.
      console.error(
        `[release-earnings] could not release ${earning.id}:`,
        error,
      );
    }
  }

  // Sent after the money has committed, and never inside a transaction: a
  // failing notice must not roll back a correct credit. `notify.user` swallows
  // its own errors, so one undeliverable notice cannot stop the rest.
  for (const [tutorId, amount] of byTutor) {
    await notify.user(tutorId, {
      type: "payment",
      title: "Earnings available",
      message: `₦${amount.toLocaleString()} has been released to your wallet and is now available to withdraw.`,
      actionUrl: "/tutor/wallet",
      actionLabel: "View wallet",
      metadata: { category: "earnings_released", amount },
    });
  }

  return {
    released,
    total,
    tutorsCredited: byTutor.size,
    more: due.length === BATCH_SIZE,
  };
}
