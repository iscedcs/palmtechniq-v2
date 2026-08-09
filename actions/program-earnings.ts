"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import {
  REVENUE,
  allocateShareAcrossInstallments,
} from "@/lib/payments/revenue";

/**
 * Professional program revenue share.
 *
 * Programs differ from courses in one important way: attribution does not
 * exist at payment time. A cohort is staffed separately from when students
 * pay, so the lead instructor's share is ACCRUED when cash lands and only
 * CREDITED to their wallet when an admin releases it.
 *
 * Accrual therefore runs from two triggers — installment payment and lead
 * instructor assignment — because either can happen first. The unique
 * constraint on TutorEarning.installmentPaymentId is what makes the second
 * trigger a no-op instead of a double credit.
 */

/** Earliest moment an accrual may be released to a wallet. */
function computeAvailableAt(paidAt: Date, cohortStart: Date) {
  const afterRefundWindow = new Date(paidAt);
  afterRefundWindow.setDate(
    afterRefundWindow.getDate() + REVENUE.refundWindowDays,
  );
  // Also wait for the cohort to actually start, so a cohort cancelled for low
  // enrolment never pays out.
  return afterRefundWindow > cohortStart ? afterRefundWindow : cohortStart;
}

/**
 * Accrue the lead instructor's share of one paid installment.
 *
 * Safe to call repeatedly and in any order relative to instructor assignment.
 * Returns a reason string when it deliberately does nothing.
 */
export async function accrueProgramEarning(installmentPaymentId: string) {
  const installment = await db.installmentPayment.findUnique({
    where: { id: installmentPaymentId },
    include: {
      enrollment: {
        include: {
          program: { select: { fullPrice: true } },
          cohort: {
            select: { id: true, startDate: true, leadInstructorId: true },
          },
          installments: {
            select: { id: true, amount: true, installmentNo: true },
            orderBy: { installmentNo: "asc" },
          },
        },
      },
    },
  });

  if (!installment) return { ok: false, reason: "installment_not_found" };
  if (installment.status !== "PAID" || !installment.paidAt) {
    return { ok: false, reason: "not_paid" };
  }

  const { enrollment } = installment;
  const leadInstructorId = enrollment.cohort.leadInstructorId;

  // No instructor yet: assignment will accrue this installment when it happens.
  if (!leadInstructorId) return { ok: false, reason: "no_lead_instructor" };

  const existing = await db.tutorEarning.findUnique({
    where: { installmentPaymentId },
    select: { id: true },
  });
  if (existing) return { ok: true, alreadyAccrued: true };

  // Share is 25% of fullPrice, spread across installments in proportion to
  // cash collected — never accruing against money not yet received.
  const installments = enrollment.installments as {
    id: string;
    amount: number;
    installmentNo: number;
  }[];

  const shares = allocateShareAcrossInstallments({
    fullPrice: enrollment.program.fullPrice,
    installmentAmounts: installments.map((i) => i.amount),
  });
  const index = installments.findIndex((i) => i.id === installmentPaymentId);
  const amount = index >= 0 ? shares[index] : 0;
  if (amount <= 0) return { ok: false, reason: "zero_share" };

  try {
    await db.tutorEarning.create({
      data: {
        tutorId: leadInstructorId,
        source: "PROGRAM",
        amount,
        splitPercent: REVENUE.programSplit.leadInstructor,
        status: "PENDING",
        programEnrollmentId: enrollment.id,
        installmentPaymentId,
        cohortId: enrollment.cohort.id,
        availableAt: computeAvailableAt(
          installment.paidAt,
          enrollment.cohort.startDate,
        ),
      },
    });
  } catch {
    // Unique violation: the other trigger won the race. That is the design.
    return { ok: true, alreadyAccrued: true };
  }

  return { ok: true, amount };
}

/** Accrue every already-paid installment for a cohort. */
export async function accrueCohortEarnings(cohortId: string) {
  const paid = await db.installmentPayment.findMany({
    where: {
      status: "PAID",
      enrollment: { cohortId },
      tutorEarning: null,
    },
    select: { id: true },
  });

  let accrued = 0;
  for (const installment of paid) {
    const result = await accrueProgramEarning(installment.id);
    if (result.ok && !("alreadyAccrued" in result)) accrued += 1;
  }
  return { ok: true, accrued, considered: paid.length };
}

