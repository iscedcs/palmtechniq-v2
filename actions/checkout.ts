"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { paystackInitialize } from "./paystack";

export async function beginCheckout(courseId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new Error("Unauthorized");
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      currency: true,
      currentPrice: true,
      price: true,
    },
  });
  if (!course) throw new Error("Course not found");

  const amountNaira =
    (course.currentPrice ?? course.price ?? 0) > 0
      ? Number(course.currentPrice ?? course.price)
      : 0;
  if (amountNaira <= 0) throw new Error("Invalid course price");

  const reference = `ps_${randomUUID()}`;
  const amountKobo = Math.round(amountNaira * 100);

  await db.transaction.create({
    data: {
      userId: session.user.id,
      courseId: course.id,
      amount: amountNaira,
      currency: course.currency || "NGN",
      status: "PENDING",
      paymentMethod: "PAYSTACK",
      transactionId: reference,
      description: `Course purchase: ${course.title}`,
      metadata: { courseId: course.id },
    },
  });

  const callbackUrl = `${process.env.NEXT_PUBLIC_URL}/courses/verify-course-payment`;
  const init = await paystackInitialize({
    email: session.user.email,
    amountKobo,
    reference,
    callback_url: callbackUrl,
    metadata: { courseId: course.id, userId: session.user.id },
  });

  redirect(init.authorization_url);
}
