"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import {
  paystackCreateSubaccount,
  paystackCreateTransferRecipient,
  paystackListBanks,
  paystackResolveAccount,
  paystackTransfer,
} from "@/actions/paystack";

type DashboardTransaction = {
  id: string;
  type: "earning" | "withdrawal";
  description: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
};

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth() + 1}`;

const buildRecentMonths = (count: number) => {
  const result: { key: string; label: string }[] = [];
  const current = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
    result.push({
      key: monthKey(d),
      label: d.toLocaleString("en-US", { month: "short" }),
    });
  }
  return result;
};

export async function getWalletSummary() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;

  const [user, totalEarnings, pendingWithdrawals] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    }),
    db.tutorEarning.aggregate({
      where: { tutorId: userId },
      _sum: { amount: true },
    }),
    db.withdrawalRequest.aggregate({
      where: { userId, status: { in: ["PENDING", "APPROVED"] } },
      _sum: { amount: true },
    }),
  ]);

  return {
    success: true,
    summary: {
      availableBalance: user?.walletBalance ?? 0,
      totalEarnings: totalEarnings._sum.amount ?? 0,
      pendingPayouts: pendingWithdrawals._sum.amount ?? 0,
    },
  };
}

export async function getWalletDashboardData() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;

  const [
    user,
    totalEarnings,
    pendingWithdrawals,
    earnings,
    withdrawals,
    paymentMethods,
  ] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          avatar: true,
          role: true,
          walletBalance: true,
          recipientCode: true,
          bankName: true,
          accountNumber: true,
        },
      }),
      db.tutorEarning.aggregate({
        where: { tutorId: userId },
        _sum: { amount: true },
      }),
      db.withdrawalRequest.aggregate({
        where: { userId, status: { in: ["PENDING", "APPROVED"] } },
        _sum: { amount: true },
      }),
      db.tutorEarning.findMany({
        where: { tutorId: userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { course: { select: { title: true } } },
      }),
      db.withdrawalRequest.findMany({
        where: { userId },
        orderBy: { requestedAt: "desc" },
        take: 50,
      }),
      db.paymentMethod.findMany({
        where: { userId, isActive: true },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          type: true,
          details: true,
          isDefault: true,
        },
      }),
    ]);

  const summary = {
    availableBalance: 0,
    totalEarnings: 0,
    pendingPayouts: 0,
  };

  summary.availableBalance = user?.walletBalance ?? 0;
  summary.totalEarnings = totalEarnings._sum.amount ?? 0;
  summary.pendingPayouts = pendingWithdrawals._sum.amount ?? 0;

  const earningTransactions: DashboardTransaction[] = earnings.map((item) => ({
    id: item.id,
    type: "earning",
    description: item.course?.title
      ? `Course: ${item.course.title}`
      : "Course earning",
    amount: item.amount,
    date: item.createdAt.toISOString().slice(0, 10),
    status: item.status === "PENDING" ? "pending" : "completed",
  }));

  const withdrawalTransactions: DashboardTransaction[] = withdrawals.map(
    (item) => ({
      id: item.id,
      type: "withdrawal",
      description: "Withdrawal",
      amount: -item.amount,
      date: item.requestedAt.toISOString().slice(0, 10),
      status:
        item.status === "PAID"
          ? "completed"
          : item.status === "REJECTED"
          ? "failed"
          : "pending",
    })
  );

  const transactions = [...earningTransactions, ...withdrawalTransactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 20);

  const months = buildRecentMonths(6);
  const earningsByMonth = new Map(
    months.map((month) => [month.key, 0])
  );

  earnings.forEach((item) => {
    const key = monthKey(item.createdAt);
    if (earningsByMonth.has(key)) {
      earningsByMonth.set(
        key,
        (earningsByMonth.get(key) || 0) + item.amount
      );
    }
  });

  const earningsData = months.map((month) => ({
    month: month.label,
    courses: earningsByMonth.get(month.key) || 0,
    mentorship: 0,
    projects: 0,
  }));

  const revenueBreakdown = [
    { name: "Courses", value: summary.totalEarnings, color: "#3b82f6" },
    { name: "Mentorship", value: 0, color: "#8b5cf6" },
    { name: "Projects", value: 0, color: "#06d6a0" },
  ];

  return {
    success: true,
    user: {
      name: user?.name ?? "Tutor",
      avatar: user?.avatar ?? null,
      role: user?.role ?? "TUTOR",
      recipientCode: user?.recipientCode ?? null,
      bankName: user?.bankName ?? null,
      accountNumber: user?.accountNumber ?? null,
    },
    summary,
    transactions,
    earningsData,
    revenueBreakdown,
    paymentMethods,
  };
}

export async function getPaystackBanks() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const banks = await paystackListBanks();
  return {
    success: true,
    banks: banks.map((bank) => ({
      code: bank.code,
      name: bank.name,
    })),
  };
}

export async function verifyBankAccount({
  bankCode,
  accountNumber,
}: {
  bankCode: string;
  accountNumber: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!bankCode || !accountNumber) {
    return { error: "Bank code and account number are required" };
  }

  try {
    const [banks, resolved] = await Promise.all([
      paystackListBanks(),
      paystackResolveAccount({ accountNumber, bankCode }),
    ]);

    const bankName =
      banks.find((bank) => bank.code === bankCode)?.name || "Bank";

    return {
      success: true,
      bankName,
      bankCode,
      accountNumber: resolved.account_number,
      accountName: resolved.account_name,
    };
  } catch (error: any) {
    return {
      error:
        error?.message ||
        "Unable to verify bank account. Please try again later.",
    };
  }
}

export async function saveBankPaymentMethod({
  bankCode,
  accountNumber,
  recipientCode,
}: {
  bankCode: string;
  accountNumber: string;
  recipientCode?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!bankCode || !accountNumber) {
    return { error: "Bank code and account number are required" };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, role: true, subaccountCode: true },
    });
    if (!user) return { error: "User not found" };

    const [banks, resolved] = await Promise.all([
      paystackListBanks(),
      paystackResolveAccount({ accountNumber, bankCode }),
    ]);

    const bankName =
      banks.find((bank) => bank.code === bankCode)?.name || "Bank";
    const accountName = resolved.account_name;
    const recipient =
      recipientCode ||
      (await paystackCreateTransferRecipient({
        name: accountName,
        accountNumber: resolved.account_number,
        bankCode,
      }).then((data) => data.recipient_code));

    const subaccountCode =
      (user.role === "TUTOR" || user.role === "MENTOR") && !user.subaccountCode
        ? await paystackCreateSubaccount({
            businessName: user.name ? `${user.name} Tutor` : "Tutor",
            settlementBank: bankCode,
            accountNumber: resolved.account_number,
            percentageCharge: 0,
            contactEmail: user.email || undefined,
          }).then((data) => data.subaccount_code)
        : user.subaccountCode || undefined;

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          bankName,
          accountNumber: resolved.account_number,
          recipientCode: recipient,
          subaccountCode,
        },
      });

      const existing = await tx.paymentMethod.findFirst({
        where: { userId: session.user.id, type: "BANK" },
        select: { id: true },
      });

      if (existing) {
        await tx.paymentMethod.update({
          where: { id: existing.id },
          data: {
            details: {
              bankName,
              bankCode,
              accountNumber: resolved.account_number,
              accountName,
              recipientCode: recipient,
            },
            isActive: true,
          },
        });
      } else {
        await tx.paymentMethod.create({
          data: {
            userId: session.user.id,
            type: "BANK",
            details: {
              bankName,
              bankCode,
              accountNumber: resolved.account_number,
              accountName,
              recipientCode: recipient,
            },
            isDefault: true,
            isActive: true,
          },
        });
      }

      await tx.paymentMethod.updateMany({
        where: { userId: session.user.id, type: "BANK" },
        data: { isDefault: true },
      });
    });

    return { success: true };
  } catch (error: any) {
    return {
      error:
        error?.message || "Unable to save bank details. Please try again later.",
    };
  }
}

export async function setDefaultPaymentMethod(paymentMethodId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const method = await db.paymentMethod.findUnique({
    where: { id: paymentMethodId },
    select: { userId: true },
  });
  if (!method || method.userId !== session.user.id) {
    return { error: "Invalid payment method" };
  }

  await db.$transaction(async (tx) => {
    await tx.paymentMethod.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
    await tx.paymentMethod.update({
      where: { id: paymentMethodId },
      data: { isDefault: true },
    });
  });

  return { success: true };
}

export async function deactivatePaymentMethod(paymentMethodId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const method = await db.paymentMethod.findUnique({
    where: { id: paymentMethodId },
    select: { userId: true, isDefault: true },
  });
  if (!method || method.userId !== session.user.id) {
    return { error: "Invalid payment method" };
  }

  await db.paymentMethod.update({
    where: { id: paymentMethodId },
    data: { isActive: false, isDefault: false },
  });

  if (method.isDefault) {
    const next = await db.paymentMethod.findFirst({
      where: { userId: session.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (next) {
      await db.paymentMethod.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }

  return { success: true };
}

export async function getAdminWithdrawalQueue() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  const [requests, totals] = await Promise.all([
    db.withdrawalRequest.findMany({
      orderBy: { requestedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            recipientCode: true,
            bankName: true,
            accountNumber: true,
          },
        },
        payout: true,
      },
      take: 100,
    }),
    db.withdrawalRequest.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  return {
    success: true,
    requests,
    totals,
  };
}

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
