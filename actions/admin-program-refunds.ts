"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { paystackCreateRefund } from "@/actions/paystack";
import { cancelProgramEarning } from "@/actions/program-earnings";
import { assessRefund } from "@/lib/payments/refund";
import { toKobo } from "@/lib/payments/revenue";
import { monthPeriod } from "@/lib/payments/distribution";
import { PLATFORM_EVENTS, trackEvent } from "@/lib/analytics/track";

/**
 * Refunding a professional program or bootcamp enrollment.
 *
 * WHY THIS IS SEPARATE from `admin-refunds.ts`. Programs write no Transaction
 * row, by an earlier deliberate decision, so there is nothing for the course
 * refund path to act on. What exists instead is one InstallmentPayment per
 * payment, each with its own Paystack reference, so a program refund is a
 * refund of installments rather than of a single charge.
 *
 * PER INSTALLMENT, COMMITTED AS IT GOES. Each installment is refunded at
 * Paystack and then immediately recorded before the next one is attempted. The
 * alternative, refunding everything at Paystack and then writing once, loses
 * the record of every refund already made if the write fails. This way a
 * failure part-way leaves the installments already refunded correctly
 * recorded, and the result says exactly which ones moved.
 *
 * WHAT IT DOES NOT DO, deliberately, and reports instead:
 *   - Claw back an instructor share already released to a wallet.
 *   - Recover stakeholder money already distributed for the period the
 *     installment fell in. An approved run is frozen at its agreed figures, so
 *     a refund against an already-distributed month cannot be netted off by
 *     recomputing it.
 */

type InstallmentRow = {
  id: string;
  installmentNo: number;
  amount: number;
  status: string;
  paidAt: Date | null;
  paystackRef: string | null;
};

type PeriodRow = { periodStart: Date; periodEnd: Date };

type PreviewLine = { amount: number; hasReference: boolean; assessment: { ok: boolean } };

type InstallmentOutcome = {
  installmentNo: number;
  amount: number;
  status: "refunded" | "skipped" | "failed" | "cancelled";
  detail: string;
};

export type ProgramRefundResult =
  | {
      ok: true;
      refundedAmount: number;
      outcomes: InstallmentOutcome[];
      enrollmentCancelled: boolean;
      earningsCancelled: number;
      /** Instructor money already paid out, which this cannot reverse. */
      unrecoverableInstructorShare: number;
      /** Periods already distributed that these refunds fall inside. */
      alreadyDistributedPeriods: string[];
      overridden: boolean;
    }
  | { ok: false; error: string; canOverride?: boolean };

