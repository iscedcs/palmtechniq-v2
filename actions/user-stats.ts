"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { UserRole } from "@/types/user";

type RoleStatIcon = "book-open" | "trophy" | "star" | "users" | "wallet";

export type RoleStat = {
  label: string;
  value: string;
  icon: RoleStatIcon;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

const getStudentStats = async (userId: string): Promise<RoleStat[]> => {
  const [enrolledCount, completedCount, certificatesCount] =
    await Promise.all([
      db.enrollment.count({
        where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
      }),
      db.enrollment.count({
        where: { userId, status: "COMPLETED" },
      }),
      db.certificate.count({
        where: { userId, isRevoked: false },
      }),
    ]);

  return [
    {
      label: "Courses Enrolled",
      value: enrolledCount.toString(),
      icon: "book-open",
    },
    {
      label: "Completed",
      value: completedCount.toString(),
      icon: "trophy",
    },
    {
      label: "Certificates",
      value: certificatesCount.toString(),
      icon: "star",
    },
  ];
};

const getTutorStats = async (userId: string): Promise<RoleStat[] | null> => {
  const tutor = await db.tutor.findFirst({ where: { userId } });
  if (!tutor) return null;

  const [coursesCount, studentsCount, ratingAggregate] = await Promise.all([
    db.course.count({ where: { tutorId: tutor.id } }),
    db.enrollment.count({ where: { course: { tutorId: tutor.id } } }),
    db.review.aggregate({
      where: { course: { tutorId: tutor.id } },
      _avg: { rating: true },
    }),
  ]);

  const avgRating = ratingAggregate._avg.rating ?? 0;

  return [
    {
      label: "Total Students",
      value: studentsCount.toString(),
      icon: "users",
    },
    {
      label: "Courses Created",
      value: coursesCount.toString(),
      icon: "book-open",
    },
    {
      label: "Rating",
      value: Number(avgRating.toFixed(1)).toString(),
      icon: "star",
    },
  ];
};

const getAdminStats = async (): Promise<RoleStat[]> => {
  const [totalUsers, activeCourses, revenueAggregate] = await Promise.all([
    db.user.count(),
    db.course.count({ where: { status: "PUBLISHED" } }),
    db.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  const revenue = revenueAggregate._sum.amount ?? 0;

  return [
    {
      label: "Total Users",
      value: totalUsers.toLocaleString("en-NG"),
      icon: "users",
    },
    {
      label: "Active Courses",
      value: activeCourses.toLocaleString("en-NG"),
      icon: "book-open",
    },
    {
      label: "Revenue",
      value: formatCurrency(revenue),
      icon: "wallet",
    },
  ];
};

export async function getUserRoleStats() {
  const session = await auth();
  if (!session?.user?.id) {
    return { stats: null };
  }

  const role = session.user.role as UserRole;

  if (role === "STUDENT") {
    return { stats: await getStudentStats(session.user.id) };
  }

  if (role === "TUTOR") {
    return { stats: await getTutorStats(session.user.id) };
  }

  if (role === "ADMIN") {
    return { stats: await getAdminStats() };
  }

  return { stats: null };
}
