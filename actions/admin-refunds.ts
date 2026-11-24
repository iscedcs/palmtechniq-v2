"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { creditWallet } from "@/lib/payments/wallet";
import { paystackCreateRefund } from "@/actions/paystack";
import { assessRefund, type RefundSubject } from "@/lib/payments/refund";
import { toKobo } from "@/lib/payments/revenue";
import { PLATFORM_EVENTS, trackEvent } from "@/lib/analytics/track";

/**
 * Refunding a payment, from the admin side.
 *
 * Until this existed nothing in the platform ever learned that a refund had
 * happened. Refunds were made by hand in the Paystack dashboard, which moved
 * the money but left every record behind it untouched: the payment still read
 * COMPLETED, the student kept access, the VAT stayed on the books as owed, and
 * the tutor's held earning went on to release itself on day 30 as though the
 * sale had stood. Holding earnings for the refund window only protects the
 * money if something actually voids the earning inside it. This is that
 * something.
 *
 * ORDER MATTERS. Paystack is called first, and the platform's own records are
 * only rewritten once it has accepted the refund. The alternative, writing our
 * records first, risks a transaction marked REFUNDED and access withdrawn for
 * a student whose money never left our balance, which is the worse of the two
 * failures: it is invisible, and the student is the one who pays for it. This
 * way a Paystack failure leaves everything exactly as it was and the admin can
 * simply try again.
 *
 * WHAT IT DOES NOT DO: claw back an earning that has already been released.
 * Once a tutor's share is in their wallet, taking it out is a different
 * operation with its own consent and dispute questions, and quietly debiting
 * someone's wallet is not something a refund button should do. Such a refund
 * still goes through; the result reports the amount that has to be recovered
 * by hand, and the figure is recorded on the audit event.
 */

/** Only the fields both call sites read off an earning. */
type EarningSlice = { status: string; amount: number };

export type RefundResult =
  | {
      ok: true;
      amount: number;
      /** True when Paystack had already refunded this and we caught up. */
      alreadyRefundedAtPaystack: boolean;
      earningsCancelled: number;
      enrollmentsRevoked: number;
      creditReturned: number;
      vatReversed: number;
      /**
       * Tutor money already paid out, which this cannot reverse. Above zero
       * means someone has to recover it by hand.
       */
      unrecoverableTutorShare: number;
      overridden: boolean;
    }
  | { ok: false; error: string; canOverride?: boolean };

