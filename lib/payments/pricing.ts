export const DEFAULT_VAT_RATE = 0.075;

export const SPLIT_RATES = {
  normal: 0.25,
  platformPromo: 0.2,
  instructorPromo: 0.7,
};

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

type LineItem = {
  courseId: string;
  tutorId: string;
  basePrice: number;
  discountedPrice: number;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  tutorShareAmount: number;
  platformShareAmount: number;
  promoCodeId?: string | null;
  promoType?: PromoDetails["promoType"];
  promoDiscountType?: PromoDetails["discountType"];
  promoDiscountValue?: number | null;
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const promoAppliesToCourse = (promo: PromoDetails | null, course: PricingCourse) => {
  if (!promo) return false;
  if (promo.courseId && promo.courseId !== course.id) return false;
  if (promo.promoType === "INSTRUCTOR" && promo.creatorId) {
    return promo.creatorId === course.tutorId;
  }
  if (promo.isGlobal) return true;
  return !promo.courseId;
};

const getSplitPercent = (promo: PromoDetails | null, applies: boolean) => {
  if (!promo || !applies) return SPLIT_RATES.normal;
  if (promo.promoType === "PLATFORM") return SPLIT_RATES.platformPromo;
  return SPLIT_RATES.instructorPromo;
};

export function computeCheckoutTotals({
  courses,
  promo,
  vatRate = DEFAULT_VAT_RATE,
}: {
  courses: PricingCourse[];
  promo: PromoDetails | null;
  vatRate?: number;
}) {
  const preliminary = courses.map((course) => {
    const basePrice =
      course.basePrice ??
      course.currentPrice ??
      course.price ??
      0;
    const currentPrice = course.currentPrice ?? course.price ?? basePrice;

    const promoApplies = promoAppliesToCourse(promo, course);
    let promoDiscount = 0;
    if (promo && promoApplies) {
      if (promo.discountType === "PERCENTAGE") {
        promoDiscount = roundCurrency((currentPrice * promo.discountValue) / 100);
      } else {
        promoDiscount = roundCurrency(Math.min(promo.discountValue, currentPrice));
      }
    }

    const discountedPrice = Math.max(0, roundCurrency(currentPrice - promoDiscount));
    const discountAmount = Math.max(0, roundCurrency(basePrice - discountedPrice));
    const splitPercent = getSplitPercent(promo, promoApplies);
    const tutorShareAmount = roundCurrency(discountedPrice * splitPercent);
    const platformShareAmount = roundCurrency(discountedPrice - tutorShareAmount);

    return {
      courseId: course.id,
      tutorId: course.tutorId,
      basePrice: roundCurrency(basePrice),
      discountedPrice,
      discountAmount,
      promoApplies,
      tutorShareAmount,
      platformShareAmount,
    };
  });

  const subtotalAmount = roundCurrency(
    preliminary.reduce((sum, item) => sum + item.discountedPrice, 0)
  );
  const vatAmount = roundCurrency(subtotalAmount * vatRate);

  let allocatedVat = 0;
  const lineItems: LineItem[] = preliminary.map((item, index) => {
    let vatShare = 0;
    if (subtotalAmount > 0) {
      if (index === preliminary.length - 1) {
        vatShare = roundCurrency(vatAmount - allocatedVat);
      } else {
        vatShare = roundCurrency((item.discountedPrice / subtotalAmount) * vatAmount);
        allocatedVat = roundCurrency(allocatedVat + vatShare);
      }
    }
    const totalAmount = roundCurrency(item.discountedPrice + vatShare);
    return {
      courseId: item.courseId,
      tutorId: item.tutorId,
      basePrice: item.basePrice,
      discountedPrice: item.discountedPrice,
      discountAmount: item.discountAmount,
      vatAmount: vatShare,
      totalAmount,
      tutorShareAmount: item.tutorShareAmount,
      platformShareAmount: item.platformShareAmount,
      promoCodeId: promo?.id ?? null,
      promoType: item.promoApplies ? promo?.promoType : undefined,
      promoDiscountType: item.promoApplies ? promo?.discountType : undefined,
      promoDiscountValue: item.promoApplies ? promo?.discountValue ?? null : null,
    };
  });

  const discountAmount = roundCurrency(
    lineItems.reduce((sum, item) => sum + item.discountAmount, 0)
  );
  const tutorShareAmount = roundCurrency(
    lineItems.reduce((sum, item) => sum + item.tutorShareAmount, 0)
  );
  const platformShareAmount = roundCurrency(
    lineItems.reduce((sum, item) => sum + item.platformShareAmount, 0)
  );
  const totalAmount = roundCurrency(subtotalAmount + vatAmount);

  return {
    lineItems,
    subtotalAmount,
    discountAmount,
    vatAmount,
    tutorShareAmount,
    platformShareAmount,
    totalAmount,
  };
}
