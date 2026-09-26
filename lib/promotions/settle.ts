import "server-only";

import { db } from "@/lib/db";
import {
  buildPromotionReceipt,
  sendReceipt,
  type PaystackVerification,
} from "@/lib/receipts";
import { PromotionStatus, type PrismaClient } from "@prisma/client";

const prisma = db as PrismaClient;

/**
 * Mark a promotion's fee as paid and send the tutor their receipt.
 *
 * Moved out of verifyPromotionPayment so it can be tested without a login, and so
 * the claim below has one home.
 *
 * The old code checked `promotion.feePaid`, verified with Paystack, and only then
 * wrote `feePaid: true` — a check-then-act. The tutor's return page is the only
 * caller, but a refresh or a double-loaded effect is enough for two calls to
 * overlap, and both would have carried on. Now the write itself is the claim: it
 * matches only while `feePaid` is still false, so exactly one call settles it and
 * only that call sends the receipt.
 */
export async function settlePromotionFee(input: {
  promotionId: string;
  reference: string;
  verification: PaystackVerification;
}): Promise<{ settled: boolean }> {
  const claim = await prisma.coursePromotion.updateMany({
    where: { id: input.promotionId, feePaid: false },
    data: { feePaid: true, status: PromotionStatus.PENDING },
  });
  if (claim.count === 0) return { settled: false };

  try {
    const promotion = await prisma.coursePromotion.findUnique({
      where: { id: input.promotionId },
      select: {
        headline: true,
        fee: true,
        startDate: true,
        endDate: true,
        course: { select: { title: true } },
        promoter: { select: { email: true, name: true } },
      },
    });

    if (promotion?.promoter?.email) {
      const days = Math.max(
        1,
        Math.round(
          (promotion.endDate.getTime() - promotion.startDate.getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      );

      await sendReceipt(
        buildPromotionReceipt({
          email: promotion.promoter.email,
          name: promotion.promoter.name,
          courseTitle: promotion.course.title,
          headline: promotion.headline,
          fee: promotion.fee,
          durationDays: days,
          reference: input.reference,
          verification: input.verification,
        }),
      );
    }
  } catch (error) {
    // The fee is paid and recorded; a failed receipt must not undo that.
    console.error("[promotions] receipt failed after settling the fee:", error);
  }

  return { settled: true };
}
