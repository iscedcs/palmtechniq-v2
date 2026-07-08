"use server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getTransactionAudit(params?: {
  page?: number;
  status?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!["ADMIN", "SUPERIOR"].includes(session.user.role as string))
    return { error: "Forbidden" };

  const pageSize = 50;
  const page = params?.page ?? 1;
  const statusFilter = params?.status;

  const where: any = {};
  if (statusFilter && ["COMPLETED", "PENDING", "FAILED", "REFUNDED"].includes(statusFilter)) {
    where.status = statusFilter;
  }

  const [summary, transactions, total] = await Promise.all([
    db.transaction.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { amount: true },
    }),
    db.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        transactionId: true,
        amount: true,
        status: true,
        currency: true,
        createdAt: true,
        paymentDate: true,
        metadata: true,
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    }),
    db.transaction.count({ where }),
  ]);

  const mapped = transactions.map((tx: any) => {
    const meta = (tx.metadata as any) ?? {};
    const ref = meta?.verify?.reference ?? tx.transactionId ?? "";
    const isTestKey =
      ref.startsWith("T_") ||
      meta?.verify?.domain === "test" ||
      String(ref).toLowerCase().includes("test");
    return {
      id: tx.id,
      transactionId: tx.transactionId,
      amount: tx.amount,
      status: tx.status,
      currency: tx.currency ?? "NGN",
      createdAt: tx.createdAt.toISOString(),
      paymentDate: tx.paymentDate?.toISOString() ?? null,
      userName: tx.user?.name ?? "—",
      userEmail: tx.user?.email ?? "—",
      courseTitle: tx.course?.title ?? "—",
      isTestKey,
    };
  });

  return {
    success: true,
    summary,
    transactions: mapped,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function markStalePendingTransactions() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!["ADMIN", "SUPERIOR"].includes(session.user.role as string))
    return { error: "Forbidden" };

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await db.transaction.updateMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    data: { status: "FAILED" },
  });
  return { success: true, count: result.count };
}
