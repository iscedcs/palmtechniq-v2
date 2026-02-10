"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { paystackTransfer } from "@/actions/paystack";

export async function requestWithdrawal(amount: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!amount || amount <= 0) {
    return { error: "Invalid amount" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { walletBalance: true, recipientCode: true },
  });

  if (!user) return { error: "User not found" };
  if (!user.recipientCode) return { error: "No payout recipient configured" };
  if (user.walletBalance < amount) return { error: "Insufficient balance" };

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: { walletBalance: { decrement: amount } },
    });

    await tx.withdrawalRequest.create({
      data: {
        userId: session.user.id,
        amount,
        status: "PENDING",
      },
    });
  });

  return { success: true };
}

export async function approveWithdrawalRequest(
  withdrawalRequestId: string,
  adminNote?: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "ADMIN") return { error: "Forbidden" };

  const withdrawal = await db.withdrawalRequest.findUnique({
    where: { id: withdrawalRequestId },
    include: { user: { select: { recipientCode: true } } },
  });

  if (!withdrawal) return { error: "Withdrawal not found" };
  if (withdrawal.status !== "PENDING") {
    return { error: "Withdrawal already processed" };
  }

  const reference = `wd_${randomUUID()}`;

  const transfer = await paystackTransfer({
    amountKobo: Math.round(withdrawal.amount * 100),
    recipientCode: withdrawal.user.recipientCode || "",
    reference,
    reason: "Tutor withdrawal",
  });

  await db.$transaction(async (tx) => {
    await tx.withdrawalRequest.update({
      where: { id: withdrawalRequestId },
      data: {
        status: transfer.status === "success" ? "PAID" : "APPROVED",
        approvedAt: new Date(),
        approvedById: session.user.id,
        paidAt: transfer.status === "success" ? new Date() : null,
        adminNote,
      },
    });

    await tx.payout.create({
      data: {
        withdrawalRequestId,
        amount: withdrawal.amount,
        status:
          transfer.status === "success"
            ? "COMPLETED"
            : transfer.status === "pending"
            ? "PROCESSING"
            : "FAILED",
        transferReference: reference,
        transferCode: transfer.transfer_code,
        recipientCode: withdrawal.user.recipientCode || undefined,
        processedAt: transfer.status === "success" ? new Date() : null,
      },
    });
  });

  return { success: true };
}

export async function rejectWithdrawalRequest(
  withdrawalRequestId: string,
  adminNote?: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "ADMIN") return { error: "Forbidden" };

  const withdrawal = await db.withdrawalRequest.findUnique({
    where: { id: withdrawalRequestId },
    select: { id: true, userId: true, amount: true, status: true },
  });

  if (!withdrawal) return { error: "Withdrawal not found" };
  if (withdrawal.status !== "PENDING") {
    return { error: "Withdrawal already processed" };
  }

  await db.$transaction(async (tx) => {
    await tx.withdrawalRequest.update({
      where: { id: withdrawalRequestId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        approvedById: session.user.id,
        adminNote,
      },
    });

    await tx.user.update({
      where: { id: withdrawal.userId },
      data: { walletBalance: { increment: withdrawal.amount } },
    });
  });

  return { success: true };
}
