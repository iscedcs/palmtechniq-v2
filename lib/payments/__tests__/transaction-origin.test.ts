import { describe, expect, it } from "vitest";

import {
  classifyTransaction,
  countByOrigin,
  summariseTransactions,
} from "../transaction-origin";

const live = {
  transactionId: "ps_b748f985-7490-4baf-b473-c4c71e7d8ea1",
  metadata: { verify: { domain: "live", reference: "ps_b748f985" } },
};

describe("classifyTransaction", () => {
  it("treats a Paystack live payment as live", () => {
    expect(classifyTransaction(live)).toBe("live");
  });

  it("treats a pending row with no metadata as live", () => {
    expect(classifyTransaction({ transactionId: "ps_abc", metadata: null })).toBe("live");
  });

  it("treats a row tagged by the cleanup as legacy", () => {
    expect(
      classifyTransaction({
        transactionId: "course-cybersecurity-1718734144210",
        metadata: { source: "legacy-manual" },
      }),
    ).toBe("legacy");
  });

  it("treats an untagged hand-logged reference as legacy", () => {
    expect(
      classifyTransaction({
        transactionId: "course-web-development-1722855695202",
        metadata: null,
      }),
    ).toBe("legacy");
  });

  it("does not call a Paystack-verified row legacy just because of its reference", () => {
    expect(
      classifyTransaction({
        transactionId: "course-web-development-1722855695202",
        metadata: { verify: { domain: "live" } },
      }),
    ).toBe("live");
  });

  it("treats a payment Paystack verified in test mode as test", () => {
    expect(
      classifyTransaction({
        transactionId: "ps_dac171e0-fede-4cef-bb26-db8d981abcad",
        metadata: { verify: { domain: "test" } },
      }),
    ).toBe("test");
  });
});

describe("summariseTransactions", () => {
  const rows = [
    // Two live payments of N5,000 + 7.5% VAT, split 25/75.
    { ...live, status: "COMPLETED", amount: 5375, vatAmount: 375, tutorShareAmount: 1250, platformShareAmount: 3750 },
    { ...live, status: "COMPLETED", amount: 5375, vatAmount: 375, tutorShareAmount: 2500, platformShareAmount: 2500 },
    { ...live, status: "FAILED", amount: 5214 },
    { ...live, status: "PENDING", amount: 5000 },
    // Legacy and test must never reach the live buckets.
    { transactionId: "course-x-1718734144210", metadata: { source: "legacy-manual" }, status: "COMPLETED", amount: 90_000 },
    { transactionId: "ps_t", metadata: { verify: { domain: "test" } }, status: "COMPLETED", amount: 322_500, vatAmount: 22_500, tutorShareAmount: 150_000, platformShareAmount: 150_000 },
  ];
  const summary = summariseTransactions(rows);

  it("totals live revenue on its own", () => {
    expect(summary.live.COMPLETED).toEqual({
      count: 2,
      gross: 10_750,
      vat: 750,
      tutorShare: 3750,
      platformShare: 6250,
    });
  });

  it("keeps legacy payments out of live revenue", () => {
    expect(summary.legacy.COMPLETED.gross).toBe(90_000);
    expect(summary.live.COMPLETED.gross).toBe(10_750);
  });

  it("keeps test payments out of live revenue", () => {
    expect(summary.test.COMPLETED.gross).toBe(322_500);
    expect(summary.live.COMPLETED.gross).toBe(10_750);
  });

  it("counts failed and pending rows", () => {
    expect(summary.live.FAILED.count).toBe(1);
    expect(summary.live.PENDING.count).toBe(1);
  });

  it("counts every row of an origin", () => {
    expect(countByOrigin(summary, "live")).toBe(4);
    expect(countByOrigin(summary, "legacy")).toBe(1);
    expect(countByOrigin(summary, "test")).toBe(1);
  });

  it("ignores a status it does not report on", () => {
    const s = summariseTransactions([{ ...live, status: "MYSTERY", amount: 100 }]);
    expect(countByOrigin(s, "live")).toBe(0);
  });

  it("does not drift when adding many fractional amounts", () => {
    const many = Array.from({ length: 1000 }, () => ({
      ...live,
      status: "COMPLETED",
      amount: 0.1,
    }));
    expect(summariseTransactions(many).live.COMPLETED.gross).toBe(100);
  });
});
