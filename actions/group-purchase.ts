"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { paystackInitialize } from "./paystack";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { computeCheckoutTotals, DEFAULT_VAT_RATE } from "@/lib/payments/pricing";

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
  const cashbackTotal = groupPrice * (tier.cashbackPercent ?? 0);
  const cashbackPerMember =
    tier.size > 1 ? cashbackTotal / (tier.size - 1) : 0;

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
    vatRate: DEFAULT_VAT_RATE,
  });

  const { groupPurchaseId } = await db.$transaction(async (tx) => {
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

  const group = await db.groupPurchase.findUnique({
    where: { inviteCode },
    include: {
      tier: true,
      members: true,
    },
  });

  if (!group) return { error: "Group not found" };
  if (group.status !== "ACTIVE") {
    return { error: "This group is not open for joining yet" };
  }
  if (group.memberCount >= group.memberLimit) {
    return { error: "This group is already full" };
  }

  const alreadyMember = group.members.some(
    (member) => member.userId === session.user.id
  );
  if (alreadyMember) return { success: true };

  const alreadyEnrolled = await db.enrollment.findFirst({
    where: {
      userId: session.user.id,
      courseId: group.courseId,
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    select: { id: true },
  });
  if (alreadyEnrolled) {
    return { error: "You are already enrolled in this course" };
  }

  const { shouldComplete } = await db.$transaction(async (tx) => {
    await tx.groupMember.create({
      data: {
        groupPurchaseId: group.id,
        userId: session.user.id,
        role: "MEMBER",
      },
    });

    const nextMemberCount = group.memberCount + 1;
    const nextCashbackEarned = Math.min(
      group.cashbackTotal,
      group.cashbackPerMember * Math.max(0, nextMemberCount - 1)
    );

    const shouldComplete = nextMemberCount >= group.memberLimit;

    await tx.groupPurchase.update({
      where: { id: group.id },
      data: {
        memberCount: nextMemberCount,
        cashbackEarned: nextCashbackEarned,
        status: shouldComplete ? "COMPLETED" : group.status,
        completedAt: shouldComplete ? new Date() : null,
        cashbackReleased: shouldComplete ? true : group.cashbackReleased,
      },
    });

    if (shouldComplete && group.cashbackTotal > 0) {
      await tx.user.update({
        where: { id: group.creatorId },
        data: {
          walletBalance: {
            increment: group.cashbackTotal,
          },
        },
      });

      const course = await tx.course.findUnique({
        where: { id: group.courseId },
        select: { tutor: { select: { userId: true } } },
      });
      if (course?.tutor?.userId) {
        await tx.user.update({
          where: { id: course.tutor.userId },
          data: {
            walletBalance: {
              decrement: group.cashbackTotal,
            },
          },
        });
      }
    }

    return { shouldComplete };
  });

  if (shouldComplete) {
    const members = await db.groupMember.findMany({
      where: { groupPurchaseId: group.id },
      select: { userId: true },
    });
    const memberIds = members.map((m) => m.userId);

    const enrollmentOps = memberIds.map((userId) =>
      db.enrollment.upsert({
        where: {
          userId_courseId: { userId, courseId: group.courseId },
        },
        update: {},
        create: {
          userId,
          courseId: group.courseId,
          status: "ACTIVE",
          groupPurchaseId: group.id,
          enrolledAt: new Date(),
        },
      })
    );

    const users = await db.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, role: true },
    });
    const userIdsToUpgrade = users
      .filter((user) => user.role === "USER")
      .map((user) => user.id);

    const upgradeOps =
      userIdsToUpgrade.length > 0
        ? [
            db.user.updateMany({
              where: { id: { in: userIdsToUpgrade } },
              data: { role: "STUDENT" },
            }),
            ...userIdsToUpgrade.map((userId) =>
              db.student.upsert({
                where: { userId },
                update: {},
                create: { userId, interests: [], goals: [] },
              })
            ),
          ]
        : [];

    const completionOps = [...enrollmentOps, ...upgradeOps];
    if (completionOps.length > 0) {
      await db.$transaction(completionOps);
    }
  }

  return { success: true };
}
