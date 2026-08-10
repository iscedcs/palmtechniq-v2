/**
 * Compatibility shim.
 *
 * Every sharing formula now lives in `lib/payments/revenue.ts`. This file
 * re-exports the course-checkout surface so existing imports keep working.
 * New code should import from `@/lib/payments/revenue` directly.
 */

export {
  DEFAULT_VAT_RATE,
  SPLIT_RATES,
  computeCheckoutTotals,
  deriveSplitPercent,
  getSplitPercent,
  promoAppliesToCourse,
  roundCurrency,
} from "@/lib/payments/revenue";

export type {
  LineItem,
  PricingCourse,
  PromoDetails,
} from "@/lib/payments/revenue";
