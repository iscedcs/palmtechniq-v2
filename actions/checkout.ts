"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { paystackInitialize } from "./paystack";
import { computeCheckoutTotals, DEFAULT_VAT_RATE } from "@/lib/payments/pricing";
import { validatePromoCode } from "@/lib/payments/promo";

export async function beginCheckout(
  courseIds: string[] | string,
  promoCode?: string
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

  const totals = computeCheckoutTotals({
    courses: courses.map((course) => ({
      id: course.id,
      tutorId: course.tutor.userId,
      basePrice: course.basePrice,
      currentPrice: course.currentPrice,
      price: course.price,
    })),
    promo: promoResult?.ok ? promoResult.promo : null,
    vatRate: DEFAULT_VAT_RATE,
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
      promoDiscountType: promoResult?.ok ? promoResult.promo.discountType : undefined,
      promoDiscountValue: promoResult?.ok ? promoResult.promo.discountValue : undefined,
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
    },
  });

  redirect(init.authorization_url);
}
