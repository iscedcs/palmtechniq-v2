import { describe, expect, it } from "vitest";

import {
  REVENUE,
  allocateBundlePrices,
  allocateProportionally,
  allocateShareAcrossInstallments,
  computeBundlePriceFloor,
  computeCheckoutTotals,
  computeGroupCashback,
  computeGroupCashbackEarned,
  computeInstallmentSchedule,
  computeMentorshipPrice,
  computeMentorshipSplit,
  computeProgramTutorShare,
  deriveSplitPercent,

  validateBundlePrice,
  type PromoDetails,
} from "../revenue";

const TUTOR = "tutor-user-1";
const OTHER_TUTOR = "tutor-user-2";

const course = (over: Partial<Parameters<typeof computeCheckoutTotals>[0]["courses"][number]> = {}) => ({
  id: "course-1",
  tutorId: TUTOR,
  basePrice: 10_000,
  currentPrice: 10_000,
  price: 10_000,
  ...over,
});

const promo = (over: Partial<PromoDetails> = {}): PromoDetails => ({
  id: "promo-1",
  code: "SAVE10",
  promoType: "PLATFORM",
  discountType: "PERCENTAGE",
  discountValue: 10,
  isGlobal: true,
  courseId: null,
  creatorId: null,
  ...over,
});

describe("course split matrix", () => {
  const cases = [
    {
      name: "normal — no promo, no referral",
      promo: null,
      referralTutorId: null,
      expectedSplit: 0.25,
    },
    {
      name: "tutorReferral — own referral link",
      promo: null,
      referralTutorId: TUTOR,
      expectedSplit: 0.5,
    },
    {
      name: "platformPromo — PLATFORM code applied",
      promo: promo({ promoType: "PLATFORM" }),
      referralTutorId: null,
      expectedSplit: 0.25,
    },
    {
      name: "instructorPromo — INSTRUCTOR code applied",
      promo: promo({ promoType: "INSTRUCTOR", creatorId: TUTOR }),
      referralTutorId: null,
      expectedSplit: 0.5,
    },
  ] as const;

  for (const c of cases) {
    it(c.name, () => {
      const totals = computeCheckoutTotals({
        courses: [course()],
        promo: c.promo,
        referralTutorId: c.referralTutorId,
      });

      const item = totals.lineItems[0];
      expect(deriveSplitPercent(item)).toBeCloseTo(c.expectedSplit, 10);
      expect(item.tutorShareAmount + item.platformShareAmount).toBeCloseTo(
        item.discountedPrice,
        10,
      );
    });
  }

  it("INSTRUCTOR promo takes precedence over referral", () => {
    const totals = computeCheckoutTotals({
      courses: [course()],
      promo: promo({ promoType: "INSTRUCTOR", creatorId: TUTOR }),
      referralTutorId: TUTOR,
    });
    expect(deriveSplitPercent(totals.lineItems[0])).toBeCloseTo(0.5, 10);
  });

  it("referral only counts for the referring tutor's own course", () => {
    const totals = computeCheckoutTotals({
      courses: [course()],
      promo: null,
      referralTutorId: OTHER_TUTOR,
    });
    expect(totals.lineItems[0].isReferralPurchase).toBe(false);
    expect(deriveSplitPercent(totals.lineItems[0])).toBeCloseTo(0.25, 10);
  });

  it("INSTRUCTOR promo does not apply to another tutor's course", () => {
    const totals = computeCheckoutTotals({
      courses: [course()],
      promo: promo({ promoType: "INSTRUCTOR", creatorId: OTHER_TUTOR }),
      referralTutorId: null,
    });
    // Promo did not apply, so no discount and the normal rate stands.
    expect(totals.lineItems[0].discountedPrice).toBe(10_000);
    expect(deriveSplitPercent(totals.lineItems[0])).toBeCloseTo(0.25, 10);
  });
});

describe("discounts", () => {
  it("applies a percentage discount", () => {
    const totals = computeCheckoutTotals({
      courses: [course()],
      promo: promo({ discountType: "PERCENTAGE", discountValue: 10 }),
    });
    expect(totals.lineItems[0].discountedPrice).toBe(9_000);
    expect(totals.lineItems[0].discountAmount).toBe(1_000);
  });

  it("caps a fixed discount at the course price", () => {
    const totals = computeCheckoutTotals({
      courses: [course()],
      promo: promo({ discountType: "FIXED", discountValue: 25_000 }),
    });
    expect(totals.lineItems[0].discountedPrice).toBe(0);
  });

  it("prefers currentPrice only when it is set above zero", () => {
    const totals = computeCheckoutTotals({
      courses: [course({ currentPrice: 0, price: 8_000, basePrice: null })],
      promo: null,
    });
    expect(totals.lineItems[0].discountedPrice).toBe(8_000);
  });
});