/** Admin-only. `override` refunds outside the published policy, with a reason. */
export async function refundTransaction({
  transactionId,
  reason,
  override = false,
}: {
  /** The `Transaction.id`, not the Paystack reference. */
  transactionId: string;
  reason: string;
  override?: boolean;
}): Promise<RefundResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false, error: "Forbidden" };
  }

  // A refund is irreversible and leaves the platform's money, so it is never
  // recorded without a stated reason. An override especially: that reason is
  // the only record of why the published policy was set aside.
  const note = reason?.trim();
  if (!note) {
    return { ok: false, error: "A reason is required to refund a payment." };
  }

  const tx = await db.transaction.findUnique({
    where: { id: transactionId },
    include: {
      lineItems: { select: { courseId: true } },
      vatEntries: true,
      tutorEarnings: {
        select: { id: true, status: true, amount: true },
      },
      mentorshipPackageOrder: {
        select: { sessionsTotal: true, sessionsRemaining: true },
      },
      mentorshipSession: { select: { status: true } },
    },
  });

  if (!tx) return { ok: false, error: "Payment not found" };

  // ── What was bought, so the right rule applies ──
  let subject: RefundSubject;
  if (tx.mentorshipPackageOrder) {
    subject = {
      kind: "MENTORSHIP",
      sessionsTotal: tx.mentorshipPackageOrder.sessionsTotal ?? 1,
      // The model stores what is LEFT, so delivered is the difference.
      sessionsDelivered:
        (tx.mentorshipPackageOrder.sessionsTotal ?? 1) -
        (tx.mentorshipPackageOrder.sessionsRemaining ?? 0),
    };
  } else if (tx.mentorshipSessionId) {
    const delivered = tx.mentorshipSession?.status === "COMPLETED";
    subject = {
      kind: "MENTORSHIP",
      sessionsTotal: 1,
      sessionsDelivered: delivered ? 1 : 0,
    };
  } else {
    subject = { kind: "COURSE" };
  }

  const assessment = assessRefund({
    paidAt: tx.paymentDate,
    now: new Date(),
    amountPaid: tx.amount,
    subject,
    status: tx.status as "COMPLETED",
  });

  if (!assessment.ok && !override) {
    return {
      ok: false,
      error: assessment.message,
      // Already refunded or never paid cannot be forced; the rest are policy
      // calls an admin is allowed to make, with a reason.
      canOverride:
        assessment.reason !== "already_refunded" &&
        assessment.reason !== "not_paid" &&
        assessment.reason !== "nothing_to_refund",
    };
  }

  // An override still cannot refund the same payment twice, or refund a
  // payment that never completed. Those are not policy, they are arithmetic.
  if (tx.status === "REFUNDED") {
    return { ok: false, error: "This payment has already been refunded." };
  }
  if (tx.status !== "COMPLETED") {
    return {
      ok: false,
      error: `This payment is ${String(tx.status).toLowerCase()}, so there is nothing to refund.`,
    };
  }

  const amount = assessment.ok ? assessment.amount : tx.amount;
  if (amount <= 0) return { ok: false, error: "Nothing to refund." };

  // ── Paystack first. Nothing below is written unless this succeeds. ──
  const refund = await paystackCreateRefund({
    reference: tx.transactionId,
    amountKobo: toKobo(amount),
    reason: note,
  });

  if (!refund.ok) {
    return {
      ok: false,
      error: `Paystack did not accept the refund, so nothing was changed: ${refund.error}`,
    };
  }

  // Already released to the tutor: reported, never silently reversed.
  const unrecoverableTutorShare = tx.tutorEarnings
    .filter(
      (e: EarningSlice) => e.status === "AVAILABLE" || e.status === "PAID",
    )
    .reduce((sum: number, e: EarningSlice) => sum + e.amount, 0);

  // Mirrors the abandoned-checkout path: credit spent on this purchase goes
  // back as credit, and `creditRefunded` on the metadata is the guard that
  // stops it being returned twice.
  const metadata = (tx.metadata as Record<string, any>) || {};
  const creditAlreadyReturned = metadata.creditRefunded != null;
  const creditToReturn = creditAlreadyReturned
    ? 0
    : Number(metadata.creditApplied ?? 0);

  const courseIds = [
    ...new Set([
      ...tx.lineItems.map((item: { courseId: string }) => item.courseId),
      ...(tx.courseId ? [tx.courseId] : []),
    ]),
  ];

  const result = await db.$transaction(async (px: any) => {
    // Conditional on COMPLETED, so two admins clicking at once produce one
    // refund: the second finds nothing to claim and stops.
    const claimed = await px.transaction.updateMany({
      where: { id: tx.id, status: "COMPLETED" },
      data: {
        status: "REFUNDED",
        metadata: {
          ...metadata,
          refund: {
            amount,
            reason: note,
            override,
            refundedById: session.user.id,
            refundedAt: new Date().toISOString(),
            alreadyRefundedAtPaystack: refund.alreadyRefunded,
            unrecoverableTutorShare,
          },
          creditRefunded: creditToReturn > 0 ? creditToReturn : undefined,
        },
      },
    });
    if (claimed.count === 0) return null;

    // Only PENDING earnings. An AVAILABLE or PAID one is counted above and
    // left alone: reversing it is a clawback, not a refund.
    const earnings = await px.tutorEarning.updateMany({
      where: { transactionId: tx.id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });

    // Access goes. Every gate in the app admits ACTIVE and COMPLETED only.
    const enrollments =
      courseIds.length > 0
        ? await px.enrollment.updateMany({
            where: {
              userId: tx.userId,
              courseId: { in: courseIds },
              status: { in: ["ACTIVE", "COMPLETED"] },
            },
            data: { status: "DROPPED" },
          })
        : { count: 0 };

    // VAT on a refunded sale was never owed. Only an unremitted entry can be
    // reversed here; once remitted it is a matter for the next return.
    const vat = await px.vatLedger.updateMany({
      where: { transactionId: tx.id, status: "PENDING" },
      data: { status: "REVERSED" },
    });

    if (creditToReturn > 0) {
      await creditWallet(px, {
        userId: tx.userId,
        amount: creditToReturn,
        type: "COURSE_CREDIT_REFUNDED",
        transactionId: tx.id,
        description: "Purchase refunded, credit returned",
      });
    }

    return {
      earningsCancelled: earnings.count,
      enrollmentsRevoked: enrollments.count,
      vatReversed: vat.count > 0 ? (tx.vatEntries?.amount ?? 0) : 0,
    };
  });

  if (!result) {
    return {
      ok: false,
      error:
        "This payment was refunded by someone else a moment ago. Reload to see its current state.",
    };
  }

  // Audit and notice come after the money and the records have committed, and
  // never inside the transaction: a failing notice must not undo a refund.
  await trackEvent(PLATFORM_EVENTS.PAYMENT_REFUNDED, {
    userId: session.user.id,
    entityType: "transaction",
    entityId: tx.id,
    value: amount,
    metadata: {
      reason: note,
      override,
      studentId: tx.userId,
      courseIds,
      earningsCancelled: result.earningsCancelled,
      unrecoverableTutorShare,
      alreadyRefundedAtPaystack: refund.alreadyRefunded,
    },
  });

  await notify.user(tx.userId, {
    type: "payment",
    title: "Refund processed",
    message: `Your refund of ₦${amount.toLocaleString()} has been processed and is on its way back to the account you paid with. How long it takes to appear depends on your bank.`,
    actionUrl: "/refunds",
    actionLabel: "Refund policy",
    metadata: { category: "refund_processed", amount },
  });

  return {
    ok: true,
    amount,
    alreadyRefundedAtPaystack: refund.alreadyRefunded,
    earningsCancelled: result.earningsCancelled,
    enrollmentsRevoked: result.enrollmentsRevoked,
    creditReturned: creditToReturn,
    vatReversed: result.vatReversed,
    unrecoverableTutorShare,
    overridden: override && !assessment.ok,
  };
}

