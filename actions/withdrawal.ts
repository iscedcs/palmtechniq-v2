"use server";

import crypto, { randomUUID } from "crypto";
import { creditWallet, debitWallet } from "@/lib/payments/wallet";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyTotpToken } from "@/lib/totp";
import { sendWithdrawalOtpEmail, sendPayoutStatusEmail } from "@/lib/mail";
import { allowsEmail } from "@/lib/user-preferences";
import { notify } from "@/lib/notify";
import { SITE_URL } from "@/lib/site";
import { type TwoFactorMethod } from "@/actions/account-security";
import {
  paystackCreateSubaccount,
  paystackCreateTransferRecipient,
  paystackListBanks,
  paystackResolveAccount,
  paystackTransfer,
} from "@/actions/paystack";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

const WALLET_URL = `${SITE_URL}/tutor/wallet`;

/**
 * Tell a tutor/mentor about a withdrawal, in-app and — if they allow it — by
 * email. In-app is unconditional: it is the channel that still works when
 * email is off, bounces, or Resend is down. Never throws: a payout must stay
 * settled whether or not the notice reaches them.
 */
async function announcePayout(params: {
  userId: string;
  email: string | null;
  name: string | null;
  preferences: unknown;
  amount: number;
  status: "REQUESTED" | "PROCESSING" | "PAID" | "REJECTED";
  reference: string;
  bankName?: string | null;
  accountNumber?: string | null;
  reason?: string | null;
  newBalance?: number;
}) {
  const title: Record<typeof params.status, string> = {
    REQUESTED: "Withdrawal request received",
    PROCESSING: "Your payout is on its way",
    PAID: "Your payout has been sent",
    REJECTED: "Withdrawal request declined",
  } as const;

  const message: Record<typeof params.status, string> = {
    REQUESTED: `Your withdrawal request has been received and is awaiting review.`,
    PROCESSING: `Your withdrawal has been approved and is being sent to your bank.`,
    PAID: `Your withdrawal has been sent to your bank account.`,
    REJECTED: `Your withdrawal request was declined. The funds are back in your wallet.`,
  } as const;

  await notify
    .user(params.userId, {
      type: params.status === "REJECTED" ? "warning" : "payment",
      title: title[params.status],
      message: message[params.status],
      actionUrl: "/tutor/wallet",
      actionLabel: "View Wallet",
      metadata: { category: "payout_status", status: params.status },
    })
    .catch((error: unknown) =>
      console.error("[withdrawal] in-app payout notice failed:", error),
    );

  if (!params.email || !allowsEmail(params.preferences)) return;

  const result = await sendPayoutStatusEmail({
    email: params.email,
    name: params.name ?? undefined,
    amount: params.amount,
    status: params.status,
    reference: params.reference,
    bankName: params.bankName ?? undefined,
    accountNumber: params.accountNumber ?? undefined,
    reason: params.reason ?? undefined,
    newBalance: params.newBalance,
    walletUrl: WALLET_URL,
  }).catch((error: unknown) => {
    console.error("[withdrawal] payout status email threw:", error);
    return { error: "threw" };
  });

  if (result && "error" in result) {
    console.error("[withdrawal] payout status email failed:", result.error);
  }
}

