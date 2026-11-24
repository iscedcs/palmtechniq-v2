import { describe, expect, it } from "vitest";

import {
  canCoverPayout,
  computeMoneyPosition,
  computeWithdrawableBalance,
} from "../money-position";

const base = {
  paystackBalance: 500_000,
  tutorAndMentorWallets: 180_000,
  openWithdrawals: 20_000,
  heldEarnings: 100_000,
  vatToRemit: 45_000,
};

describe("computeMoneyPosition", () => {
  it("subtracts everything owed from the Paystack balance", () => {
    const p = computeMoneyPosition(base);
    expect(p.totalOwed).toBe(345_000);
    expect(p.available).toBe(155_000);
    expect(p.shortfall).toBe(false);
  });

  it("reports a shortfall when more is owed than the balance holds", () => {
    const p = computeMoneyPosition({ ...base, paystackBalance: 300_000 });
    expect(p.available).toBe(-45_000);
    expect(p.shortfall).toBe(true);
  });

  it("is not a shortfall when the balance exactly covers what is owed", () => {
    const p = computeMoneyPosition({ ...base, paystackBalance: 345_000 });
    expect(p.available).toBe(0);
    expect(p.shortfall).toBe(false);
  });

  it("still reports what is owed when Paystack could not be reached", () => {
    const p = computeMoneyPosition({ ...base, paystackBalance: null });
    expect(p.totalOwed).toBe(345_000);
    expect(p.available).toBeNull();
    expect(p.shortfall).toBe(false);
  });

  it("does not drift on fractional naira", () => {
    const p = computeMoneyPosition({
      paystackBalance: 100,
      tutorAndMentorWallets: 0.1,
      openWithdrawals: 0.2,
      heldEarnings: 0.3,
      vatToRemit: 0.4,
    });
    expect(p.totalOwed).toBe(1);
    expect(p.available).toBe(99);
  });
});

describe("canCoverPayout", () => {
  it("allows a payout the balance covers", () => {
    expect(canCoverPayout(10_000, 5_000)).toBe(true);
  });

  it("allows a payout equal to the balance", () => {
    expect(canCoverPayout(5_000, 5_000)).toBe(true);
  });

  it("refuses a payout above the balance", () => {
    expect(canCoverPayout(4_999.99, 5_000)).toBe(false);
  });
});

describe("computeWithdrawableBalance", () => {
  it("reserves cashback the tutor has funded but not yet paid out", () => {
    expect(computeWithdrawableBalance(50_000, 9_000)).toBe(41_000);
  });

  it("is the whole balance when nothing is reserved", () => {
    expect(computeWithdrawableBalance(50_000, 0)).toBe(50_000);
  });

  it("never goes negative, so a shortfall cannot read as a credit", () => {
    expect(computeWithdrawableBalance(5_000, 9_000)).toBe(0);
  });

  it("ignores a negative reserve rather than inflating the balance", () => {
    expect(computeWithdrawableBalance(50_000, -9_000)).toBe(50_000);
  });

  it("is exact on amounts that lose precision in float naira", () => {
    // 0.3 - 0.1 is 0.19999999999999998 in binary floating point.
    expect(computeWithdrawableBalance(0.3, 0.1)).toBe(0.2);
  });
});