describe("VAT allocation", () => {
  it("charges 7.5% on the subtotal", () => {
    const totals = computeCheckoutTotals({ courses: [course()], promo: null });
    expect(totals.vatAmount).toBe(750);
    expect(totals.totalAmount).toBe(10_750);
  });

  it("allocates VAT across line items so the parts sum to the whole", () => {
    const totals = computeCheckoutTotals({
      courses: [
        course({ id: "a", currentPrice: 3_333, basePrice: 3_333, price: 3_333 }),
        course({ id: "b", currentPrice: 3_333, basePrice: 3_333, price: 3_333 }),
        course({ id: "c", currentPrice: 3_334, basePrice: 3_334, price: 3_334 }),
      ],
      promo: null,
    });

    const summed = totals.lineItems.reduce((s, i) => s + i.vatAmount, 0);
    // The last item absorbs the rounding remainder — this must reconcile exactly.
    expect(summed).toBeCloseTo(totals.vatAmount, 10);
  });

  it("produces no VAT when the subtotal is zero", () => {
    const totals = computeCheckoutTotals({
      courses: [course({ basePrice: 0, currentPrice: 0, price: 0 })],
      promo: null,
    });
    expect(totals.vatAmount).toBe(0);
    expect(totals.lineItems[0].vatAmount).toBe(0);
  });
});

describe("allocateProportionally", () => {
  it("gives the remainder to the last slice", () => {
    const shares = allocateProportionally(100, [1, 1, 1]);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 10);
  });

  it("returns zeros when weights sum to zero", () => {
    expect(allocateProportionally(100, [0, 0])).toEqual([0, 0]);
  });
});

describe("bundle price allocation", () => {
  it("distributes proportionally and reconciles exactly to the bundle price", () => {
    const shares = allocateBundlePrices({
      coursePrices: [10_000, 30_000],
      bundlePrice: 32_000,
    });
    expect(shares).toEqual([8_000, 24_000]);
    expect(shares[0] + shares[1]).toBe(32_000);
  });

  it("puts the rounding remainder on the highest-priced course", () => {
    // Thirds don't divide cleanly: naive rounding gives 3.33 x 3 = 9.99,
    // leaving a kobo that must land somewhere rather than vanish.
    const shares = allocateBundlePrices({
      coursePrices: [2_000, 1_000, 1_000],
      bundlePrice: 10,
    });
    expect(shares).toEqual([5, 2.5, 2.5]);

    const drifting = allocateBundlePrices({
      coursePrices: [1, 1, 1],
      bundlePrice: 10,
    });
    expect(drifting[0]).toBe(3.34); // heaviest absorbs the remainder
    expect(drifting.reduce((a, b) => a + b, 0)).toBe(10);
  });

  it("bundle line items inherit the normal attribution rate", () => {
    const shares = allocateBundlePrices({
      coursePrices: [10_000, 30_000],
      bundlePrice: 32_000,
    });
    const totals = computeCheckoutTotals({
      courses: [
        course({ id: "a", basePrice: 10_000, currentPrice: shares[0], price: shares[0] }),
        course({ id: "b", basePrice: 30_000, currentPrice: shares[1], price: shares[1] }),
      ],
      promo: null,
    });

    expect(totals.subtotalAmount).toBe(32_000);
    for (const item of totals.lineItems) {
      expect(deriveSplitPercent(item)).toBeCloseTo(REVENUE.courseSplit.normal, 10);
    }
  });

  it("bundle line items reach 50/50 on a tutor referral", () => {
    const totals = computeCheckoutTotals({
      courses: [
        course({ id: "a", basePrice: 10_000, currentPrice: 8_000, price: 8_000 }),
        course({ id: "b", basePrice: 30_000, currentPrice: 24_000, price: 24_000 }),
      ],
      promo: null,
      referralTutorId: TUTOR,
    });
    for (const item of totals.lineItems) {
      expect(deriveSplitPercent(item)).toBeCloseTo(0.5, 10);
    }
  });
});

