"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

type EarningsPoint = { month: string; amount: number };

export async function getTutorAnalyticsData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
  });
  if (!tutor) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const courses = await db.course.findMany({
    where: { tutorId: tutor.id },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  const courseIds = courses.map((c) => c.id);

  const [
    enrollmentsByCourse,
    completionByCourse,
    completedRevenueAgg,
    pendingRevenueAgg,
    monthlyCompletedAgg,
    monthlyPendingAgg,
    lastMonthCompletedAgg,
  ] = await Promise.all([
    courseIds.length
      ? db.enrollment.groupBy({
          by: ["courseId"],
          _count: { _all: true },
          where: { courseId: { in: courseIds } },
        })
      : [],
    courseIds.length
      ? db.enrollment.groupBy({
          by: ["courseId", "status"],
          _count: { _all: true },
          where: { courseId: { in: courseIds } },
        })
      : [],
    courseIds.length
      ? db.transactionLineItem.groupBy({
          by: ["courseId"],
          _sum: { totalAmount: true },
          where: {
            courseId: { in: courseIds },
            transaction: { status: "COMPLETED" },
          },
        })
      : [],
    courseIds.length
      ? db.transactionLineItem.groupBy({
          by: ["courseId"],
          _sum: { totalAmount: true },
          where: {
            courseId: { in: courseIds },
            transaction: { status: "PENDING" },
          },
        })
      : [],
    db.transaction.aggregate({
      where: { status: "COMPLETED", course: { tutorId: tutor.id } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { status: "PENDING", course: { tutorId: tutor.id } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        status: "COMPLETED",
        course: { tutorId: tutor.id },
        createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
      },
      _sum: { amount: true },
    }),
  ]);

  const enrollmentCountByCourse = new Map(
    enrollmentsByCourse.map((entry) => [entry.courseId, entry._count._all])
  );

  const completionByCourseMap = new Map<
    string,
    { total: number; completed: number }
  >();
  completionByCourse.forEach((entry) => {
    const current = completionByCourseMap.get(entry.courseId) || {
      total: 0,
      completed: 0,
    };
    current.total += entry._count._all;
    if (entry.status === "COMPLETED") {
      current.completed += entry._count._all;
    }
    completionByCourseMap.set(entry.courseId, current);
  });

  const completedRevenueByCourse = new Map(
    completedRevenueAgg.map((entry) => [
      entry.courseId,
      entry._sum.totalAmount ?? 0,
    ])
  );
  const pendingRevenueByCourse = new Map(
    pendingRevenueAgg.map((entry) => [
      entry.courseId,
      entry._sum.totalAmount ?? 0,
    ])
  );

  const coursesTable = courses.map((course) => {
    const enrollments = enrollmentCountByCourse.get(course.id) ?? 0;
    const completion = completionByCourseMap.get(course.id) || {
      total: 0,
      completed: 0,
    };
    const completionRate =
      completion.total === 0
        ? 0
        : Math.round((completion.completed / completion.total) * 100);
    return {
      id: course.id,
      title: course.title,
      enrollments,
      completionRate,
      completedRevenue: (completedRevenueByCourse.get(course.id) ?? 0) / 100,
      pendingRevenue: (pendingRevenueByCourse.get(course.id) ?? 0) / 100,
    };
  });

  const totalCompletedRevenue = coursesTable.reduce(
    (sum, course) => sum + course.completedRevenue,
    0
  );
  const totalPendingRevenue = coursesTable.reduce(
    (sum, course) => sum + course.pendingRevenue,
    0
  );

  const completionRateOverall = (() => {
    const totals = Array.from(completionByCourseMap.values()).reduce(
      (acc, entry) => {
        acc.total += entry.total;
        acc.completed += entry.completed;
        return acc;
      },
      { total: 0, completed: 0 }
    );
    return totals.total === 0
      ? 0
      : Math.round((totals.completed / totals.total) * 100);
  })();

  const monthlyCompleted = (monthlyCompletedAgg._sum.amount ?? 0) / 100;
  const monthlyPending = (monthlyPendingAgg._sum.amount ?? 0) / 100;
  const lastMonthCompleted = (lastMonthCompletedAgg._sum.amount ?? 0) / 100;
  const earningsChange =
    lastMonthCompleted > 0
      ? Math.round(
          ((monthlyCompleted - lastMonthCompleted) / lastMonthCompleted) * 100
        )
      : 0;

  const monthsBack = 6;
  const earningsHistory: EarningsPoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthName = start.toLocaleString("default", { month: "short" });
    const sum = await db.transaction.aggregate({
      where: {
        status: "COMPLETED",
        course: { tutorId: tutor.id },
        createdAt: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });
    earningsHistory.push({
      month: monthName,
      amount: (sum._sum.amount ?? 0) / 100,
    });
  }

  return {
    stats: {
      totalCompletedRevenue,
      totalPendingRevenue,
      monthlyCompleted,
      monthlyPending,
      completionRateOverall,
      earningsChange,
    },
    earningsHistory,
    coursesTable,
  };
}
