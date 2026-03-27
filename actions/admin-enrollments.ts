"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getAdminEnrollmentsData() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "ADMIN") return { error: "Forbidden" };

  const [enrollments, stats] = await Promise.all([
    db.programEnrollment.findMany({
      include: {
        program: { select: { name: true, slug: true } },
        cohort: { select: { displayName: true } },
        user: { select: { id: true, name: true, email: true } },
        installments: {
          orderBy: { installmentNo: "asc" },
          select: {
            id: true,
            installmentNo: true,
            amount: true,
            dueDate: true,
            status: true,
            paidAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.programEnrollment.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { amountPaid: true, totalAmount: true },
    }),
  ]);

  const totalEnrollments = enrollments.length;
  const totalRevenue = enrollments.reduce(
    (s: number, e: (typeof enrollments)[number]) => s + e.amountPaid,
    0,
  );
  const totalExpected = enrollments.reduce(
    (s: number, e: (typeof enrollments)[number]) => s + e.totalAmount,
    0,
  );
  const pendingBalance = totalExpected - totalRevenue;

  const statusCounts = {
    PENDING_PAYMENT: 0,
    FIRST_INSTALLMENT_PAID: 0,
    FULLY_PAID: 0,
    CANCELLED: 0,
    REFUNDED: 0,
  };
  for (const s of stats) {
    if (s.status in statusCounts) {
      statusCounts[s.status as keyof typeof statusCounts] = s._count.id;
    }
  }

  return {
    success: true,
    enrollments: enrollments.map((e: (typeof enrollments)[number]) => ({
      id: e.id,
      fullName: e.fullName,
      email: e.email,
      phone: e.phone,
      programName: e.program.name,
      cohortName: e.cohort.displayName,
      learningMode: e.learningMode,
      paymentPlan: e.paymentPlan,
      status: e.status,
      totalAmount: e.totalAmount,
      amountPaid: e.amountPaid,
      balance: e.totalAmount - e.amountPaid,
      hasAccount: !!e.userId,
      userId: e.userId,
      userName: e.user?.name ?? null,
      installments: e.installments,
      createdAt: e.createdAt.toISOString(),
    })),
    stats: {
      totalEnrollments,
      totalRevenue,
      totalExpected,
      pendingBalance,
      ...statusCounts,
    },
  };
}