describe("bundle price guardrails", () => {
  const coursePrices = [15_000, 12_000, 9_000]; // listSum 36,000

  it("computes the 40% discount floor", () => {
    const { listSum, priceFloor } = computeBundlePriceFloor(coursePrices);
    expect(listSum).toBe(36_000);
    expect(priceFloor).toBe(21_600);
  });

  it("accepts a price exactly at the floor", () => {
    const r = validateBundlePrice({ coursePrices, bundlePrice: 21_600 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.discountPercent).toBeCloseTo(40, 10);
  });

  it("rejects a price below the floor", () => {
    const r = validateBundlePrice({ coursePrices, bundlePrice: 21_599 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("below_floor");
  });

  it("rejects a bundle with fewer than two courses", () => {
    const r = validateBundlePrice({ coursePrices: [10_000], bundlePrice: 9_000 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("too_few_courses");
  });

  it("enforces the absolute minimum price on very cheap catalogues", () => {
    const { priceFloor } = computeBundlePriceFloor([300, 200]);
    expect(priceFloor).toBe(REVENUE.bundle.minPrice);
  });
});

describe("mentorship", () => {
  it("prices a one-off session from the hourly rate", () => {
    const p = computeMentorshipPrice({ hourlyRate: 15_000, durationMinutes: 60 });
    expect(p.totalAmount).toBe(15_000);
  });

  it("clamps duration to the allowed range", () => {
    expect(computeMentorshipPrice({ hourlyRate: 6_000, durationMinutes: 5 }).duration).toBe(30);
    expect(computeMentorshipPrice({ hourlyRate: 6_000, durationMinutes: 999 }).duration).toBe(180);
  });

  it("applies package discounts", () => {
    const starter = computeMentorshipPrice({
      hourlyRate: 10_000,
      durationMinutes: 60,
      packageCode: "STARTER_3",
    });
    expect(starter.totalAmount).toBe(27_000); // 10k x 3 x 0.9

    const growth = computeMentorshipPrice({
      hourlyRate: 10_000,
      durationMinutes: 60,
      packageCode: "GROWTH_5",
    });
    expect(growth.totalAmount).toBe(41_000); // 10k x 5 x 0.82
  });

  it("splits 70/30", () => {
    const split = computeMentorshipSplit(10_000);
    expect(split.tutorShareAmount).toBe(7_000);
    expect(split.platformShareAmount).toBe(3_000);
  });
});

describe("program installments", () => {
  it("defaults to the program's stored first installment", () => {
    const s = computeInstallmentSchedule({
      installTotal: 320_000,
      defaultFirstInstall: 224_000,
    });
    expect(s.ok).toBe(true);
    if (!s.ok) return;
    expect(s.firstPayment).toBe(224_000);
    expect(s.secondPayment).toBe(96_000);
  });

  it("rejects a custom first payment below the 50% floor", () => {
    const s = computeInstallmentSchedule({
      installTotal: 320_000,
      defaultFirstInstall: 224_000,
      customFirstPayment: 100_000,
    });
    expect(s.ok).toBe(false);
    expect(s.minFirst).toBe(160_000);
  });

  it("accepts a custom first payment exactly at the floor", () => {
    const s = computeInstallmentSchedule({
      installTotal: 320_000,
      defaultFirstInstall: 224_000,
      customFirstPayment: 160_000,
    });
    expect(s.ok).toBe(true);
    if (!s.ok) return;
    expect(s.secondPayment).toBe(160_000);
  });
});

describe("program tutor share", () => {
  it("takes 25% of fullPrice, not installTotal", () => {
    expect(computeProgramTutorShare(300_000)).toBe(75_000);
  });

  it("allocates across installments in proportion to cash collected", () => {
    const shares = allocateShareAcrossInstallments({
      fullPrice: 300_000,
      installmentAmounts: [224_000, 96_000],
    });
    expect(shares).toEqual([52_500, 22_500]);
    expect(shares[0] + shares[1]).toBe(75_000);
  });

  it("handles the full-payment plan as a single installment", () => {
    const shares = allocateShareAcrossInstallments({
      fullPrice: 300_000,
      installmentAmounts: [300_000],
    });
    expect(shares).toEqual([75_000]);
  });
});

describe("group cashback", () => {
  it("treats cashbackPercent as a fraction, not a percentage", () => {
    const c = computeGroupCashback({
      groupPrice: 10_000,
      cashbackPercent: 0.1,
      size: 5,
    });
    expect(c.cashbackTotal).toBe(1_000);
    expect(c.cashbackPerMember).toBe(250); // split across the 4 joiners
  });

  it("caps earned cashback at the total", () => {
    expect(
      computeGroupCashbackEarned({
        cashbackTotal: 1_000,
        cashbackPerMember: 250,
        memberCount: 99,
      }),
    ).toBe(1_000);
  });
});
