import { paystackVerify } from "@/actions/paystack";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { getIO } from "@/lib/socket";
import { computeCheckoutTotals, DEFAULT_VAT_RATE } from "@/lib/payments/pricing";

export async function finalizePaystackByReference(reference: string) {
  const tx = await db.transaction.findFirst({
    where: { transactionId: reference },
    include: {
      lineItems: true,
      promoCode: true,
    },
  });
  if (!tx) return { ok: false, reason: "tx_not_found" };

  if (tx.status === "COMPLETED")
    return { ok: true, alreadyDone: true, courseId: tx.courseId };

  const v = await paystackVerify(reference);
  if (v.status !== "success") {
    await db.transaction.update({
      where: { id: tx.id },
      data: { status: "FAILED", metadata: { verify: v } },
    });
    return { ok: false, reason: "failed" };
  }

  if (Math.abs(v.amount - Math.round(tx.amount * 100)) > 0) {
    console.log({ v });
  }

  await db.$transaction(async (px) => {
    await px.transaction.update({
      where: { id: tx.id },
      data: {
        status: "COMPLETED",
        paymentId: v.reference,
        paymentDate: new Date(v.paid_at),
        metadata: { verify: v },
      },
    });

    const metadata = (v.metadata || tx.metadata || {}) as any;
    const groupPurchaseId = metadata.groupPurchaseId ?? tx.groupPurchaseId;

    const isGroupPurchase = Boolean(groupPurchaseId);
    if (isGroupPurchase) {
      await px.groupPurchase.update({
        where: { id: groupPurchaseId },
        data: {
          status: "ACTIVE",
          paidAt: new Date(v.paid_at),
        },
      });
    }

    const courseIds = Array.isArray(metadata.courseIds)
      ? metadata.courseIds
      : tx.courseId
      ? [tx.courseId]
      : [];

    let lineItems = tx.lineItems;
    if (!lineItems || lineItems.length === 0) {
      const courses = await px.course.findMany({
        where: { id: { in: courseIds } },
        select: {
          id: true,
          basePrice: true,
          currentPrice: true,
          price: true,
          tutor: { select: { userId: true } },
        },
      });
      const promo =
        tx.promoCode &&
        tx.promoType &&
        tx.promoDiscountType &&
        tx.promoDiscountValue !== null &&
        tx.promoDiscountValue !== undefined
          ? {
              id: tx.promoCode.id,
              code: tx.promoCode.code,
              promoType: tx.promoType,
              discountType: tx.promoDiscountType,
              discountValue: tx.promoDiscountValue,
              isGlobal: tx.promoCode.isGlobal,
              courseId: tx.promoCode.courseId,
              creatorId: tx.promoCode.creatorId,
            }
          : null;

      const totals = computeCheckoutTotals({
        courses: courses.map((course) => ({
          id: course.id,
          tutorId: course.tutor.userId,
          basePrice: course.basePrice,
          currentPrice: course.currentPrice,
          price: course.price,
        })),
        promo,
        vatRate: DEFAULT_VAT_RATE,
      });

      await px.transaction.update({
        where: { id: tx.id },
        data: {
          subtotalAmount: totals.subtotalAmount,
          discountAmount: totals.discountAmount,
          vatAmount: totals.vatAmount,
          tutorShareAmount: totals.tutorShareAmount,
          platformShareAmount: totals.platformShareAmount,
        },
      });

      lineItems = await Promise.all(
        totals.lineItems.map((item) =>
          px.transactionLineItem.create({
            data: {
              transactionId: tx.id,
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
            },
          })
        )
      );
    }

    if (!isGroupPurchase && courseIds.length > 0) {
      for (const courseId of courseIds) {
        await px.enrollment.upsert({
          where: {
            userId_courseId: { userId: tx.userId, courseId },
          },
          create: {
            userId: tx.userId,
            courseId,
            status: "ACTIVE",
            enrolledAt: new Date(),
          },
          update: {},
        });
      }

      await px.cartItem.deleteMany({
        where: {
          userId: tx.userId,
          courseId: { in: courseIds },
        },
      });
    }

    if (tx.vatAmount && tx.vatAmount > 0) {
      await px.vatLedger.upsert({
        where: { transactionId: tx.id },
        create: {
          transactionId: tx.id,
          amount: tx.vatAmount,
          currency: tx.currency,
        },
        update: {},
      });
    }

    if (tx.promoCodeId) {
      const existingRedemption = await px.promoRedemption.findFirst({
        where: { promoCodeId: tx.promoCodeId, transactionId: tx.id },
        select: { id: true },
      });
      if (!existingRedemption) {
        await px.promoRedemption.create({
          data: {
            promoCodeId: tx.promoCodeId,
            userId: tx.userId,
            transactionId: tx.id,
            courseId: tx.courseId ?? undefined,
          },
        });
      }
    }

    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        await px.tutorEarning.create({
          data: {
            tutorId: item.tutorId,
            transactionId: tx.id,
            transactionLineItemId: item.id,
            courseId: item.courseId,
            amount: item.tutorShareAmount,
            splitPercent:
              item.promoType === "PLATFORM"
                ? 0.2
                : item.promoType === "INSTRUCTOR"
                ? 0.7
                : 0.25,
            status: "AVAILABLE",
          },
        });

        await px.user.update({
          where: { id: item.tutorId },
          data: {
            walletBalance: {
              increment: item.tutorShareAmount,
            },
          },
        });
      }
    }

    if (!isGroupPurchase) {
      const user = await px.user.findUnique({
        where: { id: tx.userId },
        select: { role: true },
      });
      if (user && user.role === "USER") {
        await px.user.update({
          where: { id: tx.userId },
          data: { role: "STUDENT" },
        });
        await px.student.upsert({
          where: { userId: tx.userId },
          update: {},
          create: { userId: tx.userId, interests: [], goals: [] },
        });
      }
    }
  });

  const metadata = (v.metadata || tx.metadata || {}) as any;
  const groupPurchaseId = metadata.groupPurchaseId ?? tx.groupPurchaseId;
  if (groupPurchaseId) {
    const groupPurchase = await db.groupPurchase.findUnique({
      where: { id: groupPurchaseId },
      select: { inviteCode: true },
    });

    await notify.user(tx.userId, {
      type: "success",
      title: "Group Purchase Started",
      message:
        "Your group is live. Share your invite link to unlock access faster.",
      actionUrl: groupPurchase?.inviteCode
        ? `/group/${groupPurchase.inviteCode}`
        : "/student",
      actionLabel: "View Group",
      metadata: { category: "group_purchase_started", courseId: tx.courseId },
    });
    return { ok: true, courseId: tx.courseId, groupPurchaseId };
  }

  try {
    const io = getIO();
    if (io) {
      io.to(`user:${tx.userId}`).emit("auth:refresh");

      const sockets = await io.in(`user:${tx.userId}`).fetchSockets();
      sockets.forEach((s) => {
        s.leave(`role:USER`);
        s.join(`role:STUDENT`);
        if (tx.courseId) s.join(`course:${tx.courseId}`);
      });
    }
  } catch (error) {
    console.warn("socket post-finalize error", error);
  }

  const course = await db.course.findUnique({
    where: { id: tx.courseId! },
    select: {
      title: true,
    },
  });

  await notify.user(tx.userId, {
    type: "success",
    title: "Payment Successful",
    message: "Your enrollment is confirmed. Welcome aboard!",
    actionUrl: "/student",
    actionLabel: "Go to Dashboard",
    metadata: { category: "payment_success", courseId: tx.courseId, reference },
  });

  await notify.role("TUTOR", {
    type: "payment",
    title: "Course Purchase",
    message: `Your course ${course?.title} has been purchased`,
    metadata: { category: "payment_received", courseId: tx.courseId },
  });

  return { ok: true, courseId: tx.courseId };
}
