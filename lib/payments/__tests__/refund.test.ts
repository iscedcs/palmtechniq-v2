import { describe, expect, it } from "vitest";

import { REVENUE, computeEarningAvailableAt } from "../revenue";
import {
  assessRefund,
  computeRefundDeadline,
  isWithinRefundWindow,
} from "../refund";

const PAID = new Date("2026-11-09T12:00:00.000Z");
/** One day inside the window. */
const DAY_20 = new Date("2026-11-29T12:00:00.000Z");
/** One day past it. */
const DAY_31 = new Date("2026-12-10T12:00:00.000Z");

const course = { kind: "COURSE" } as const;

describe("the refund deadline", () => {
  it("is the same instant a tutor's earnings are released", () => {
    // The whole design rests on this. If the refund window outlived the hold,
    // a refund could land after the tutor had already been paid.
    expect(computeRefundDeadline(PAID).getTime()).toBe(
      computeEarningAvailableAt(PAID).getTime(),
    );
  });

  it("is the published number of days after payment", () => {
    const days =
      (computeRefundDeadline(PAID).getTime() - PAID.getTime()) /
      (24 * 60 * 60 * 1000);
    expect(days).toBe(REVENUE.refundWindowDays);
  });

  it("includes the final moment and excludes the one after it", () => {
    const deadline = computeRefundDeadline(PAID);
    expect(isWithinRefundWindow(PAID, deadline)).toBe(true);
    expect(isWithinRefundWindow(PAID, new Date(deadline.getTime() + 1))).toBe(
      false,
    );
  });
});

describe("courses", () => {
  it("refund in full inside the window, with no reason needed", () => {
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_20,
      amountPaid: 90_000,
      subject: course,
      status: "COMPLETED",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.amount).toBe(90_000);
  });

  it("are refused after the window closes", () => {
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_31,
      amountPaid: 90_000,
      subject: course,
      status: "COMPLETED",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("window_closed");
  });
});

describe("payment state", () => {
  it.each([
    ["REFUNDED", "already_refunded"],
    ["PENDING", "not_paid"],
    ["FAILED", "not_paid"],
    ["CANCELLED", "not_paid"],
  ] as const)("refuses a %s payment", (status, reason) => {
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_20,
      amountPaid: 90_000,
      subject: course,
      status,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe(reason);
  });

  it("refuses a zero-value payment", () => {
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_20,
      amountPaid: 0,
      subject: course,
      status: "COMPLETED",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("nothing_to_refund");
  });

  it("refuses an already-refunded payment even after the window", () => {
    // Order matters: this must not come back as "window_closed", which would
    // offer an override on a payment that has already been given back.
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_31,
      amountPaid: 90_000,
      subject: course,
      status: "REFUNDED",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("already_refunded");
  });
});

describe("programs and bootcamps", () => {
  it("refund in full before the cohort starts", () => {
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_20,
      amountPaid: 350_000,
      subject: { kind: "PROGRAM", cohortStart: new Date("2026-12-01") },
      status: "COMPLETED",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.amount).toBe(350_000);
  });

  it("are refused once the cohort has started", () => {
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_20,
      amountPaid: 350_000,
      subject: { kind: "PROGRAM", cohortStart: new Date("2026-11-15") },
      status: "COMPLETED",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("cohort_started");
  });

  it("refund when no cohort date is set, since teaching cannot have begun", () => {
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_20,
      amountPaid: 350_000,
      subject: { kind: "PROGRAM", cohortStart: null },
      status: "COMPLETED",
    });
    expect(r.ok).toBe(true);
  });

  it("are refused after the window even before the cohort starts", () => {
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_31,
      amountPaid: 350_000,
      subject: { kind: "PROGRAM", cohortStart: new Date("2027-03-01") },
      status: "COMPLETED",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("window_closed");
  });
});

describe("mentorship", () => {
  it("refunds a single session that was never delivered", () => {
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_20,
      amountPaid: 15_000,
      subject: { kind: "MENTORSHIP", sessionsTotal: 1, sessionsDelivered: 0 },
      status: "COMPLETED",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.amount).toBe(15_000);
  });

  it("refuses a single session that was delivered", () => {
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_20,
      amountPaid: 15_000,
      subject: { kind: "MENTORSHIP", sessionsTotal: 1, sessionsDelivered: 1 },
      status: "COMPLETED",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("sessions_delivered");
  });

  it("pro-rates a part-used package to the unused sessions", () => {
    // 5 sessions at 18% off: ₦61,500 paid, 2 delivered, so 3 come back.
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_20,
      amountPaid: 61_500,
      subject: { kind: "MENTORSHIP", sessionsTotal: 5, sessionsDelivered: 2 },
      status: "COMPLETED",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.amount).toBe(36_900);
      expect(r.proRated).toContain("2 of 5");
    }
  });

  it("refuses a fully used package", () => {
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_20,
      amountPaid: 61_500,
      subject: { kind: "MENTORSHIP", sessionsTotal: 5, sessionsDelivered: 5 },
      status: "COMPLETED",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("sessions_delivered");
  });

  it("refunds an untouched package in full, with no pro-rata note", () => {
    const r = assessRefund({
      paidAt: PAID,
      now: DAY_20,
      amountPaid: 61_500,
      subject: { kind: "MENTORSHIP", sessionsTotal: 5, sessionsDelivered: 0 },
      status: "COMPLETED",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.amount).toBe(61_500);
      expect(r.proRated).toBeUndefined();
    }
  });

  it("cannot refund more than was paid when the data is inconsistent", () => {
    // A negative delivered count, or one above the total, must never turn into
    // a refund larger than the payment.
    const over = assessRefund({
      paidAt: PAID,
      now: DAY_20,
      amountPaid: 30_000,
      subject: { kind: "MENTORSHIP", sessionsTotal: 2, sessionsDelivered: 9 },
      status: "COMPLETED",
    });
    expect(over.ok).toBe(false);

    const under = assessRefund({
      paidAt: PAID,
      now: DAY_20,
      amountPaid: 30_000,
      subject: { kind: "MENTORSHIP", sessionsTotal: 2, sessionsDelivered: -5 },
      status: "COMPLETED",
    });
    expect(under.ok).toBe(true);
    if (under.ok) expect(under.amount).toBe(30_000);
  });
});