type DashboardTransaction = {
  id: string;
  type: "earning" | "withdrawal";
  description: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
};

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}`;

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
    accruedPending,
    pendingWithdrawals,
    earnings,
    withdrawals,
    paymentMethods,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        avatar: true,
        role: true,
        walletBalance: true,
        recipientCode: true,
        bankName: true,
        accountNumber: true,
        preferences: true,
      },
    }),
    // Only money that has actually reached the wallet. PENDING program
    // accruals are not the tutor's yet and CANCELLED ones never will be.
    db.tutorEarning.aggregate({
      where: { tutorId: userId, status: { in: ["AVAILABLE", "PAID"] } },
      _sum: { amount: true },
    }),
    db.tutorEarning.aggregate({
      where: { tutorId: userId, status: "PENDING" },
      _sum: { amount: true },
    }),
    db.withdrawalRequest.aggregate({
      where: { userId, status: { in: ["PENDING", "APPROVED"] } },
      _sum: { amount: true },
    }),
    db.tutorEarning.findMany({
      where: { tutorId: userId, status: { not: "CANCELLED" } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        course: { select: { title: true } },
        cohort: {
          select: { displayName: true, program: { select: { name: true } } },
        },
      },
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
    accruedPending: 0,
  };

  summary.availableBalance = user?.walletBalance ?? 0;
  summary.totalEarnings = totalEarnings._sum.amount ?? 0;
  summary.pendingPayouts = pendingWithdrawals._sum.amount ?? 0;
  // Accrued program earnings: recorded and owed, but not yet released to the
  // wallet, so deliberately NOT part of availableBalance.
  summary.accruedPending = accruedPending._sum.amount ?? 0;

  const earningTransactions: DashboardTransaction[] = earnings.map(
    (item: any) => ({
      id: item.id,
      type: "earning",
      description:
        item.source === "PROGRAM"
          ? `Program: ${item.cohort?.program?.name ?? "Cohort"}${
              item.cohort?.displayName ? ` — ${item.cohort.displayName}` : ""
            }`
          : item.course?.title
            ? `Course: ${item.course.title}`
            : "Course earning",
      amount: item.amount,
      date: item.createdAt.toISOString().slice(0, 10),
      status: item.status === "PENDING" ? "pending" : "completed",
    }),
  );

  const withdrawalTransactions: DashboardTransaction[] = withdrawals.map(
    (item: any) => ({
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
    }),
  );

  const transactions = [...earningTransactions, ...withdrawalTransactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 20);

  const months = buildRecentMonths(6);
  const earningsByMonth = new Map(months.map((month: any) => [month.key, 0]));

  earnings.forEach((item: any) => {
    const key = monthKey(item.createdAt);
    if (earningsByMonth.has(key)) {
      earningsByMonth.set(key, (earningsByMonth.get(key) || 0) + item.amount);
    }
  });

  const earningsData = months.map((month: any) => ({
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

  const userPrefs = (user?.preferences as Record<string, unknown>) || {};
  const twoFactorEnabled = Boolean(userPrefs.twoFactorEnabled);
  const twoFactorMethod =
    (userPrefs.twoFactorMethod as TwoFactorMethod) || (twoFactorEnabled ? "AUTHENTICATOR" : null);

  return {
    success: true,
    user: {
      name: user?.name ?? "Tutor",
      email: user?.email ?? "",
      avatar: user?.avatar ?? null,
      role: user?.role ?? "TUTOR",
      recipientCode: user?.recipientCode ?? null,
      bankName: user?.bankName ?? null,
      accountNumber: user?.accountNumber ?? null,
      twoFactorEnabled,
      twoFactorMethod,
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

    await db.$transaction(async (tx: any) => {
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
        error?.message ||
        "Unable to save bank details. Please try again later.",
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

  await db.$transaction(async (tx: any) => {
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

export async function sendWithdrawalAuthorizationOtp(amount: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Each call emails a fresh code and invalidates the last one, so an
  // unthrottled endpoint both spams the tutor's inbox and lets an attacker
  // keep a code in flight indefinitely.
  const otpLimited = await enforceRateLimit({
    name: "withdrawal-otp-send",
    limit: 3,
    windowSeconds: 15 * 60,
    subject: session.user.id,
  });
  if (otpLimited) return { success: false, error: otpLimited };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      name: true,
      bankName: true,
      accountNumber: true,
      preferences: true,
    },
  });

  if (!user || !user.email) {
    return { success: false, error: "User email not found." };
  }

  const prefs = (user.preferences as Record<string, unknown>) || {};
  if (!prefs.twoFactorEnabled) {
    return {
      success: false,
      error:
        "Two-Factor Authentication is required to withdraw funds. Please set up 2FA in your settings.",
      requires2faSetup: true,
    };
  }

  // Generate 6-digit numeric OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const otpHash = crypto.createHash("sha256").update(otpCode).digest("hex");

  const updatedPrefs = {
    ...prefs,
    pendingWithdrawalOtpHash: otpHash,
    pendingWithdrawalOtpExpiresAt: expiresAt,
    pendingWithdrawalAmount: amount,
  };

  await db.user.update({
    where: { id: session.user.id },
    data: { preferences: updatedPrefs },
  });

  const mailResult = await sendWithdrawalOtpEmail({
    email: user.email,
    name: user.name || undefined,
    amount,
    code: otpCode,
    bankName: user.bankName || undefined,
    accountNumber: user.accountNumber || undefined,
    expiresInMinutes: 10,
  });

  if (mailResult && "error" in mailResult && mailResult.error) {
    return { success: false, error: mailResult.error };
  }

  return {
    success: true,
    message: `A 6-digit authorization code has been sent to ${user.email}.`,
  };
}

export async function requestWithdrawal(amount: number, twoFactorCode?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // The code is six digits. Without a cap on attempts it can simply be
  // guessed, and this is the action that moves money out of the wallet.
  const attemptLimited = await enforceRateLimit({
    name: "withdrawal-request",
    limit: 5,
    windowSeconds: 15 * 60,
    subject: session.user.id,
  });
  if (attemptLimited) return { error: attemptLimited };

  if (!amount || amount <= 0) {
    return { error: "Invalid amount" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      walletBalance: true,
      recipientCode: true,
      role: true,
      preferences: true,
      email: true,
      name: true,
      bankName: true,
      accountNumber: true,
    },
  });

  if (!user) return { error: "User not found" };

  // Only earners may take money out. A student's balance is group-buying
  // cashback, which is platform credit — it is spent on courses, never paid
  // out as cash. Without this guard a student with bank details could withdraw
  // it, turning a discount into a real cash cost to the platform.
  if (!["TUTOR", "MENTOR", "ADMIN"].includes(user.role)) {
    return {
      error:
        "Your balance is course credit. It is applied automatically at checkout and cannot be withdrawn.",
    };
  }

  if (!user.recipientCode) return { error: "No payout recipient configured" };
  if (user.walletBalance < amount) return { error: "Insufficient balance" };

  // ================= 2FA SECURITY ENFORCEMENT =================
  const prefs = (user.preferences as Record<string, unknown>) || {};
  const twoFactorEnabled = Boolean(prefs.twoFactorEnabled);

  if (!twoFactorEnabled) {
    return {
      error:
        "Two-Factor Authentication (2FA) is required to withdraw funds. Please enable 2FA in your account settings before submitting a withdrawal request.",
      requires2faSetup: true,
    };
  }

  if (!twoFactorCode || twoFactorCode.trim().length !== 6) {
    return {
      error: "Please provide a valid 6-digit Two-Factor verification code.",
      requires2faCode: true,
    };
  }

  const twoFactorMethod =
    (prefs.twoFactorMethod as TwoFactorMethod) || "AUTHENTICATOR";

  if (twoFactorMethod === "AUTHENTICATOR") {
    const secret = prefs.twoFactorSecret as string | undefined;
    if (!secret) {
      return {
        error:
          "Authenticator configuration error. Please reconfigure 2FA in your settings.",
      };
    }

    const isValid = verifyTotpToken(secret, twoFactorCode.trim());
    if (!isValid) {
      return {
        error:
          "Invalid authenticator code. Please check your authenticator app and try again.",
      };
    }
  } else if (twoFactorMethod === "EMAIL") {
    const expectedHash = prefs.pendingWithdrawalOtpHash as string | undefined;
    const expiresAtStr = prefs.pendingWithdrawalOtpExpiresAt as string | undefined;

    if (!expectedHash || !expiresAtStr) {
      return {
        error:
          "No authorization code was requested or the code has expired. Please request a new code.",
      };
    }

    if (new Date(expiresAtStr).getTime() < Date.now()) {
      return {
        error: "Authorization code has expired. Please request a new code.",
      };
    }

    const inputHash = crypto
      .createHash("sha256")
      .update(twoFactorCode.trim())
      .digest("hex");
    if (inputHash !== expectedHash) {
      return {
        error:
          "Invalid verification code. Please check your email and try again.",
      };
    }

    // Clean up one-time withdrawal OTP
    const {
      pendingWithdrawalOtpHash,
      pendingWithdrawalOtpExpiresAt,
      pendingWithdrawalAmount,
      ...cleanedPrefs
    } = prefs;
    await db.user.update({
      where: { id: session.user.id },
      data: { preferences: cleanedPrefs },
    });
  }

  const { requestId, newBalance } = await db.$transaction(async (tx: any) => {
    const entry = await debitWallet(tx, {
      userId: session.user.id,
      amount,
      type: "WITHDRAWAL_REQUESTED",
      description: "Withdrawal requested",
    });

    const request = await tx.withdrawalRequest.create({
      data: {
        userId: session.user.id,
        amount,
        status: "PENDING",
      },
    });

    return { requestId: request.id, newBalance: entry?.balanceAfter };
  });

  await announcePayout({
    userId: session.user.id,
    email: user.email,
    name: user.name,
    preferences: user.preferences,
    amount,
    status: "REQUESTED",
    reference: requestId,
    bankName: user.bankName,
    accountNumber: user.accountNumber,
    newBalance,
  });

  return { success: true };
}

export async function approveWithdrawalRequest(
  withdrawalRequestId: string,
  adminNote?: string,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "ADMIN") return { error: "Forbidden" };

  const withdrawal = await db.withdrawalRequest.findUnique({
    where: { id: withdrawalRequestId },
    include: {
      user: {
        select: {
          recipientCode: true,
          email: true,
          name: true,
          preferences: true,
          bankName: true,
          accountNumber: true,
        },
      },
    },
  });

  if (!withdrawal) return { error: "Withdrawal not found" };
  if (withdrawal.status !== "PENDING") {
    return { error: "Withdrawal already processed" };
  }

  if (!withdrawal.user.recipientCode) {
    return {
      error:
        "Tutor has no valid Paystack recipient code. They need to update their bank details first.",
    };
  }

  const reference = `wd_${randomUUID()}`;

  // Paystack throws on anything from "insufficient balance" to a stale
  // recipient code. Left uncaught, that becomes an unhandled server-action
  // rejection — a 500 with no message the admin ever sees, visible only in
  // whoever's terminal happens to be running the server. The request stays
  // PENDING either way (nothing below this has run yet), so it's safe to
  // just report the failure and let the admin retry once it's fixed.
  let transfer: Awaited<ReturnType<typeof paystackTransfer>>;
  try {
    transfer = await paystackTransfer({
      amountKobo: Math.round(withdrawal.amount * 100),
      recipientCode: withdrawal.user.recipientCode,
      reference,
      reason: "Tutor withdrawal",
    });
  } catch (error) {
    console.error("[withdrawal] Paystack transfer failed:", error);
    const message = error instanceof Error ? error.message : "Paystack transfer failed";
    return {
      error:
        message === "Your balance is not enough to fulfil this request"
          ? "Paystack balance is too low to fund this transfer. Top up the Paystack account balance, then try again."
          : message,
    };
  }

  await db.$transaction(async (tx: any) => {
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

    // Settle the earnings this payout covers. TutorEarningStatus.PAID existed
    // but was never set, so every earning stayed AVAILABLE forever and there
    // was no way to tell which had actually been paid out.
    //
    // Oldest first: the earnings that have been owed longest are the ones a
    // withdrawal settles. Partial coverage leaves the remainder AVAILABLE,
    // which is correct — a withdrawal smaller than the balance settles only
    // part of it.
    if (transfer.status === "success") {
      const outstanding = await tx.tutorEarning.findMany({
        where: { tutorId: withdrawal.userId, status: "AVAILABLE" },
        orderBy: { createdAt: "asc" },
        select: { id: true, amount: true },
      });

      let remaining = withdrawal.amount;
      const settled: string[] = [];
      for (const earning of outstanding) {
        if (remaining < earning.amount) break;
        remaining -= earning.amount;
        settled.push(earning.id);
      }

      if (settled.length > 0) {
        await tx.tutorEarning.updateMany({
          where: { id: { in: settled } },
          data: { status: "PAID" },
        });
      }
    }
  });

  await announcePayout({
    userId: withdrawal.userId,
    email: withdrawal.user.email,
    name: withdrawal.user.name,
    preferences: withdrawal.user.preferences,
    amount: withdrawal.amount,
    status: transfer.status === "success" ? "PAID" : "PROCESSING",
    reference: withdrawalRequestId,
    bankName: withdrawal.user.bankName,
    accountNumber: withdrawal.user.accountNumber,
  });

  return { success: true };
}

export async function rejectWithdrawalRequest(
  withdrawalRequestId: string,
  adminNote?: string,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "ADMIN") return { error: "Forbidden" };

  const withdrawal = await db.withdrawalRequest.findUnique({
    where: { id: withdrawalRequestId },
    select: {
      id: true,
      userId: true,
      amount: true,
      status: true,
      user: { select: { email: true, name: true, preferences: true } },
    },
  });

  if (!withdrawal) return { error: "Withdrawal not found" };
  if (withdrawal.status !== "PENDING") {
    return { error: "Withdrawal already processed" };
  }

  const newBalance = await db.$transaction(async (tx: any) => {
    await tx.withdrawalRequest.update({
      where: { id: withdrawalRequestId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        approvedById: session.user.id,
        adminNote,
      },
    });

    const entry = await creditWallet(tx, {
      userId: withdrawal.userId,
      amount: withdrawal.amount,
      type: "WITHDRAWAL_REVERSED",
      withdrawalRequestId: withdrawal.id,
      description: "Withdrawal rejected, funds returned",
    });

    return entry?.balanceAfter;
  });

  await announcePayout({
    userId: withdrawal.userId,
    email: withdrawal.user.email,
    name: withdrawal.user.name,
    preferences: withdrawal.user.preferences,
    amount: withdrawal.amount,
    status: "REJECTED",
    reference: withdrawalRequestId,
    reason: adminNote,
    newBalance,
  });

  return { success: true };
}