/**
 * What would happen if this payment were refunded, without refunding it.
 *
 * Lets the admin screen show the amount, the deadline and any obstacle before
 * anyone commits to an irreversible action.
 */
export async function previewRefund(transactionId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false as const, error: "Forbidden" };
  }

  const tx = await db.transaction.findUnique({
    where: { id: transactionId },
    select: {
      amount: true,
      status: true,
      paymentDate: true,
      mentorshipSessionId: true,
      mentorshipPackageOrder: {
        select: { sessionsTotal: true, sessionsRemaining: true },
      },
      mentorshipSession: { select: { status: true } },
      tutorEarnings: { select: { status: true, amount: true } },
    },
  });

  if (!tx) return { ok: false as const, error: "Payment not found" };

  let subject: RefundSubject;
  if (tx.mentorshipPackageOrder) {
    subject = {
      kind: "MENTORSHIP",
      sessionsTotal: tx.mentorshipPackageOrder.sessionsTotal ?? 1,
      // The model stores what is LEFT, so delivered is the difference.
      sessionsDelivered:
        (tx.mentorshipPackageOrder.sessionsTotal ?? 1) -
        (tx.mentorshipPackageOrder.sessionsRemaining ?? 0),
    };
  } else if (tx.mentorshipSessionId) {
    subject = {
      kind: "MENTORSHIP",
      sessionsTotal: 1,
      sessionsDelivered: tx.mentorshipSession?.status === "COMPLETED" ? 1 : 0,
    };
  } else {
    subject = { kind: "COURSE" };
  }

  const assessment = assessRefund({
    paidAt: tx.paymentDate,
    now: new Date(),
    amountPaid: tx.amount,
    subject,
    status: tx.status as "COMPLETED",
  });

  return {
    ok: true as const,
    assessment,
    amountPaid: tx.amount,
    unrecoverableTutorShare: tx.tutorEarnings
      .filter(
        (e: EarningSlice) => e.status === "AVAILABLE" || e.status === "PAID",
      )
      .reduce((sum: number, e: EarningSlice) => sum + e.amount, 0),
  };
}
