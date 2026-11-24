/**
 * The published refund policy, as code.
 *
 * This is the one place the rules on /refunds are decided, so the page, the
 * admin action and the tests cannot drift from one another.
 *
 * The deadline is deliberately derived from `computeEarningAvailableAt`, the
 * same function that decides when a tutor's earnings are released. The two are
 * the same instant by construction: the window in which a student may ask for
 * their money back is exactly the window in which the tutor has not yet been
 * paid. If one ever moved without the other, a refund could land after the
 * money had gone, which is the situation the hold exists to prevent.
 *
 * PURE, like revenue.ts: no `db`, no I/O, no session. Every rule here is
 * testable with plain values.
 */

import { computeEarningAvailableAt, roundCurrency } from "@/lib/payments/revenue";

/** What was bought, and the facts that decide whether it can be given back. */
export type RefundSubject =
  /** A course or bundle. Refundable on the window alone. */
  | { kind: "COURSE" }
  /**
   * A cohort programme or bootcamp. Refundable only before teaching starts:
   * the seat was held, the cohort sized around it and the instructor engaged.
   */
  | { kind: "PROGRAM"; cohortStart: Date | null }
  /**
   * Mentorship. A delivered session is a service rendered and is not
   * refundable; undelivered sessions in a package still are.
   */
  | { kind: "MENTORSHIP"; sessionsDelivered: number; sessionsTotal: number };

export type RefundRefusal =
  | "already_refunded"
  | "not_paid"
  | "window_closed"
  | "cohort_started"
  | "sessions_delivered"
  | "nothing_to_refund";

export type RefundAssessment =
  | {
      ok: true;
      /** Naira to return. Less than `amountPaid` only for a part-used package. */
      amount: number;
      /** Last moment a request can be made, for display. */
      deadline: Date;
      /** Set when the amount is less than what was paid, and why. */
      proRated?: string;
    }
  | {
      ok: false;
      reason: RefundRefusal;
      /** Wording suitable for showing an admin. */
      message: string;
      deadline: Date;
    };

/** Last moment a refund may be requested: the close of the refund window. */
export function computeRefundDeadline(paidAt: Date) {
  return computeEarningAvailableAt(paidAt);
}

export function isWithinRefundWindow(paidAt: Date, now: Date) {
  return now.getTime() <= computeRefundDeadline(paidAt).getTime();
}

/**
 * Decide whether a payment can be refunded, and for how much.
 *
 * Says nothing about overrides. An admin may refund outside these rules (we
 * cancelled a cohort, a payment went wrong, goodwill), and that is the
 * action's job to permit, record and justify, not this function's to hide.
 */
export function assessRefund({
  paidAt,
  now,
  amountPaid,
  subject,
  status,
}: {
  paidAt: Date;
  now: Date;
  amountPaid: number;
  subject: RefundSubject;
  /** The payment's own status. Only a completed payment can be given back. */
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
}): RefundAssessment {
  const deadline = computeRefundDeadline(paidAt);

  if (status === "REFUNDED") {
    return {
      ok: false,
      reason: "already_refunded",
      message: "This payment has already been refunded.",
      deadline,
    };
  }

  if (status !== "COMPLETED") {
    return {
      ok: false,
      reason: "not_paid",
      message: `This payment is ${status.toLowerCase()}, so there is nothing to refund. Only a completed payment can be given back.`,
      deadline,
    };
  }

  if (amountPaid <= 0) {
    return {
      ok: false,
      reason: "nothing_to_refund",
      message: "This payment was for ₦0.",
      deadline,
    };
  }

  // The window is checked before the per-type rules, so an out-of-time request
  // is refused for being out of time rather than for a detail of what it was.
  if (!isWithinRefundWindow(paidAt, now)) {
    return {
      ok: false,
      reason: "window_closed",
      message: `The refund window closed on ${deadline.toDateString()}. The tutor has already been paid for this sale, so a refund now has to be recovered from them by hand.`,
      deadline,
    };
  }

  if (subject.kind === "PROGRAM") {
    // No start date means the cohort is not scheduled, so teaching cannot have
    // begun and the seat is still refundable.
    if (subject.cohortStart && subject.cohortStart.getTime() <= now.getTime()) {
      return {
        ok: false,
        reason: "cohort_started",
        message: `This cohort started on ${subject.cohortStart.toDateString()}. Enrollments are not refundable once teaching has begun; refund it only as an override, with a reason.`,
        deadline,
      };
    }
    return { ok: true, amount: roundCurrency(amountPaid), deadline };
  }

  if (subject.kind === "MENTORSHIP") {
    const total = Math.max(1, subject.sessionsTotal);
    const delivered = Math.min(Math.max(0, subject.sessionsDelivered), total);
    const remaining = total - delivered;

    if (remaining === 0) {
      return {
        ok: false,
        reason: "sessions_delivered",
        message:
          total === 1
            ? "This session was delivered. A mentor's time cannot be given back, so it is not refundable."
            : `All ${total} sessions in this package were delivered, so there is nothing left to refund.`,
        deadline,
      };
    }

    // Only the unused sessions come back, charged at the rate actually paid,
    // so a package discount is not quietly converted into a better refund.
    const amount = roundCurrency((amountPaid * remaining) / total);
    return {
      ok: true,
      amount,
      deadline,
      proRated:
        delivered > 0
          ? `${delivered} of ${total} sessions were delivered and are not refundable. Refunding the remaining ${remaining}.`
          : undefined,
    };
  }

  return { ok: true, amount: roundCurrency(amountPaid), deadline };
}
