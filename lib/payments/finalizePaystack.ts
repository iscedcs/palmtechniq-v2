import { paystackVerify } from "@/actions/paystack";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { getIO } from "@/lib/socket";

export async function finalizePaystackByReference(reference: string) {
  const tx = await db.transaction.findFirst({
    where: { transactionId: reference },
    select: {
      id: true,
      userId: true,
      courseId: true,
      groupPurchaseId: true,
      status: true,
      amount: true,
      metadata: true,
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

    if (groupPurchaseId) {
      await px.groupPurchase.update({
        where: { id: groupPurchaseId },
        data: {
          status: "ACTIVE",
          paidAt: new Date(v.paid_at),
        },
      });
      return;
    }

    const courseIds = Array.isArray(metadata.courseIds)
      ? metadata.courseIds
      : tx.courseId
      ? [tx.courseId]
      : [];

    if (courseIds.length > 0) {
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
