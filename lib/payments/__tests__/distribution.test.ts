import { describe, expect, it } from "vitest";

import {
  computeShares,
  isPeriodClosable,
  latestClosablePeriod,
  monthPeriod,
  sumShares,
  validateShareTotal,
  type ShareHolder,
} from "../distribution";

/**
 * The agreed stakeholder set, finalised by management on 9 November 2026, with
 * `priority` in the order payments were asked to leave: the platform's own
 * operating money, the parent company, the founder, the CEO, the product lead,
 * the assistant product lead, then the members.
 *
 * Transcribed here so the agreement itself is covered. If someone changes a
 * percentage in the registry, these tests do not care; if someone changes them
 * so they no longer total 100, the platform refuses to compute a run.
 */
const HOLDERS: ShareHolder[] = [
  { id: "palmtechniq", name: "PalmTechnIQ", sharePercent: 20, priority: 1 },
  { id: "isce", name: "ISCE Digital Concept", sharePercent: 40, priority: 2 },
  { id: "isah", name: "Isah Yinusah Inoremhe", sharePercent: 10, priority: 3 },
  { id: "ayobami", name: "Oyeniran Ayobami Paul", sharePercent: 5, priority: 4 },
  { id: "ignatius", name: "Ignatius Emeka Joshua", sharePercent: 10, priority: 5 },
  { id: "victoria", name: "Enebeli Victoria Ashiolise", sharePercent: 7, priority: 6 },
  { id: "divine", name: "Onyekachukwu Divine Somtochukwu", sharePercent: 2, priority: 7 },
  { id: "emmanuel", name: "Emmanuel Akhabue Oziegbe", sharePercent: 2, priority: 8 },
  { id: "jeff", name: "Jeff Aligwekwe", sharePercent: 2, priority: 9 },
  { id: "micheal", name: "Micheal Agunbiade", sharePercent: 2, priority: 10 },
];

const by = (shares: ReturnType<typeof computeShares>, id: string) =>
  shares.find((s) => s.stakeholderId === id)!.amountKobo;

describe("validateShareTotal", () => {
  it("accepts the agreed set, which totals exactly 100", () => {
    expect(validateShareTotal(HOLDERS)).toEqual({ ok: true });
  });

  it("is not fooled by float addition", () => {
    // 40 + 20 + 10 + 5 + 10 + 7 + 2 + 2 + 2 + 2 summed as floats does not
    // reliably land on exactly 100, which is why the sum is done in basis
    // points. This asserts the real set passes rather than nearly passing.
    const naive = HOLDERS.reduce((s, h) => s + h.sharePercent, 0);
    expect(validateShareTotal(HOLDERS).ok).toBe(true);
    expect(Math.round(naive)).toBe(100);
  });

  it("rejects the superseded figures that totalled 102", () => {
    const old: ShareHolder[] = [
      { id: "a", name: "Platform", sharePercent: 60, priority: 1 },
      { id: "b", name: "Product Lead", sharePercent: 10, priority: 2 },
      { id: "c", name: "Assistant", sharePercent: 7, priority: 3 },
      { id: "d", name: "Four members", sharePercent: 25, priority: 4 },
    ];
    const result = validateShareTotal(old);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.total).toBe(102);
  });

  it("rejects an empty registry rather than paying nobody silently", () => {
    expect(validateShareTotal([]).ok).toBe(false);
  });

  it("rejects a negative share", () => {
    const bad = [
      { id: "a", name: "A", sharePercent: 110, priority: 1 },
      { id: "b", name: "B", sharePercent: -10, priority: 2 },
    ];
    const result = validateShareTotal(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("negative");
  });
});

