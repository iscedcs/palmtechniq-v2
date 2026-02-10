import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
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

  return NextResponse.json({
    ok: true,
    summary: {
      availableBalance: user?.walletBalance ?? 0,
      totalEarnings: totalEarnings._sum.amount ?? 0,
      pendingPayouts: pendingWithdrawals._sum.amount ?? 0,
    },
  });
}