/**
 * Assign (or change) a cohort's lead instructor, then back-fill accruals for
 * installments that were already paid before the cohort was staffed.
 */
export async function setCohortLeadInstructor(
  cohortId: string,
  leadInstructorId: string | null,
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Forbidden" };
  }

  if (leadInstructorId) {
    const instructor = await db.user.findFirst({
      where: { id: leadInstructorId, role: { in: ["TUTOR", "MENTOR"] } },
      select: { id: true },
    });
    if (!instructor) return { ok: false, error: "Instructor not found" };
  }

  // Changing instructor must not silently move money already accrued to
  // someone else. Released earnings are untouchable; pending ones are the
  // admin's call, so surface them rather than reassigning them.
  const pending = await db.tutorEarning.count({
    where: { cohortId, source: "PROGRAM", status: "PENDING" },
  });

  await db.programCohort.update({
    where: { id: cohortId },
    data: { leadInstructorId },
  });

  const result = leadInstructorId
    ? await accrueCohortEarnings(cohortId)
    : { accrued: 0 };

  return {
    ok: true,
    accrued: result.accrued,
    pendingFromPreviousInstructor: pending,
  };
}

/**
 * Release a cohort's accrued earnings to the instructor's wallet.
 *
 * The admin chooses who and when; the amount was fixed at accrual and is not
 * editable here. Status check and wallet credit share one transaction so a
 * double submit cannot pay twice.
 */
export async function releaseProgramEarnings(cohortId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Forbidden" };
  }

  const now = new Date();
  const eligible = await db.tutorEarning.findMany({
    where: {
      cohortId,
      source: "PROGRAM",
      status: "PENDING",
      availableAt: { lte: now },
    },
    select: { id: true, tutorId: true, amount: true },
  });

  if (eligible.length === 0) {
    const blocked = await db.tutorEarning.count({
      where: { cohortId, source: "PROGRAM", status: "PENDING" },
    });
    return {
      ok: true,
      released: 0,
      total: 0,
      notYetEligible: blocked,
    };
  }

  const released = await db.$transaction(async (tx: any) => {
    let total = 0;
    let count = 0;

    for (const earning of eligible) {
      // Re-check status inside the transaction: this is what makes a
      // concurrent release a no-op rather than a second payout.
      const claimed = await tx.tutorEarning.updateMany({
        where: { id: earning.id, status: "PENDING" },
        data: {
          status: "AVAILABLE",
          releasedAt: now,
          releasedById: session.user.id,
        },
      });
      if (claimed.count === 0) continue;

      await tx.user.update({
        where: { id: earning.tutorId },
        data: { walletBalance: { increment: earning.amount } },
      });

      total += earning.amount;
      count += 1;
    }

    return { count, total };
  });

  if (released.count > 0) {
    const tutorId = eligible[0].tutorId;
    await notify.user(tutorId, {
      type: "payment",
      title: "Program Earnings Released",
      message: `₦${released.total.toLocaleString()} from your cohort has been added to your wallet.`,
      actionUrl: "/tutor/wallet",
      actionLabel: "View Wallet",
    });
  }

  return { ok: true, released: released.count, total: released.total };
}

/**
 * Void an accrual when its installment is refunded before release.
 *
 * Only PENDING earnings can be cancelled. Once released the money is in a
 * wallet and reversing it is a clawback, which is deliberately not handled
 * here — see the implementation plan.
 */
