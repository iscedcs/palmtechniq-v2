import "server-only";

import { db } from "@/lib/db";
import {
  allocateShareAcrossInstallments,
  toKobo,
} from "@/lib/payments/revenue";
import { summariseTransactions } from "@/lib/payments/transaction-origin";
import type { Period } from "@/lib/payments/distribution";

/**
 * What the platform actually retained in a period, which is what gets split
 * between the stakeholders.
 *
 * TWO SOURCES, because program revenue is not in the Transaction table.
 * Course and mentorship sales each write a Transaction carrying a
 * `platformShareAmount`; professional programs write none, by an earlier
 * deliberate decision, and live only as InstallmentPayment rows. Summing
 * transactions alone would therefore omit program income entirely, which is
 * the largest line the platform has.
 *
 * ONLY `live` MONEY. The Transaction table also holds `legacy` rows (hand
 * logged pre-platform payments, real money but historical and never in the
 * Paystack balance) and `test` rows (verified in Paystack test mode, never
 * real). Adding those together is what once reported ₦45M of revenue against
 * ₦461K collected, so the existing origin classifier is reused to keep them
 * out rather than re-deriving the rule here.
 *
 * ACCRUAL BASIS, NOT CASH. This counts what was earned in the period. It does
 * not subtract Paystack's transaction fees, which are not recorded anywhere,
 * so the figure runs slightly ahead of the cash actually in hand. That gap is
 * caught at approval, which refuses to commit a run larger than the money
 * position says is available, rather than being silently distributed.
 */

export type DistributionBase = {
  totalKobo: number;
  breakdown: {
    /** Courses, bundles and mentorship, from live completed transactions. */
    coursesAndMentorshipKobo: number;
    /** Programs: installments collected, less the lead instructors' shares. */
    programsKobo: number;
    /** Program cash collected before the instructor share was taken out. */
    programGrossKobo: number;
    programInstructorShareKobo: number;
  };
  counts: {
    transactions: number;
    installments: number;
  };
};

export async function computeDistributionBase(
  period: Period,
): Promise<DistributionBase> {
  const [txRows, installments] = await Promise.all([
    db.transaction.findMany({
      where: { paymentDate: { gte: period.start, lte: period.end } },
      select: {
        transactionId: true,
        status: true,
        amount: true,
        vatAmount: true,
        tutorShareAmount: true,
        platformShareAmount: true,
        metadata: true,
      },
    }),
    db.installmentPayment.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: period.start, lte: period.end },
        // A cancelled or dropped enrollment is not revenue to share out.
        enrollment: { status: { notIn: ["CANCELLED", "DROPPED"] } },
      },
      select: {
        id: true,
        amount: true,
        enrollment: {
          select: {
            negotiatedAmount: true,
            program: { select: { fullPrice: true } },
            installments: { select: { id: true, amount: true } },
          },
        },
      },
    }),
  ]);

  // Reuses the pure summariser, so `legacy` and `test` are excluded by the
  // same rule every other money screen uses.
  const summary = summariseTransactions(txRows as any);
  const coursesAndMentorshipKobo = toKobo(
    summary.live.COMPLETED.platformShare,
  );

  let programGrossKobo = 0;
  let programInstructorShareKobo = 0;

  for (const installment of installments) {
    programGrossKobo += toKobo(installment.amount);

    const enrollment = installment.enrollment;
    const basis =
      enrollment.negotiatedAmount ?? enrollment.program.fullPrice;
    const siblings = enrollment.installments;

    // Derived from the formula rather than read off the TutorEarning rows.
    // An accrual only exists once a lead instructor has been assigned, so a
    // cohort still unassigned would otherwise look like 100% platform revenue
    // and be distributed in full, leaving the 25% owed with nothing behind it
    // when the instructor is finally named.
    const shares = allocateShareAcrossInstallments({
      fullPrice: basis,
      installmentAmounts: siblings.map((s: { amount: number }) => s.amount),
    });
    const index = siblings.findIndex(
      (s: { id: string }) => s.id === installment.id,
    );
    if (index >= 0) programInstructorShareKobo += toKobo(shares[index]);
  }

  const programsKobo = programGrossKobo - programInstructorShareKobo;

  return {
    // Never negative: a month with more instructor share than cash collected
    // is a data problem, and a negative base would invert every share.
    totalKobo: Math.max(0, coursesAndMentorshipKobo + programsKobo),
    breakdown: {
      coursesAndMentorshipKobo,
      programsKobo,
      programGrossKobo,
      programInstructorShareKobo,
    },
    counts: {
      transactions: txRows.length,
      installments: installments.length,
    },
  };
}