export async function refundProgramEnrollment({
  enrollmentId,
  reason,
  override = false,
}: {
  enrollmentId: string;
  reason: string;
  override?: boolean;
}): Promise<ProgramRefundResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Forbidden" };
  }

  const note = reason?.trim();
  if (!note) {
    return { ok: false, error: "A reason is required to refund an enrollment." };
  }

  const enrollment = await db.programEnrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      status: true,
      amountPaid: true,
      fullName: true,
      email: true,
      userId: true,
      cohortId: true,
      programId: true,
      cohort: { select: { startDate: true, displayName: true, seatsTaken: true } },
      program: { select: { name: true } },
      installments: {
        orderBy: { installmentNo: "asc" },
        select: {
          id: true,
          installmentNo: true,
          amount: true,
          status: true,
          paidAt: true,
          paystackRef: true,
        },
      },
    },
  });

  if (!enrollment) return { ok: false, error: "Enrollment not found" };
  if (enrollment.status === "CANCELLED") {
    return { ok: false, error: "This enrollment has already been cancelled." };
  }

  const paid = enrollment.installments.filter(
    (i: InstallmentRow) => i.status === "PAID",
  );
  if (paid.length === 0) {
    return {
      ok: false,
      error:
        "No installment on this enrollment has been paid, so there is nothing to refund. Cancel the enrollment instead.",
    };
  }

  const now = new Date();
  const cohortStart = enrollment.cohort.startDate;

  // Assessed per installment, because each payment has its own refund window.
  // A first installment paid six weeks ago and a second paid last week are not
  // in the same position, and the published policy is explicit that a refund
  // covers what was actually paid.
  const assessments = paid.map((installment: InstallmentRow) => ({
    installment,
    assessment: assessRefund({
      paidAt: installment.paidAt ?? now,
      now,
      amountPaid: installment.amount,
      subject: { kind: "PROGRAM", cohortStart },
      status: "COMPLETED",
    }),
  }));

  const eligible = assessments.filter(
    (a: { assessment: { ok: boolean } }) => a.assessment.ok,
  );

  if (eligible.length === 0 && !override) {
    const first = assessments[0]?.assessment;
    return {
      ok: false,
      error:
        first && !first.ok
          ? first.message
          : "No installment on this enrollment is refundable under the policy.",
      canOverride: true,
    };
  }

  const toRefund = override ? assessments : eligible;

  // Which months have already been distributed. A refund inside one of those
  // cannot be clawed back from the stakeholders, so it is reported rather than
  // silently absorbed.
  const distributed = await db.distribution.findMany({
    where: { status: { in: ["APPROVED", "PAID"] } },
    select: { periodStart: true, periodEnd: true },
  });
  const inDistributedPeriod = (paidAt: Date | null) =>
    paidAt
      ? distributed.some(
          (d: PeriodRow) => paidAt >= d.periodStart && paidAt <= d.periodEnd,
        )
      : false;

  const outcomes: InstallmentOutcome[] = [];
  const alreadyDistributedPeriods = new Set<string>();
  let refundedAmount = 0;
  let earningsCancelled = 0;
  let unrecoverableInstructorShare = 0;

  for (const { installment, assessment } of toRefund) {
    if (!installment.paystackRef) {
      outcomes.push({
        installmentNo: installment.installmentNo,
        amount: installment.amount,
        status: "failed",
        detail:
          "No Paystack reference recorded, so this payment cannot be refunded automatically. Refund it by hand and record it.",
      });
      continue;
    }

    // Paystack first, per installment. Nothing is written for this one unless
    // the money has actually been accepted for return.
    const refund = await paystackCreateRefund({
      reference: installment.paystackRef,
      amountKobo: toKobo(installment.amount),
      reason: note,
    });

    if (!refund.ok) {
      outcomes.push({
        installmentNo: installment.installmentNo,
        amount: installment.amount,
        status: "failed",
        detail: `Paystack refused: ${refund.error}. Nothing was changed for this installment.`,
      });
      continue;
    }

    try {
      const earning = await db.$transaction(async (tx: any) => {
        const claimed = await tx.installmentPayment.updateMany({
          where: { id: installment.id, status: "PAID" },
          data: { status: "REFUNDED" },
        });
        if (claimed.count === 0) return null;

        // Same transaction as the status change: if the accrual is not voided
        // here, the release sweep pays the instructor for a refunded payment.
        const cancelled = await cancelProgramEarning(installment.id, tx);

        await tx.programEnrollment.update({
          where: { id: enrollment.id },
          data: { amountPaid: { decrement: installment.amount } },
        });

        return cancelled;
      });

      if (earning === null) {
        outcomes.push({
          installmentNo: installment.installmentNo,
          amount: installment.amount,
          status: "skipped",
          detail:
            "Refunded at Paystack, but another admin had already recorded it here.",
        });
        continue;
      }

      refundedAmount += installment.amount;
      if (earning.ok) {
        earningsCancelled += earning.cancelled;
      } else {
        unrecoverableInstructorShare += earning.amount ?? 0;
      }

      if (inDistributedPeriod(installment.paidAt)) {
        alreadyDistributedPeriods.add(
          monthPeriod(installment.paidAt ?? now).label,
        );
      }

      outcomes.push({
        installmentNo: installment.installmentNo,
        amount: installment.amount,
        status: "refunded",
        detail: assessment.ok
          ? refund.alreadyRefunded
            ? "Paystack had already refunded this; our records now match."
            : "Refunded."
          : "Refunded as an override, outside the published policy.",
      });
    } catch (error) {
      // The money has left but the record failed. Said plainly, because this
      // is the one case that needs a person to reconcile by hand.
      console.error(
        `[program-refund] refunded installment ${installment.id} at Paystack but could not record it:`,
        error,
      );
      outcomes.push({
        installmentNo: installment.installmentNo,
        amount: installment.amount,
        status: "failed",
        detail:
          "Refunded at Paystack but NOT recorded here. Reconcile this one by hand.",
      });
    }
  }

  // Installments never paid are not expected any more.
  const unpaid = enrollment.installments.filter(
    (i: InstallmentRow) => i.status === "PENDING" || i.status === "OVERDUE",
  );
  if (unpaid.length > 0) {
    await db.installmentPayment.updateMany({
      where: {
        id: { in: unpaid.map((i: InstallmentRow) => i.id) },
        status: { in: ["PENDING", "OVERDUE"] },
      },
      data: { status: "CANCELLED" },
    });
    for (const i of unpaid) {
      outcomes.push({
        installmentNo: i.installmentNo,
        amount: i.amount,
        status: "cancelled",
        detail: "Was never paid and is no longer due.",
      });
    }
  }

  // Anything still PAID means a partial refund, so the seat stays taken and
  // the enrollment stays live.
  const stillPaid = await db.installmentPayment.count({
    where: { enrollmentId: enrollment.id, status: "PAID" },
  });

  let enrollmentCancelled = false;
  if (stillPaid === 0 && refundedAmount > 0) {
    await db.$transaction(async (tx: any) => {
      await tx.programEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "CANCELLED" },
      });
      // Free the seat, floored at zero so a double cancel cannot drive the
      // cohort negative and quietly oversell it later.
      if (enrollment.cohort.seatsTaken > 0) {
        await tx.programCohort.update({
          where: { id: enrollment.cohortId },
          data: { seatsTaken: { decrement: 1 } },
        });
      }
    });
    enrollmentCancelled = true;
  }

  if (refundedAmount === 0) {
    return {
      ok: false,
      error:
        "Nothing was refunded. " +
        outcomes.map((o) => `#${o.installmentNo}: ${o.detail}`).join(" "),
    };
  }

  await trackEvent(PLATFORM_EVENTS.PAYMENT_REFUNDED, {
    userId: session.user.id,
    entityType: "program_enrollment",
    entityId: enrollment.id,
    value: refundedAmount,
    metadata: {
      reason: note,
      override,
      programName: enrollment.program.name,
      cohort: enrollment.cohort.displayName,
      studentEmail: enrollment.email,
      outcomes,
      earningsCancelled,
      unrecoverableInstructorShare,
      alreadyDistributedPeriods: [...alreadyDistributedPeriods],
      enrollmentCancelled,
    },
  });

  if (enrollment.userId) {
    await notify.user(enrollment.userId, {
      type: "payment",
      title: "Refund processed",
      message: `Your refund of ₦${refundedAmount.toLocaleString()} for ${enrollment.program.name} has been processed and is on its way back to the account you paid with.`,
      actionUrl: "/refunds",
      actionLabel: "Refund policy",
      metadata: { category: "refund_processed", amount: refundedAmount },
    });
  }

  return {
    ok: true,
    refundedAmount,
    outcomes,
    enrollmentCancelled,
    earningsCancelled,
    unrecoverableInstructorShare,
    alreadyDistributedPeriods: [...alreadyDistributedPeriods],
    overridden: override && eligible.length < paid.length,
  };
}

