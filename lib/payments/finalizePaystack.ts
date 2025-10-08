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
      status: true,
      amount: true,
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

    if (tx.courseId) {
      await px.enrollment.upsert({
        where: {
          userId_courseId: { userId: tx.userId, courseId: tx.courseId },
        },
        create: { userId: tx.userId, courseId: tx.courseId, status: "ACTIVE" },
        update: {},
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

  await notify.user(tx.userId, {
    type: "success",
    title: "Payment Successful",
    message: "Your enrollment is confirmed. Welcome aboard!",
    actionUrl: "/student",
    actionLabel: "Go to Dashboard",
    metadata: { courseId: tx.courseId, reference },
  });

  return { ok: true, courseId: tx.courseId };
}
