/**
 * Single source of truth for every revenue-sharing formula on the platform.
 *
 * Rules for this module:
 *
 *  1. PURE. No `db` import, no `"use server"`, no I/O. Client components must
 *     be able to import it for display without pulling in the server bundle,
 *     and every function here must be testable without a database.
 *  2. Call sites never see a raw rate. Import a function, not a number — a
 *     duplicated constant is survivable, duplicated arithmetic is not.
 *  3. Applied rates are snapshots. `TutorEarning.splitPercent` and
 *     `Transaction.tutorShareAmount` record what was actually applied, so
 *     changing a rate here never rewrites earnings already recorded.
 *
 * See docs/implementation/revenue-sharing-implementation-plan.md
 */

// ─────────────────────────────────────────────────────────────────────────────
// Rates
// ─────────────────────────────────────────────────────────────────────────────

export const REVENUE = {
  /** Nigerian VAT, charged on the discounted pre-split price. */
  vatRate: 0.075,

  /**
   * Tutor's share of the discounted, pre-VAT course price.
   *
   * The rate is determined by WHO DROVE THE SALE, not by what was sold.
   * Platform-driven (organic, platform promo) → 25%. Tutor-driven (their
   * referral link or their own promo code) → 50%.
   *
   * There is deliberately no bundle rate. A bundle is a packaging format, not
   * an acquisition channel, so bundle line items inherit these same rates.
   */
  courseSplit: {
    normal: 0.25,
    tutorReferral: 0.5,
    platformPromo: 0.25,
    instructorPromo: 0.5,
  },

  /** Margin guardrails for tutor-priced bundles. */
  bundle: {
    /** Tutor sets the price but the platform absorbs 75% of the discount. */
    maxDiscount: 0.4,
    minPrice: 500,
    minCourses: 2,
  },

  /** Mentorship is a flat split with no VAT. */
  mentorshipSplit: {
    tutor: 0.7,
    platform: 0.3,
  },

  mentorshipPackages: {
    STARTER_3: { sessions: 3, discountPercent: 10, label: "Starter Pack (3)" },
    GROWTH_5: { sessions: 5, discountPercent: 18, label: "Growth Pack (5)" },
  },

  mentorshipDefaults: {
    hourlyRate: 15_000,
    minDurationMinutes: 30,
    maxDurationMinutes: 180,
  },

  /**
   * Professional programs. The lead instructor's share is computed on
   * `fullPrice`, so the installment surcharge stays with the platform as
   * compensation for carrying credit risk.
   */
  programSplit: {
    leadInstructor: 0.25,
    basis: "fullPrice" as const,
  },

  programInstallment: {
    defaultFirstPercent: 0.7,
    /** Floor on a student-chosen first payment, so the balance never exceeds it. */
    minFirstPercent: 0.5,
  },

  referral: {
    cookieDays: 30,
  },

  /** Published money-back guarantee. Gates program earning release. */
  refundWindowDays: 30,
} as const;

export type PackageCode = keyof typeof REVENUE.mentorshipPackages;

/** @deprecated Prefer `REVENUE.courseSplit`. Kept for existing imports. */
export const SPLIT_RATES = REVENUE.courseSplit;
/** @deprecated Prefer `REVENUE.vatRate`. Kept for existing imports. */
export const DEFAULT_VAT_RATE = REVENUE.vatRate;

// ─────────────────────────────────────────────────────────────────────────────
// Shared money helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Money is stored as Float throughout the schema, so every derived amount is
 * rounded to 2dp at each step. This is deliberately the historical behaviour —
 * see the plan's deferred section on migrating to integer minor units.
 */
export const roundCurrency = (value: number) => Math.round(value * 100) / 100;

/**
 * Split `total` across `weights` proportionally, giving the final slice the
 * rounding remainder so the parts always sum back to exactly `total`.
 *
 * Used for VAT allocation across line items, bundle price distribution, and
 * program share allocation across installments — all three must reconcile to
 * the penny, so they share one implementation.
 */
export function allocateProportionally(
  total: number,
  weights: number[],
  options: {
    /**
     * Which slice absorbs the rounding remainder. Defaults to the last, which
     * is the historical VAT behaviour. Bundle price distribution uses
     * "heaviest" so the remainder lands on the highest-priced course.
     */
    remainderTo?: "last" | "heaviest";
  } = {},
): number[] {
  const sum = weights.reduce((acc, w) => acc + w, 0);
  if (sum <= 0 || weights.length === 0) return weights.map(() => 0);

  const remainderIndex =
    options.remainderTo === "heaviest"
      ? weights.reduce(
          (best, w, i) => (w > weights[best] ? i : best),
          0,
        )
      : weights.length - 1;

  const shares = weights.map((weight, index) =>
    index === remainderIndex ? 0 : roundCurrency((weight / sum) * total),
  );

  const allocated = roundCurrency(
    shares.reduce((acc, share) => acc + share, 0),
  );
  shares[remainderIndex] = roundCurrency(total - allocated);

  return shares;
}

