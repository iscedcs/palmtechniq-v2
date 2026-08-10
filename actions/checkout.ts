"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { paystackInitialize } from "./paystack";
import {
  computeCheckoutTotals,
  DEFAULT_VAT_RATE,
} from "@/lib/payments/pricing";
import { validatePromoCode } from "@/lib/payments/promo";
import { resolveTutorReferralCode } from "@/lib/referral";
import { trackEvent, PLATFORM_EVENTS } from "@/lib/analytics/track";

export async function beginCheckout(
  courseIds: string[] | string,
  promoCode?: string,
  referralCode?: string,
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new Error("Unauthorized");
  }

  const ids = Array.isArray(courseIds) ? courseIds : [courseIds];

  const courses = await db.course.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      title: true,
      currency: true,
      currentPrice: true,
      price: true,
      basePrice: true,
      tutor: { select: { userId: true } },
    },
  });

  if (!courses.length) throw new Error("Courses not found");

  // Refuse to sell a course the student already owns. Without this a student
  // can pay again for access they already have — money taken, nothing new
  // delivered, and a refund request that is entirely our fault.
  const alreadyOwned = await db.enrollment.findMany({
    where: {
      userId: session.user.id,
      courseId: { in: ids },
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    select: { course: { select: { title: true } } },
  });

  if (alreadyOwned.length > 0) {
    const titles = alreadyOwned
      .map((e: any) => `"${e.course.title}"`)
      .join(", ");
    throw new Error(
      alreadyOwned.length === ids.length
        ? `You are already enrolled in ${titles}.`
        : `You are already enrolled in ${titles}. Remove ${alreadyOwned.length > 1 ? "them" : "it"} from your cart to continue.`,
    );
  }

  const promoResult = promoCode
    ? await validatePromoCode({
        code: promoCode,
        userId: session.user.id,
        courseIds: ids,
      })
    : null;

  if (promoResult && !promoResult.ok) {
    throw new Error("Invalid promo code");
  }

  // Resolve referral code to tutor userId
  const referralTutorId = referralCode
    ? await resolveTutorReferralCode(referralCode)
    : null;

  const totals = computeCheckoutTotals({
    courses: courses.map((course: any) => ({
      id: course.id,
      tutorId: course.tutor.userId,
      basePrice: course.basePrice,
      currentPrice: course.currentPrice,
      price: course.price,
    })),
    promo: promoResult?.ok ? promoResult.promo : null,
    vatRate: DEFAULT_VAT_RATE,
    referralTutorId,
  });

  if (totals.totalAmount <= 0) throw new Error("Invalid course prices");

  const reference = `ps_${randomUUID()}`;
  const amountKobo = Math.round(totals.totalAmount * 100);
  const description =
    courses.length === 1
      ? `Course purchase: ${courses[0].title}`
      : `Purchase of ${courses.length} courses`;

  const primaryCourseId = courses[0].id;

  await db.transaction.create({
    data: {
      userId: session.user.id,
      courseId: primaryCourseId,
      amount: totals.totalAmount,
      currency: "NGN",
      status: "PENDING",
      paymentMethod: "PAYSTACK",
      transactionId: reference,
      description,
      subtotalAmount: totals.subtotalAmount,
      discountAmount: totals.discountAmount,
      vatAmount: totals.vatAmount,
      tutorShareAmount: totals.tutorShareAmount,
      platformShareAmount: totals.platformShareAmount,
      promoCodeId: promoResult?.ok ? promoResult.promo.id : undefined,
      promoType: promoResult?.ok ? promoResult.promo.promoType : undefined,
      promoDiscountType: promoResult?.ok
        ? promoResult.promo.discountType
        : undefined,
      promoDiscountValue: promoResult?.ok
        ? promoResult.promo.discountValue
        : undefined,
      referralCode: referralCode ?? undefined,
      isReferralPurchase: !!referralTutorId,
      metadata: {
        courseIds: ids,
        primaryCourseId,
        count: courses.length,
        promoCode: promoResult?.ok ? promoResult.promo.code : undefined,
      },
      lineItems: {
        create: totals.lineItems.map((item) => ({
          courseId: item.courseId,
          tutorId: item.tutorId,
          basePrice: item.basePrice,
          discountedPrice: item.discountedPrice,
          discountAmount: item.discountAmount,
          vatAmount: item.vatAmount,
          totalAmount: item.totalAmount,
          tutorShareAmount: item.tutorShareAmount,
          platformShareAmount: item.platformShareAmount,
          isReferralPurchase: item.isReferralPurchase,
          promoCodeId: item.promoCodeId ?? undefined,
          promoType: item.promoType,
          promoDiscountType: item.promoDiscountType,
          promoDiscountValue: item.promoDiscountValue ?? undefined,
        })),
      },
    },
  });

  const callbackUrl = `${process.env.NEXT_PUBLIC_URL}/courses/verify-course-payment`;

  const init = await paystackInitialize({
    email: session.user.email,
    amountKobo,
    reference,
    callback_url: callbackUrl,
    metadata: {
      courseIds: ids,
      primaryCourseId,
      userId: session.user.id,
      promoCode: promoResult?.ok ? promoResult.promo.code : undefined,
      referralCode: referralCode ?? undefined,
    },
  });

  trackEvent(PLATFORM_EVENTS.CHECKOUT_STARTED, {
    userId: session.user.id,
    entityType: "transaction",
    metadata: { courseIds: ids, courseCount: ids.length, reference, promoCode: promoCode || undefined },
    value: totals.totalAmount,
  });

  redirect(init.authorization_url);
}
