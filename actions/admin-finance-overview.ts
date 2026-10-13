"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  computeMoneyPosition,
  type MoneyPosition,
} from "@/lib/payments/money-position";
import { getPaystackBalance } from "@/lib/payments/paystack-balance";
import {
  countByOrigin,
  type TransactionSummary,
} from "@/lib/payments/transaction-origin";
import { getTransactionSummaries } from "@/lib/payments/transaction-totals";

export type FinanceOverview = {
  position: MoneyPosition;
  /** Why the Paystack balance is missing, when it is. */
  balanceError: string | null;
  /** Student cashback credit: spendable store credit, not cash owed. */
  studentCredit: number;
  pendingWithdrawals: { count: number; amount: number };
  summary: TransactionSummary;
  thisMonthGross: number;
  testTransactionCount: number;
  legacyTransactionCount: number;
};

type Sum = { _sum: Record<string, number | null> };

export async function getFinanceOverview(): Promise<
  { error: string } | ({ success: true } & FinanceOverview)
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "ADMIN") return { error: "Forbidden" };

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    balance,
    summaries,
    earnerWallets,
    studentWallets,
    pendingWithdrawals,
    accruedProgram,
    vatPending,
  ] = await Promise.all([
    getPaystackBalance(),
    getTransactionSummaries(monthStart),
    db.user.aggregate({
      where: { role: { in: ["TUTOR", "MENTOR"] } },
      _sum: { walletBalance: true },
    }) as Promise<Sum>,
    db.user.aggregate({
      where: { role: { notIn: ["TUTOR", "MENTOR"] } },
      _sum: { walletBalance: true },
    }) as Promise<Sum>,
    db.withdrawalRequest.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
      _count: { _all: true },
    }) as Promise<Sum & { _count: { _all: number } }>,
    db.tutorEarning.aggregate({
      where: { source: "PROGRAM", status: "PENDING" },
      _sum: { amount: true },
    }) as Promise<Sum>,
    db.vatLedger.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
    }) as Promise<Sum>,
  ]);

  const position = computeMoneyPosition({
    paystackBalance: balance.ok ? balance.naira : null,
    tutorAndMentorWallets: earnerWallets._sum.walletBalance ?? 0,
    openWithdrawals: pendingWithdrawals._sum.amount ?? 0,
    accruedProgramEarnings: accruedProgram._sum.amount ?? 0,
    vatToRemit: vatPending._sum.amount ?? 0,
  });

  return {
    success: true,
    position,
    balanceError: balance.ok ? null : balance.error,
    studentCredit: studentWallets._sum.walletBalance ?? 0,
    pendingWithdrawals: {
      count: pendingWithdrawals._count._all,
      amount: pendingWithdrawals._sum.amount ?? 0,
    },
    summary: summaries.allTime,
    thisMonthGross: summaries.thisMonth.live.COMPLETED.gross,
    testTransactionCount: countByOrigin(summaries.allTime, "test"),
    legacyTransactionCount: countByOrigin(summaries.allTime, "legacy"),
  };
}
