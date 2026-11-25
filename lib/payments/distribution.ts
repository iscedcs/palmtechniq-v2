/**
 * Splitting the platform's retained revenue between the stakeholders.
 *
 * WHAT THIS IS A SHARE OF. Not the money a student pays. The waterfall is:
 * VAT out (never revenue, it is held for FIRS), the tutor's share out (a cost
 * of sale, fixed by contract, and nothing may be deducted ahead of it), and
 * what remains is the platform's. These percentages apply to that remainder.
 *
 * WHY THE ORDER OF PAYMENT IS NOT MODELLED AS ARITHMETIC. The agreed order is
 * ISCE, then the founder, then the CEO, then the product leads, then everyone
 * else. Because the rates are fixed and sum to 100% of one base, whoever is
 * paid first receives the same naira either way, so `priority` sequences the
 * transfers and nothing more. The alternative reading, each share taken from
 * what the previous one left, is arithmetically broken: on a ₦1,000,000 pot the
 * founder's 10% would be ₦48,000 rather than ₦100,000, and the pot would never
 * empty.
 *
 * PURE, like revenue.ts: no `db`, no I/O, no session.
 */

import {
  REVENUE,
  allocateProportionally,
  fromKobo,
  toKobo,
} from "@/lib/payments/revenue";

/** A stakeholder as this module needs them. */
export type ShareHolder = {
  id: string;
  name: string;
  /** Percentage, as a number: 40 means 40%. */
  sharePercent: number;
  priority: number;
};

export type ComputedShare = {
  stakeholderId: string;
  sharePercent: number;
  amountKobo: number;
  priority: number;
};

/**
 * The percentages must total exactly 100.
 *
 * Checked rather than normalised. A set totalling 102, which is what the
 * first draft of these figures came to, is a mistake in the agreement and not
 * something to silently scale: scaling it would pay everyone a slightly wrong
 * amount and hide the error for as long as nobody added it up.
 */
export function validateShareTotal(holders: ShareHolder[]):
  | { ok: true }
  | { ok: false; total: number; message: string } {
  if (holders.length === 0) {
    return {
      ok: false,
      total: 0,
      message: "No active stakeholders are configured, so there is nobody to pay.",
    };
  }

  const negative = holders.filter((h) => h.sharePercent < 0);
  if (negative.length > 0) {
    return {
      ok: false,
      total: 0,
      message: `A share cannot be negative: ${negative.map((h) => h.name).join(", ")}.`,
    };
  }

  // Summed in basis points, because 40 + 20 + 10 + 10 + 7 + 5 + 2 + 2 + 2 + 2
  // in binary floating point does not reliably equal 100.
  const totalBps = holders.reduce(
    (sum, h) => sum + Math.round(h.sharePercent * 100),
    0,
  );

  if (totalBps !== 10_000) {
    const total = totalBps / 100;
    return {
      ok: false,
      total,
      message: `The active stakeholder shares total ${total}%, not 100%. Fix the registry before computing a run.`,
    };
  }

  return { ok: true };
}

/**
 * Split `baseKobo` across the holders.
 *
 * Reuses `allocateProportionally` rather than carrying its own arithmetic, so
 * there is one implementation of "divide exactly and give the remainder away".
 * The remainder lands on the largest holder, and the parts sum to `baseKobo`
 * exactly: a run that does not reconcile is not shippable.
 */
export function computeShares({
  baseKobo,
  holders,
}: {
  baseKobo: number;
  holders: ShareHolder[];
}): ComputedShare[] {
  const ordered = [...holders].sort(
    (a, b) => a.priority - b.priority || a.id.localeCompare(b.id),
  );

  if (baseKobo <= 0) {
    return ordered.map((h) => ({
      stakeholderId: h.id,
      sharePercent: h.sharePercent,
      amountKobo: 0,
      priority: h.priority,
    }));
  }

  const amounts = allocateProportionally(
    fromKobo(baseKobo),
    ordered.map((h) => h.sharePercent),
    { remainderTo: "heaviest" },
  );

  return ordered.map((h, index) => ({
    stakeholderId: h.id,
    sharePercent: h.sharePercent,
    amountKobo: toKobo(amounts[index]),
    priority: h.priority,
  }));
}

/** Sum of computed shares, for asserting it reconciles to the base. */
export const sumShares = (shares: ComputedShare[]) =>
  shares.reduce((sum, s) => sum + s.amountKobo, 0);

// ─────────────────────────────────────────────────────────────────────────────
// Periods
// ─────────────────────────────────────────────────────────────────────────────

export type Period = { start: Date; end: Date; label: string };

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** The calendar month containing `date`, in UTC. */
export function monthPeriod(date: Date): Period {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
    // Last millisecond of the month, so a payment at 23:59 on the 30th is in.
    end: new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0) - 1),
    label: `${MONTHS[month]} ${year}`,
  };
}

/**
 * Whether a period can be closed yet.
 *
 * A month is closable only once the refund window has expired on its LAST
 * sale, not its first. Until then a sale inside it can still be reversed, and
 * distributing it would pay out money that has to be given back. November
 * therefore becomes closable on 31 December, not 1 December.
 */
export function isPeriodClosable(period: Period, now: Date) {
  const safeFrom = new Date(period.end);
  safeFrom.setUTCDate(safeFrom.getUTCDate() + REVENUE.refundWindowDays);
  return now.getTime() > safeFrom.getTime();
}

/** The most recent month that is safe to distribute, or null if none is yet. */
export function latestClosablePeriod(now: Date): Period | null {
  // Walk back from the current month. Two steps is enough in practice; the
  // loop guards against a clock or window change making it three.
  for (let back = 0; back < 6; back += 1) {
    const probe = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1),
    );
    const period = monthPeriod(probe);
    if (isPeriodClosable(period, now)) return period;
  }
  return null;
}
