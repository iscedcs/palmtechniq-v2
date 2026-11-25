"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { creditWallet } from "@/lib/payments/wallet";
import { paystackCreateRefund } from "@/lib/payments/paystack-api";
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

/** Shape both the refund and the preview need in order to classify a payment. */
type ClassifiableTx = {
  mentorshipSessionId: string | null;
  metadata: unknown;
  mentorshipPackageOrder: {
    sessionsTotal: number | null;
    sessionsRemaining: number | null;
  } | null;
  mentorshipSession: { status: string } | null;
};

/**
 * What was bought, so the right refund rule applies.
 *
 * Shared by `refundTransaction` and `previewRefund` deliberately. These were
 * two copies of the same logic, and the copies are what let the bug below sit
 * in both: the preview agreed with the refund, so nothing looked wrong.
 *
 * Mentorship is recognised three ways, in descending order of reliability,
 * because checkout only ever wrote the last one:
 *
 *  1. `Transaction.mentorshipSessionId`, which the checkout now sets.
 *  2. `metadata.mentorshipSessionId`, which is all that exists on every
 *     payment taken before that fix, so it cannot be dropped.
 *  3. `metadata.productType === "MENTORSHIP"`, the last resort: a mentorship
 *     payment whose session cannot be found is still not a course, and
 *     treating it as one is what allowed a delivered session to be refunded in
 *     full with no override.
 *
 * `MentorshipPackageOrder` rows are never created by any current code path, so
 * branch 1 of the package check is effectively dead. It is kept because the
 * model exists and the data would be authoritative if it were ever populated;
 * until then `metadata.packageSessions` is what records how many sessions were
 * bought.
 */
async function classifyRefundSubject(tx: ClassifiableTx): Promise<{
  subject: RefundSubject;
  mentorshipSessionId: string | null;
}> {
  const metadata = (tx.metadata as Record<string, any>) || {};
  const sessionId =
    tx.mentorshipSessionId ??
    (typeof metadata.mentorshipSessionId === "string"
      ? metadata.mentorshipSessionId
      : null);
  const declaredMentorship = metadata.productType === "MENTORSHIP";

  if (!tx.mentorshipPackageOrder && !sessionId && !declaredMentorship) {
    return { subject: { kind: "COURSE" }, mentorshipSessionId: null };
  }

  if (tx.mentorshipPackageOrder) {
    const total = tx.mentorshipPackageOrder.sessionsTotal ?? 1;
    return {
      subject: {
        kind: "MENTORSHIP",
        sessionsTotal: total,
        // The model stores what is LEFT, so delivered is the difference.
        sessionsDelivered:
          total - (tx.mentorshipPackageOrder.sessionsRemaining ?? 0),
      },
      mentorshipSessionId: sessionId,
    };
  }

  // The relation only resolves when the column is set, which it is not on any
  // payment taken before the checkout fix, so the session is fetched by id.
  let status = tx.mentorshipSession?.status ?? null;
  if (status === null && sessionId) {
    const found = await db.mentorshipSession.findUnique({
      where: { id: sessionId },
      select: { status: true },
    });
    status = found?.status ?? null;
  }

  const sessionsTotal = Math.max(1, Number(metadata.packageSessions) || 1);

  return {
    subject: {
      kind: "MENTORSHIP",
      sessionsTotal,
      // One session row covers the whole package today, so a completed row
      // counts as one session delivered out of however many were bought.
      sessionsDelivered: status === "COMPLETED" ? 1 : 0,
    },
    mentorshipSessionId: sessionId,
  };
}

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
  const { subject, mentorshipSessionId } = await classifyRefundSubject(tx);

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

  // Settlement reads this from metadata when the column is unset, so both are
  // checked here for the same reason.
  const groupPurchaseId: string | null =
    tx.groupPurchaseId ??
    (typeof metadata.groupPurchaseId === "string"
      ? metadata.groupPurchaseId
      : null);

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
    //
    // A group purchase is one payment by the creator that enrolls every
    // member, since joining with an invite code costs nothing. Revoking by
    // userId alone therefore took access from the payer and left the rest of
    // the group studying a course nobody had paid for, so a group is revoked
    // by its own id instead.
    const enrollments = groupPurchaseId
      ? await px.enrollment.updateMany({
          where: {
            groupPurchaseId,
            status: { in: ["ACTIVE", "COMPLETED"] },
          },
          data: { status: "DROPPED" },
        })
      : courseIds.length > 0
        ? await px.enrollment.updateMany({
            where: {
              userId: tx.userId,
              courseId: { in: courseIds },
              status: { in: ["ACTIVE", "COMPLETED"] },
            },
            data: { status: "DROPPED" },
          })
        : { count: 0 };

    // The group itself is cancelled, which also stops the cashback. The
    // release sweep only looks at COMPLETED groups, so leaving the status
    // alone meant the creator was still paid cashback funded out of a sale
    // that had been refunded in full.
    if (groupPurchaseId) {
      await px.groupPurchase.updateMany({
        where: { id: groupPurchaseId, status: { not: "CANCELLED" } },
        data: { status: "CANCELLED" },
      });
    }

    // A paid mentorship session stayed SCHEDULED with a live meeting link
    // after its money was returned, so the student kept the booking they had
    // been refunded for. Cancelling it is the mentorship equivalent of
    // dropping an enrollment.
    if (mentorshipSessionId) {
      // The payment is refunded either way, including an override on a
      // session that was delivered.
      await px.mentorshipSession.updateMany({
        where: { id: mentorshipSessionId },
        data: { paymentStatus: "REFUNDED" },
      });

      // The booking itself is only withdrawn if it has not already happened.
      // Rewriting a COMPLETED session to CANCELLED would deny a session that
      // was in fact delivered, which is a record of teaching, not of money.
      await px.mentorshipSession.updateMany({
        where: {
          id: mentorshipSessionId,
          status: { notIn: ["CANCELLED", "COMPLETED"] },
        },
        data: { status: "CANCELLED", meetingUrl: null },
      });
    }

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
      metadata: true,
      mentorshipSessionId: true,
      mentorshipPackageOrder: {
        select: { sessionsTotal: true, sessionsRemaining: true },
      },
      mentorshipSession: { select: { status: true } },
      tutorEarnings: { select: { status: true, amount: true } },
    },
  });

  if (!tx) return { ok: false as const, error: "Payment not found" };

  // Same classifier as the refund itself, so the preview cannot disagree with
  // what the refund will actually do.
  const { subject } = await classifyRefundSubject(tx);

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