describe("computeShares", () => {
  it("splits a round million exactly as agreed", () => {
    const shares = computeShares({ baseKobo: 100_000_000, holders: HOLDERS });

    expect(by(shares, "isce")).toBe(40_000_000);
    expect(by(shares, "palmtechniq")).toBe(20_000_000);
    expect(by(shares, "isah")).toBe(10_000_000);
    expect(by(shares, "ignatius")).toBe(10_000_000);
    expect(by(shares, "victoria")).toBe(7_000_000);
    expect(by(shares, "ayobami")).toBe(5_000_000);
    expect(by(shares, "jeff")).toBe(2_000_000);
    expect(sumShares(shares)).toBe(100_000_000);
  });

  it("reconciles to the base exactly, with the odd kobo on the largest holder", () => {
    // One kobo more than divides evenly. It must not vanish, and it must not
    // be conjured: the parts have to sum to the base to the kobo.
    const shares = computeShares({ baseKobo: 100_000_001, holders: HOLDERS });
    expect(sumShares(shares)).toBe(100_000_001);
    expect(by(shares, "isce")).toBe(40_000_001);
  });

  it("reconciles on awkward bases rather than drifting", () => {
    for (const baseKobo of [1, 7, 99, 333_333, 1_000_003, 66_666_667]) {
      const shares = computeShares({ baseKobo, holders: HOLDERS });
      expect(sumShares(shares)).toBe(baseKobo);
    }
  });

  it("returns zeros for an empty month without dividing by zero", () => {
    const shares = computeShares({ baseKobo: 0, holders: HOLDERS });
    expect(shares).toHaveLength(HOLDERS.length);
    expect(sumShares(shares)).toBe(0);
  });

  it("orders the rows by the agreed payment sequence", () => {
    const shares = computeShares({ baseKobo: 100_000_000, holders: HOLDERS });
    expect(shares.map((s) => s.stakeholderId).slice(0, 4)).toEqual([
      "palmtechniq",
      "isce",
      "isah",
      "ayobami",
    ]);
  });

  it("pays the same amounts whatever order the holders arrive in", () => {
    // The point of the design: sequence is presentational, not arithmetic.
    const reversed = [...HOLDERS].reverse();
    const a = computeShares({ baseKobo: 100_000_001, holders: HOLDERS });
    const b = computeShares({ baseKobo: 100_000_001, holders: reversed });
    expect(by(b, "isce")).toBe(by(a, "isce"));
    expect(by(b, "jeff")).toBe(by(a, "jeff"));
    expect(sumShares(b)).toBe(sumShares(a));
  });

  it("snapshots the rate that was applied", () => {
    const shares = computeShares({ baseKobo: 100_000_000, holders: HOLDERS });
    expect(shares.find((s) => s.stakeholderId === "isce")!.sharePercent).toBe(40);
  });
});

describe("periods", () => {
  it("covers a whole calendar month, including its last millisecond", () => {
    const p = monthPeriod(new Date("2026-11-15T09:00:00.000Z"));
    expect(p.label).toBe("November 2026");
    expect(p.start.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-11-30T23:59:59.999Z");
  });

  it("handles a December period rolling into the next year", () => {
    const p = monthPeriod(new Date("2026-12-05T00:00:00.000Z"));
    expect(p.end.toISOString()).toBe("2026-12-31T23:59:59.999Z");
  });

  it("will not close a month the day it ends", () => {
    // The last sale in November can still be refunded until 30 December.
    // Closing on 1 December would distribute money that may be reclaimed.
    const november = monthPeriod(new Date("2026-11-15T00:00:00.000Z"));
    expect(isPeriodClosable(november, new Date("2026-12-01T00:00:00.000Z"))).toBe(
      false,
    );
    expect(isPeriodClosable(november, new Date("2026-12-30T00:00:00.000Z"))).toBe(
      false,
    );
  });

  it("closes a month once the refund window has run on its last sale", () => {
    const november = monthPeriod(new Date("2026-11-15T00:00:00.000Z"));
    expect(isPeriodClosable(november, new Date("2026-12-31T00:00:00.000Z"))).toBe(
      true,
    );
  });

  it("picks November in early January, one month in arrears", () => {
    const period = latestClosablePeriod(new Date("2027-01-05T00:00:00.000Z"));
    expect(period?.label).toBe("November 2026");
  });

  it("picks December once January is far enough along", () => {
    const period = latestClosablePeriod(new Date("2027-02-01T00:00:00.000Z"));
    expect(period?.label).toBe("December 2026");
  });
});