/**
 * Distribute a fixed bundle price across its courses in proportion to their
 * individual list prices, so every course keeps its own line item, its own VAT
 * record and its own TutorEarning.
 *
 * The remainder goes to the highest-priced course, and the parts sum exactly
 * to `bundlePrice` — a transaction that doesn't reconcile is not shippable.
 */
export function allocateBundlePrices({
  coursePrices,
  bundlePrice,
}: {
  coursePrices: number[];
  bundlePrice: number;
}) {
  return allocateProportionally(bundlePrice, coursePrices, {
    remainderTo: "heaviest",
  });
}

/**
 * Lowest price a bundle may be listed at: the tutor may discount the summed
 * list price by at most `REVENUE.bundle.maxDiscount`, never below the absolute
 * floor. Re-checked on create, update and at checkout, because an individual
 * course price can move after approval.
 */
export function computeBundlePriceFloor(coursePrices: number[]) {
  const listSum = coursePrices.reduce((sum, price) => sum + price, 0);
  return {
    listSum,
    priceFloor: Math.max(
      roundCurrency(listSum * (1 - REVENUE.bundle.maxDiscount)),
      REVENUE.bundle.minPrice,
    ),
  };
}

export function validateBundlePrice({
  coursePrices,
  bundlePrice,
}: {
  coursePrices: number[];
  bundlePrice: number;
}):
  | { ok: true; listSum: number; priceFloor: number; discountPercent: number }
  | {
      ok: false;
      reason: "too_few_courses" | "below_floor" | "below_minimum" | "not_positive";
      listSum: number;
      priceFloor: number;
    } {
  const { listSum, priceFloor } = computeBundlePriceFloor(coursePrices);

  if (coursePrices.length < REVENUE.bundle.minCourses)
    return { ok: false, reason: "too_few_courses", listSum, priceFloor };
  if (bundlePrice <= 0)
    return { ok: false, reason: "not_positive", listSum, priceFloor };
  if (bundlePrice < REVENUE.bundle.minPrice)
    return { ok: false, reason: "below_minimum", listSum, priceFloor };
  if (bundlePrice < priceFloor)
    return { ok: false, reason: "below_floor", listSum, priceFloor };

  return {
    ok: true,
    listSum,
    priceFloor,
    discountPercent: listSum > 0 ? (1 - bundlePrice / listSum) * 100 : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Course checkout
// ─────────────────────────────────────────────────────────────────────────────

export type PricingCourse = {
  id: string;
  tutorId: string;
  basePrice: number | null;
  currentPrice: number | null;
  price: number | null;
};

export type PromoDetails = {
  id: string;
  code: string;
  promoType: "PLATFORM" | "INSTRUCTOR";
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  isGlobal: boolean;
  courseId?: string | null;
  creatorId?: string | null;
};

export type LineItem = {
  courseId: string;
  tutorId: string;
  basePrice: number;
  discountedPrice: number;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  tutorShareAmount: number;
  platformShareAmount: number;
  isReferralPurchase: boolean;
  promoCodeId?: string | null;
  promoType?: PromoDetails["promoType"];
  promoDiscountType?: PromoDetails["discountType"];
  promoDiscountValue?: number | null;
};

export const promoAppliesToCourse = (
  promo: PromoDetails | null,
  course: PricingCourse,
) => {
  if (!promo) return false;
  if (promo.courseId && promo.courseId !== course.id) return false;
  if (promo.promoType === "INSTRUCTOR" && promo.creatorId) {
    return promo.creatorId === course.tutorId;
  }
  if (promo.isGlobal) return true;
  return !promo.courseId;
};

/** The tutor's share of one course's discounted price. */
export function getSplitPercent(
  promo: PromoDetails | null,
  applies: boolean,
  isReferral: boolean,
) {
  if (promo && applies) {
    if (promo.promoType === "INSTRUCTOR")
      return REVENUE.courseSplit.instructorPromo;
    if (isReferral) return REVENUE.courseSplit.tutorReferral;
    return REVENUE.courseSplit.platformPromo;
  }
  if (isReferral) return REVENUE.courseSplit.tutorReferral;
  return REVENUE.courseSplit.normal;
}

/**
 * Bundles do not pass through a special path here. `beginBundleCheckout`
 * allocates the bundle price across courses (see `allocateBundlePrices`) and
 * hands them in as ordinary courses with overridden prices — the existing
 * attribution logic then produces the correct rate with no bundle branch.
 */
export function computeCheckoutTotals({
  courses,
  promo,
  vatRate = REVENUE.vatRate,
  referralTutorId,
}: {
  courses: PricingCourse[];
  promo: PromoDetails | null;
  vatRate?: number;
  referralTutorId?: string | null;
}) {
  const resolved = courses.map((course) => {
    const basePrice =
      course.basePrice ??
      (course.currentPrice && course.currentPrice > 0
        ? course.currentPrice
        : null) ??
      course.price ??
      0;
    // Only use currentPrice if it's explicitly set (> 0), otherwise fall back to basePrice
    const currentPrice =
      course.currentPrice && course.currentPrice > 0
        ? course.currentPrice
        : (course.price ?? basePrice);

    return { course, basePrice, currentPrice };
  });

  const preliminary = resolved.map(({ course, basePrice, currentPrice }) => {
    const promoApplies = promoAppliesToCourse(promo, course);

    let promoDiscount = 0;
    if (promo && promoApplies) {
      if (promo.discountType === "PERCENTAGE") {
        promoDiscount = roundCurrency(
          (currentPrice * promo.discountValue) / 100,
        );
      } else {
        promoDiscount = roundCurrency(
          Math.min(promo.discountValue, currentPrice),
        );
      }
    }
    const discountedPrice = Math.max(
      0,
      roundCurrency(currentPrice - promoDiscount),
    );

    const discountAmount = Math.max(
      0,
      roundCurrency(basePrice - discountedPrice),
    );
    const isReferral = !!referralTutorId && referralTutorId === course.tutorId;
    const splitPercent = getSplitPercent(promo, promoApplies, isReferral);
    const tutorShareAmount = roundCurrency(discountedPrice * splitPercent);
    const platformShareAmount = roundCurrency(
      discountedPrice - tutorShareAmount,
    );

    return {
      courseId: course.id,
      tutorId: course.tutorId,
      basePrice: roundCurrency(basePrice),
      discountedPrice,
      discountAmount,
      promoApplies,
      isReferral,
      splitPercent,
      tutorShareAmount,
      platformShareAmount,
    };
  });

  const subtotalAmount = roundCurrency(
    preliminary.reduce((sum, item) => sum + item.discountedPrice, 0),
  );
  const vatAmount = roundCurrency(subtotalAmount * vatRate);

  const vatShares = allocateProportionally(
    vatAmount,
    preliminary.map((item) => item.discountedPrice),
  );

  const lineItems: LineItem[] = preliminary.map((item, index) => {
    const vatShare = vatShares[index];
    return {
      courseId: item.courseId,
      tutorId: item.tutorId,
      basePrice: item.basePrice,
      discountedPrice: item.discountedPrice,
      discountAmount: item.discountAmount,
      vatAmount: vatShare,
      totalAmount: roundCurrency(item.discountedPrice + vatShare),
      tutorShareAmount: item.tutorShareAmount,
      platformShareAmount: item.platformShareAmount,
      isReferralPurchase: item.isReferral,
      promoCodeId: promo?.id ?? null,
      promoType: item.promoApplies ? promo?.promoType : undefined,
      promoDiscountType: item.promoApplies ? promo?.discountType : undefined,
      promoDiscountValue: item.promoApplies
        ? (promo?.discountValue ?? null)
        : null,
    };
  });

  return {
    lineItems,
    subtotalAmount,
    discountAmount: roundCurrency(
      lineItems.reduce((sum, item) => sum + item.discountAmount, 0),
    ),
    vatAmount,
    tutorShareAmount: roundCurrency(
      lineItems.reduce((sum, item) => sum + item.tutorShareAmount, 0),
    ),
    platformShareAmount: roundCurrency(
      lineItems.reduce((sum, item) => sum + item.platformShareAmount, 0),
    ),
    totalAmount: roundCurrency(subtotalAmount + vatAmount),
  };
}

/**
 * Recover the applied split from a computed line item.
 *
 * Settlement uses this instead of re-deriving the rate from the scenario, so
 * the recorded `splitPercent` can never disagree with the money that moved.
 */
export function deriveSplitPercent(item: {
  discountedPrice: number;
  tutorShareAmount: number;
}) {
  if (item.discountedPrice <= 0) return 0;
  return item.tutorShareAmount / item.discountedPrice;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mentorship
// ─────────────────────────────────────────────────────────────────────────────

export function computeMentorshipPrice({
  hourlyRate,
  durationMinutes,
  packageCode,
}: {
  hourlyRate?: number | null;
  durationMinutes: number;
  packageCode?: PackageCode | "NONE" | null;
}) {
  const rate = hourlyRate || REVENUE.mentorshipDefaults.hourlyRate;
  const duration = Math.max(
    REVENUE.mentorshipDefaults.minDurationMinutes,
    Math.min(
      REVENUE.mentorshipDefaults.maxDurationMinutes,
      durationMinutes || 60,
    ),
  );

  const pkg =
    packageCode && packageCode !== "NONE"
      ? REVENUE.mentorshipPackages[packageCode]
      : null;

  const basePrice = (rate / 60) * duration;
  const sessions = pkg?.sessions ?? 1;
  const discountPercent = pkg?.discountPercent ?? 0;

  return {
    duration,
    sessions,
    discountPercent,
    label: pkg?.label ?? null,
    basePrice,
    totalAmount: Number(
      (basePrice * sessions * (1 - discountPercent / 100)).toFixed(2),
    ),
  };
}

export function computeMentorshipSplit(totalAmount: number) {
  const tutorShareAmount = Number(
    (totalAmount * REVENUE.mentorshipSplit.tutor).toFixed(2),
  );
  return {
    tutorShareAmount,
    platformShareAmount: Number(
      (totalAmount * REVENUE.mentorshipSplit.platform).toFixed(2),
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Professional programs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The default two-payment schedule, and the floor on a student-chosen first
 * payment. The balance must never exceed what has already been paid.
 */
export function computeInstallmentSchedule({
  installTotal,
  defaultFirstInstall,
  customFirstPayment,
}: {
  installTotal: number;
  /** Program's stored `firstInstall`, used when the student doesn't choose. */
  defaultFirstInstall?: number | null;
  customFirstPayment?: number;
}):
  | { ok: true; firstPayment: number; secondPayment: number; minFirst: number }
  | { ok: false; reason: "below_minimum" | "above_total"; minFirst: number } {
  const minFirst = Math.ceil(installTotal * REVENUE.programInstallment.minFirstPercent);

  if (customFirstPayment !== undefined) {
    if (customFirstPayment < minFirst)
      return { ok: false, reason: "below_minimum", minFirst };
    // Strictly less than the total: a "first installment" equal to the whole
    // amount is a full payment, not a schedule.
    if (customFirstPayment >= installTotal)
      return { ok: false, reason: "above_total", minFirst };
    return {
      ok: true,
      firstPayment: customFirstPayment,
      secondPayment: roundCurrency(installTotal - customFirstPayment),
      minFirst,
    };
  }

  const firstPayment =
    defaultFirstInstall ??
    roundCurrency(installTotal * REVENUE.programInstallment.defaultFirstPercent);

  return {
    ok: true,
    firstPayment,
    secondPayment: roundCurrency(installTotal - firstPayment),
    minFirst,
  };
}

/** Lead instructor's total share for a program enrollment. */
export function computeProgramTutorShare(fullPrice: number) {
  return roundCurrency(fullPrice * REVENUE.programSplit.leadInstructor);
}

/**
 * Spread the lead instructor's share across installments in proportion to cash
 * actually collected, so nothing is accrued against money not yet received.
 *
 * Using the enrollment's `totalAmount` as the denominator makes one expression
 * serve both the full-payment and installment plans, and survives a custom
 * first payment.
 */
export function allocateShareAcrossInstallments({
  fullPrice,
  installmentAmounts,
}: {
  fullPrice: number;
  installmentAmounts: number[];
}) {
  return allocateProportionally(
    computeProgramTutorShare(fullPrice),
    installmentAmounts,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Group buying
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cashback is funded by the tutor, released to the group creator once the
 * group fills. `cashbackPercent` is stored per-tier as a FRACTION (0.1 = 10%),
 * not a percentage — it is multiplied directly, never divided by 100.
 */
export function computeGroupCashback({
  groupPrice,
  cashbackPercent,
  size,
}: {
  groupPrice: number;
  cashbackPercent?: number | null;
  size: number;
}) {
  const cashbackTotal = groupPrice * (cashbackPercent ?? 0);
  return {
    cashbackTotal,
    cashbackPerMember: size > 1 ? cashbackTotal / (size - 1) : 0,
  };
}

export function computeGroupCashbackEarned({
  cashbackTotal,
  cashbackPerMember,
  memberCount,
}: {
  cashbackTotal: number;
  cashbackPerMember: number;
  memberCount: number;
}) {
  return Math.min(cashbackTotal, cashbackPerMember * Math.max(0, memberCount - 1));
}
