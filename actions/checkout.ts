"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { paystackInitialize } from "./paystack";

export async function beginCheckout(courseIds: string[] | string) {
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
    },
  });

  if (!courses.length) throw new Error("Courses not found");

  const totalAmount = courses.reduce((sum, course) => {
    const amount = course.currentPrice ?? course.price ?? 0;
    return sum + amount;
  }, 0);

  if (totalAmount <= 0) throw new Error("Invalid course prices");

  const reference = `ps_${randomUUID()}`;
  const amountKobo = Math.round(totalAmount * 100);
  const description =
    courses.length === 1
      ? `Course purchase: ${courses[0].title}`
      : `Purchase of ${courses.length} courses`;

  const primaryCourseId = courses[0].id;

  await db.transaction.create({
    data: {
      userId: session.user.id,
      courseId: primaryCourseId,
      amount: totalAmount,
      currency: "NGN",
      status: "PENDING",
      paymentMethod: "PAYSTACK",
      transactionId: reference,
      description,
      metadata: {
        courseIds: ids,
        primaryCourseId,
        count: courses.length,
      },
    },
  });

  const callbackUrl = `${process.env.NEXT_PUBLIC_URL}/courses/verify-course-payment`;

  const init = await paystackInitialize({
    email: session.user.email,
    amountKobo,
    reference,
    callback_url: callbackUrl,
    metadata: { courseIds: ids, primaryCourseId, userId: session.user.id },
  });

  redirect(init.authorization_url);
}
