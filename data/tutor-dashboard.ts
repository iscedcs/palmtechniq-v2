"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getAverageRating } from "@/lib/reviews";
import { formatDistanceToNow } from "date-fns";

export async function getTutorDashboardData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
  });
  if (!tutor) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const courses = await db.course.findMany({
    where: { tutorId: tutor.id },
    include: {
      modules: {
        include: { lessons: true },
      },
      enrollments: true,
      reviews: { where: { isPublic: true } },
      transactions: { where: { status: "COMPLETED" } },
    },
  });

  const enrollments = await db.enrollment.findMany({
    where: { course: { tutorId: tutor.id } },
    include: { user: true, course: true },
    orderBy: { enrolledAt: "desc" },
    take: 5,
  });

  const reviews = await db.review.findMany({
    where: { course: { tutorId: tutor.id }, isPublic: true },
    include: { user: true, course: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const mentorships = await db.mentorshipSession.findMany({
    where: { tutorId: tutor.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const projects = await db.submission.findMany({
    where: { userId: tutor.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Earnings come from TutorEarning, not Transaction.amount. Transaction.amount
  // is the gross the student paid — it includes VAT owed to FIRS and the
  // platform's share, neither of which the tutor receives. TutorEarning is the
  // same ledger the wallet reads, so the two can never disagree.
  const earningsWhere = {
    tutorId: session.user.id,
    status: { in: ["AVAILABLE", "PAID"] as const },
  };

  const currentMonthTx = await db.tutorEarning.aggregate({
    where: { ...earningsWhere, createdAt: { gte: startOfMonth } },
    _sum: { amount: true },
  });

  const lastMonthTx = await db.tutorEarning.aggregate({
    where: {
      ...earningsWhere,
      createdAt: { gte: startOfLastMonth, lt: startOfMonth },
    },
    _sum: { amount: true },
  });

  const totalStudents = courses.reduce(
    (sum: any, c: any) => sum + c.enrollments.length,
    0,
  );

  const totalEarningsAgg = await db.tutorEarning.aggregate({
    where: earningsWhere,
    _sum: { amount: true },
  });
  const totalEarnings = totalEarningsAgg._sum.amount || 0;

  const monthlyEarnings = await db.tutorEarning.aggregate({
    where: { ...earningsWhere, createdAt: { gte: startOfMonth } },
    _sum: { amount: true },
  });

  // Per-course earnings, so a course card shows what the tutor actually made
  // on it rather than the gross the students paid.
  const earningsByCourse = await db.tutorEarning.groupBy({
    by: ["courseId"],
    where: { ...earningsWhere, courseId: { not: null } },
    _sum: { amount: true },
  });
  const courseEarnings = new Map<string, number>(
    earningsByCourse
      .filter((row: any) => row.courseId)
      .map((row: any) => [row.courseId as string, row._sum.amount || 0]),
  );

  const coursesSold = courses.reduce(
    (sum: any, c: any) => sum + c.enrollments.length,
    0,
  );

  const averageRating = getAverageRating(
    courses.flatMap((c: any) => c.reviews),
  );

  const currentMonthAmount = currentMonthTx._sum.amount || 0;
  const lastMonthAmount = lastMonthTx._sum.amount || 0;
  const earningsChange =
    lastMonthAmount > 0
      ? ((currentMonthAmount - lastMonthAmount) / lastMonthAmount) * 100
      : 0;

  const studentsThisMonth = await db.enrollment.count({
    where: {
      course: { tutorId: tutor.id },
      enrolledAt: { gte: startOfMonth },
    },
  });

  const studentsLastMonth = await db.enrollment.count({
    where: {
      course: { tutorId: tutor.id },
      enrolledAt: {
        gte: startOfLastMonth,
        lt: startOfMonth,
      },
    },
  });

  const studentsChange =
    studentsLastMonth > 0
      ? ((studentsThisMonth - studentsLastMonth) / studentsLastMonth) * 100
      : 0;

  const allReviews = courses.flatMap((c: any) => c.reviews);

  const ratingsThisMonth = allReviews.filter(
    (r: any) => r.createdAt >= startOfMonth,
  );
  const ratingsLastMonth = allReviews.filter(
    (r: any) => r.createdAt >= startOfLastMonth && r.createdAt < startOfMonth,
  );

  const ratingChange =
    ratingsLastMonth.length > 0
      ? ((ratingsThisMonth.length - ratingsLastMonth.length) /
          ratingsLastMonth.length) *
        100
      : 0;

  const monthsBack = 6;
  const earningsHistory: { month: string; amount: number }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const monthName = start.toLocaleString("default", { month: "short" });

    const sum = await db.tutorEarning.aggregate({
      where: { ...earningsWhere, createdAt: { gte: start, lt: end } },
      _sum: { amount: true },
    });

    earningsHistory.push({
      month: monthName,
      amount: sum._sum.amount || 0,
    });
  }

  // --- Courses Summary ---
  const coursesSummary = courses.map((c: any) => ({
    id: c.id,
    title: c.title,
    students: c.enrollments.length,
    rating: getAverageRating(c.reviews),
    earnings: courseEarnings.get(c.id) ?? 0,
    status: c.status.toLowerCase(),
    thumbnail: c.thumbnail,
    lastUpdated: c.updatedAt.toLocaleDateString(),
  }));

  const upcomingMentorships: any = []; // db.mentorshipSession.findMany(...)
  const pendingProjects: any = []; // db.project.findMany(...)

  // Sort on the real timestamp, then format. Sorting the formatted strings
  // orders them alphabetically — "2 minutes ago" against "about 1 hour ago" —
  // so the newest activity could be buried and then cut by the slice.
  const recentActivity = [
    ...enrollments.map((e: any) => ({
      type: "enrollment" as const,
      message: `${e.user.name} enrolled in your course "${e.course.title}"`,
      at: e.enrolledAt as Date,
    })),
    ...reviews.map((r: any) => ({
      type: "review" as const,
      message: `${r.user.name} rated "${r.course.title}" ${r.rating}⭐`,
      at: r.createdAt as Date,
    })),
    ...mentorships.map((m: any) => ({
      type: "mentorship" as const,
      message: `New mentorship session scheduled: ${m.title}`,
      at: m.createdAt as Date,
    })),
    ...projects.map((p: any) => ({
      type: "project" as const,
      message: `New project submission received.`,
      at: p.createdAt as Date,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8)
    .map(({ type, message, at }) => ({
      type,
      message,
      time: formatDistanceToNow(at, { addSuffix: true }),
    }));

  return {
    stats: {
      totalStudents,
      totalEarnings,
      monthlyEarnings: monthlyEarnings._sum.amount || 0,
      earningsHistory,
      coursesSold,
      averageRating,
      totalReviews: courses.reduce(
        (sum: any, c: any) => sum + c.reviews.length,
        0,
      ),
      mentorshipSessions: 0,
      projectsGraded: 0,
      change: {
        totalStudents: Math.round(studentsChange),
        totalEarnings: Math.round(earningsChange),
        averageRating: Math.round(ratingChange),
        coursesSold: Math.round(studentsChange),
      },
    },
    courses: coursesSummary,
    upcomingMentorships,
    pendingProjects,
    recentActivity,
    performance: {
      completionRate: tutor.completionRate || 0,
      satisfaction: tutor.averageRating || 0,
      responseTime: tutor.responseTime || 24,
    },
  };
}