export async function cancelProgramEarning(installmentPaymentId: string) {
  const result = await db.tutorEarning.updateMany({
    where: { installmentPaymentId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  if (result.count === 0) {
    const released = await db.tutorEarning.findUnique({
      where: { installmentPaymentId },
      select: { status: true },
    });
    if (released && released.status !== "PENDING") {
      return { ok: false, reason: "already_released", status: released.status };
    }
  }

  return { ok: true, cancelled: result.count };
}

/**
 * Every cohort with its instructor and money position, for the admin screen.
 */
export async function getProgramEarningsOverview() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false as const, error: "Forbidden" };
  }

  const now = new Date();

  const [cohorts, instructors] = await Promise.all([
    db.programCohort.findMany({
      orderBy: [{ year: "desc" }, { cycleNumber: "desc" }],
      select: {
        id: true,
        displayName: true,
        startDate: true,
        seatsTaken: true,
        leadInstructorId: true,
        leadInstructor: { select: { id: true, name: true, email: true } },
        program: { select: { name: true, fullPrice: true } },
        tutorEarnings: {
          where: { source: "PROGRAM" },
          select: {
            amount: true,
            status: true,
            availableAt: true,
            tutorId: true,
          },
        },
      },
    }),
    db.user.findMany({
      where: { role: { in: ["TUTOR", "MENTOR"] }, isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  type Row = {
    amount: number;
    status: string;
    availableAt: Date | null;
    tutorId: string;
  };

  const rows = cohorts.map((cohort: any) => {
    const earnings = (cohort.tutorEarnings ?? []) as Row[];
    const sum = (subset: Row[]) =>
      subset.reduce((total, row) => total + row.amount, 0);
    const pending = earnings.filter((e) => e.status === "PENDING");
    const releasable = pending.filter(
      (e) => e.availableAt !== null && e.availableAt <= now,
    );

    // Accruals belonging to someone other than the current lead instructor —
    // the fingerprint of a mid-cohort handover.
    const fromPreviousInstructor = cohort.leadInstructorId
      ? pending.filter((e) => e.tutorId !== cohort.leadInstructorId)
      : pending;

    return {
      id: cohort.id,
      displayName: cohort.displayName,
      programName: cohort.program?.name ?? "Program",
      startDate: cohort.startDate,
      seatsTaken: cohort.seatsTaken,
      leadInstructor: cohort.leadInstructor,
      accruedTotal: sum(pending),
      releasableNow: sum(releasable),
      releasableCount: releasable.length,
      releasedTotal: sum(
        earnings.filter((e) => e.status === "AVAILABLE" || e.status === "PAID"),
      ),
      heldForPreviousInstructor: sum(fromPreviousInstructor),
      nextReleaseAt:
        pending
          .map((e) => e.availableAt)
          .filter((d): d is Date => d !== null && d > now)
          .sort((a, b) => a.getTime() - b.getTime())[0] ?? null,
    };
  });

  return { ok: true as const, cohorts: rows, instructors };
}

/** Cohort-level accrual/release summary for the admin review screen. */
export async function getCohortEarningsSummary(cohortId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Forbidden" };
  }

  const [cohort, earnings] = await Promise.all([
    db.programCohort.findUnique({
      where: { id: cohortId },
      select: {
        id: true,
        displayName: true,
        startDate: true,
        leadInstructorId: true,
        leadInstructor: { select: { id: true, name: true, email: true } },
        program: { select: { name: true, fullPrice: true } },
      },
    }),
    db.tutorEarning.findMany({
      where: { cohortId, source: "PROGRAM" },
      select: { amount: true, status: true, availableAt: true },
    }),
  ]);

  if (!cohort) return { ok: false, error: "Cohort not found" };

  type EarningRow = {
    amount: number;
    status: string;
    availableAt: Date | null;
  };

  const now = new Date();
  const rows = earnings as EarningRow[];
  const sum = (subset: EarningRow[]) =>
    subset.reduce((total, row) => total + row.amount, 0);

  const pending = rows.filter((e) => e.status === "PENDING");

  return {
    ok: true,
    cohort,
    accruedTotal: sum(pending),
    releasableNow: sum(
      pending.filter((e) => e.availableAt !== null && e.availableAt <= now),
    ),
    releasedTotal: sum(
      rows.filter((e) => e.status === "AVAILABLE" || e.status === "PAID"),
    ),
    cancelledTotal: sum(rows.filter((e) => e.status === "CANCELLED")),
    nextReleaseAt:
      pending
        .map((e) => e.availableAt)
        .filter((d): d is Date => d !== null && d > now)
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null,
  };
}
