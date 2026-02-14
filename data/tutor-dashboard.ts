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

  const currentMonthTx = await db.transaction.aggregate({
    where: {
      status: "COMPLETED",
      course: { tutorId: tutor.id },
      createdAt: { gte: startOfMonth },
    },
    _sum: { amount: true },
  });

  const lastMonthTx = await db.transaction.aggregate({
    where: {
      status: "COMPLETED",
      course: { tutorId: tutor.id },
      createdAt: {
        gte: startOfLastMonth,
        lt: startOfMonth,
      },
    },
    _sum: { amount: true },
  });

  const totalStudents = courses.reduce(
    (sum, c) => sum + c.enrollments.length,
    0
  );

  const totalEarnings =
    courses.reduce(
      (sum, c) =>
        sum +
        c.transactions.reduce((txSum, tx) => txSum + (tx.amount || 0), 0),
      0
    ) / 100;

  const monthlyEarnings = await db.transaction.aggregate({
    where: {
      status: "COMPLETED",
      course: { tutorId: tutor.id },
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
    _sum: { amount: true },
  });

  const coursesSold = courses.reduce((sum, c) => sum + c.enrollments.length, 0);

  const averageRating = getAverageRating(courses.flatMap((c) => c.reviews));

  const currentMonthAmount = (currentMonthTx._sum.amount || 0) / 100;
  const lastMonthAmount = (lastMonthTx._sum.amount || 0) / 100;
  const earningsChange =
    lastMonthAmount > 0
      ? ((currentMonthAmount - lastMonthAmount) / lastMonthAmount) *
        100
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

  const allReviews = courses.flatMap((c) => c.reviews);

  const ratingsThisMonth = allReviews.filter(
    (r) => r.createdAt >= startOfMonth
  );
  const ratingsLastMonth = allReviews.filter(
    (r) => r.createdAt >= startOfLastMonth && r.createdAt < startOfMonth
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

    const sum = await db.transaction.aggregate({
      where: {
        status: "COMPLETED",
        course: { tutorId: tutor.id },
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      _sum: { amount: true },
    });

    earningsHistory.push({
      month: monthName,
      amount: (sum._sum.amount || 0) / 100,
    });
  }

  // --- Courses Summary ---
  const coursesSummary = courses.map((c) => ({
    id: c.id,
    title: c.title,
    students: c.enrollments.length,
    rating: getAverageRating(c.reviews),
    earnings:
      c.transactions.reduce((txSum, tx) => txSum + (tx.amount || 0), 0) / 100,
    status: c.status.toLowerCase(),
    thumbnail: c.thumbnail,
    lastUpdated: c.updatedAt.toLocaleDateString(),
  }));

  const upcomingMentorships: any = []; // db.mentorshipSession.findMany(...)
  const pendingProjects: any = []; // db.project.findMany(...)

  const recentActivity = [
    ...enrollments.map((e) => ({
      type: "enrollment" as const,
      message: `${e.user.name} enrolled in your course "${e.course.title}"`,
      time: formatDistanceToNow(e.enrolledAt, { addSuffix: true }),
    })),
    ...reviews.map((r) => ({
      type: "review" as const,
      message: `${r.user.name} rated "${r.course.title}" ${r.rating}⭐`,
      time: formatDistanceToNow(r.createdAt, { addSuffix: true }),
    })),
    ...mentorships.map((m) => ({
      type: "mentorship" as const,
      message: `New mentorship session scheduled: ${m.title}`,
      time: formatDistanceToNow(m.createdAt, { addSuffix: true }),
    })),
    ...projects.map((p) => ({
      type: "project" as const,
      message: `New project submission received.`,
      time: formatDistanceToNow(p.createdAt, { addSuffix: true }),
    })),
  ]
    .sort((a, b) => (a.time < b.time ? 1 : -1))
    .slice(0, 8);

  return {
    stats: {
      totalStudents,
      totalEarnings,
      monthlyEarnings: (monthlyEarnings._sum.amount || 0) / 100,
      earningsHistory,
      coursesSold,
      averageRating,
      totalReviews: courses.reduce((sum, c) => sum + c.reviews.length, 0),
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
