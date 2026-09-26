"use server";

import { executeJoinGroup } from "@/lib/group-purchase/join";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { paystackInitialize } from "./paystack";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { REFERRAL_COOKIE_NAME, resolveTutorReferralCode } from "@/lib/referral";
import {
  computeCheckoutTotals,
  computeGroupCashback,
  REVENUE,
} from "@/lib/payments/revenue";

const buildInviteCode = () =>
  `GRP-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;

const ensureInviteCode = async () => {
  let code = buildInviteCode();
  for (let i = 0; i < 5; i += 1) {
    const exists = await db.groupPurchase.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    if (!exists) return code;
    code = buildInviteCode();
  }
  return code;
};

export async function beginGroupCheckout(courseId: string, tierId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new Error("Unauthorized");
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      groupBuyingEnabled: true,
      tutor: { select: { userId: true } },
    },
  });

  if (!course || !course.groupBuyingEnabled) {
    throw new Error("Group purchase is not enabled for this course");
  }

  const tier = await db.groupTier.findFirst({
    where: { id: tierId, courseId, isActive: true },
  });

  if (!tier) {
    throw new Error("Group tier not found");
  }
  if (tier.size < 2 || tier.groupPrice <= 0) {
    throw new Error("Invalid group tier configuration");
  }

  const existingGroup = await db.groupPurchase.findFirst({
    where: {
      courseId,
      creatorId: session.user.id,
      status: { in: ["PENDING_PAYMENT", "ACTIVE"] },
    },
    select: { id: true },
  });
  if (existingGroup) {
    throw new Error("You already have an active group for this course");
  }

  const alreadyEnrolled = await db.enrollment.findFirst({
    where: {
      userId: session.user.id,
      courseId,
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    select: { id: true },
  });
  if (alreadyEnrolled) {
    throw new Error("You are already enrolled in this course");
  }

  const inviteCode = await ensureInviteCode();
  const groupPrice = tier.groupPrice;
  const { cashbackTotal, cashbackPerMember } = computeGroupCashback({
    groupPrice,
    cashbackPercent: tier.cashbackPercent,
    size: tier.size,
  });

  // A tutor's referral link earns them the referral share on the group's
  // payment too. Only the creator pays (members join free), so it is the
  // creator's cookie that counts. Read here, where the order is built, so it
  // does not depend on which page started the checkout.
  const referralCode = (await cookies()).get(REFERRAL_COOKIE_NAME)?.value;
  const referralTutorId = referralCode
    ? await resolveTutorReferralCode(referralCode)
    : null;

  const reference = `ps_${randomUUID()}`;
  const totals = computeCheckoutTotals({
    courses: [
      {
        id: course.id,
        tutorId: course.tutor.userId,
        basePrice: groupPrice,
        currentPrice: groupPrice,
        price: groupPrice,
      },
    ],
    promo: null,
    vatRate: REVENUE.vatRate,
    referralTutorId,
  });

  const { groupPurchaseId } = await db.$transaction(async (tx: any) => {
    const groupPurchase = await tx.groupPurchase.create({
      data: {
        courseId,
        tierId: tier.id,
        creatorId: session.user.id,
        inviteCode,
        status: "PENDING_PAYMENT",
        memberCount: 1,
        memberLimit: tier.size,
        groupPrice,
        cashbackTotal,
        cashbackPerMember,
        cashbackEarned: 0,
      },
    });

    await tx.groupMember.create({
      data: {
        groupPurchaseId: groupPurchase.id,
        userId: session.user.id,
        role: "CREATOR",
      },
    });

    await tx.transaction.create({
      data: {
        userId: session.user.id,
        courseId,
        groupPurchaseId: groupPurchase.id,
        amount: totals.totalAmount,
        currency: "NGN",
        status: "PENDING",
        paymentMethod: "PAYSTACK",
        transactionId: reference,
        description: `Group purchase for ${course.title}`,
        subtotalAmount: totals.subtotalAmount,
        discountAmount: totals.discountAmount,
        vatAmount: totals.vatAmount,
        tutorShareAmount: totals.tutorShareAmount,
        platformShareAmount: totals.platformShareAmount,
        referralCode: referralTutorId ? referralCode : undefined,
        isReferralPurchase: !!referralTutorId,
        metadata: {
          groupPurchaseId: groupPurchase.id,
          courseId,
          tierId,
          type: "group_purchase",
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
          })),
        },
      },
    });

    return { groupPurchaseId: groupPurchase.id };
  });

  const callbackUrl = `${process.env.NEXT_PUBLIC_URL}/courses/verify-course-payment`;

  const init = await paystackInitialize({
    email: session.user.email,
    amountKobo: Math.round(totals.totalAmount * 100),
    reference,
    callback_url: callbackUrl,
    metadata: {
      groupPurchaseId,
      courseId,
      tierId,
      userId: session.user.id,
      type: "group_purchase",
    },
  });

  redirect(init.authorization_url);
}

export async function getMyGroupPurchase(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) return { group: null };

  const group = await db.groupPurchase.findFirst({
    where: {
      courseId,
      status: { in: ["PENDING_PAYMENT", "ACTIVE", "COMPLETED"] },
      OR: [
        { creatorId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      tier: true,
      members: {
        select: {
          role: true,
          user: { select: { name: true, avatar: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  return { group };
}

export async function getGroupPurchaseByInvite(inviteCode: string) {
  const group = await db.groupPurchase.findUnique({
    where: { inviteCode },
    include: {
      course: { select: { id: true, title: true, thumbnail: true } },
      tier: true,
      members: {
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  return { group };
}

export async function joinGroupPurchase(inviteCode: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // The logic lives in lib/group-purchase/join.ts so it can be tested without
  // a session, and so the completion race is fixed in exactly one place.
  const result = await executeJoinGroup({
    userId: session.user.id,
    inviteCode,
  });

  return result.ok ? { success: true } : { error: result.error };
}