/** What refunding this enrollment would do, without doing it. */
export async function previewProgramRefund(enrollmentId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false as const, error: "Forbidden" };
  }

  const enrollment = await db.programEnrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      status: true,
      amountPaid: true,
      totalAmount: true,
      fullName: true,
      cohort: { select: { startDate: true, displayName: true } },
      program: { select: { name: true } },
      installments: {
        orderBy: { installmentNo: "asc" },
        select: {
          id: true,
          installmentNo: true,
          amount: true,
          status: true,
          paidAt: true,
          paystackRef: true,
        },
      },
      tutorEarnings: { select: { status: true, amount: true } },
    },
  });

  if (!enrollment) return { ok: false as const, error: "Enrollment not found" };

  const now = new Date();
  const lines = enrollment.installments
    .filter((i: InstallmentRow) => i.status === "PAID")
    .map((installment: InstallmentRow) => ({
      installmentNo: installment.installmentNo,
      amount: installment.amount,
      paidAt: installment.paidAt,
      hasReference: !!installment.paystackRef,
      assessment: assessRefund({
        paidAt: installment.paidAt ?? now,
        now,
        amountPaid: installment.amount,
        subject: { kind: "PROGRAM", cohortStart: enrollment.cohort.startDate },
        status: "COMPLETED",
      }),
    }));

  return {
    ok: true as const,
    enrollment: {
      id: enrollment.id,
      status: enrollment.status,
      studentName: enrollment.fullName,
      programName: enrollment.program.name,
      cohort: enrollment.cohort.displayName,
      cohortStart: enrollment.cohort.startDate,
      amountPaid: enrollment.amountPaid,
      totalAmount: enrollment.totalAmount,
    },
    lines,
    refundableNow: lines
      .filter((l: PreviewLine) => l.assessment.ok && l.hasReference)
      .reduce((sum: number, l: PreviewLine) => sum + l.amount, 0),
    unrecoverableInstructorShare: enrollment.tutorEarnings
      .filter(
        (e: { status: string }) =>
          e.status === "AVAILABLE" || e.status === "PAID",
      )
      .reduce((sum: number, e: { amount: number }) => sum + e.amount, 0),
  };
}
