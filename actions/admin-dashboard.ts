"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { generatePasswordResetToken } from "@/lib/token";
import { Prisma, UserRole } from "@prisma/client";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

const formatTransactionCurrency = (amount: number) =>
  formatCurrency(amount / 100);

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export async function getAdminDashboardData() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeCourses,
    draftCourses,
    suspendedUsers,
    monthlyRevenueAgg,
    totalEnrollments,
    completedEnrollments,
    users,
    tutorCourseCounts,
    studentEnrollmentCounts,
    lineItemAgg,
    reviewAgg,
    courseEnrollmentAgg,
    roleCounts,
    paidWithdrawalsAgg,
    pendingWithdrawalsAgg,
    pendingRevenueAgg,
    courseRows,
    courseEnrollmentCounts,
    courseRevenueAgg,
  ] = await Promise.all([
    db.user.count(),
    db.course.count({ where: { status: "PUBLISHED" } }),
    db.course.count({ where: { status: "DRAFT" } }),
    db.user.count({ where: { isActive: false } }),
    db.transaction.aggregate({
      where: { status: "COMPLETED", paymentDate: { gte: monthStart } },
      _sum: { amount: true },
    }),
    db.enrollment.count(),
    db.enrollment.count({ where: { status: "COMPLETED" } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        isActive: true,
      },
    }),
    db.course.groupBy({
      by: ["tutorId"],
      _count: { _all: true },
    }),
    db.enrollment.groupBy({
      by: ["userId"],
      _count: { _all: true },
    }),
    db.transactionLineItem.groupBy({
      by: ["courseId"],
      _sum: { totalAmount: true },
      _count: { _all: true },
      where: { transaction: { status: "COMPLETED" } },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 5,
    }),
    db.review.groupBy({
      by: ["courseId"],
      _avg: { rating: true },
    }),
    db.enrollment.groupBy({
      by: ["courseId", "status"],
      _count: { _all: true },
    }),
    db.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    db.withdrawalRequest.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    db.withdrawalRequest.aggregate({
      where: { status: { in: ["PENDING", "APPROVED"] } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
    }),
    db.course.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        status: true,
        basePrice: true,
        currentPrice: true,
        price: true,
        createdAt: true,
        tutor: { select: { user: { select: { name: true } } } },
      },
    }),
    db.enrollment.groupBy({
      by: ["courseId"],
      _count: { _all: true },
    }),
    db.transactionLineItem.groupBy({
      by: ["courseId"],
      _sum: { totalAmount: true },
      where: { transaction: { status: "COMPLETED" } },
    }),
  ]);

  const monthlyRevenue = monthlyRevenueAgg._sum.amount ?? 0;
  const completionRate =
    totalEnrollments === 0
      ? 0
      : Math.round((completedEnrollments / totalEnrollments) * 1000) / 10;

  const statsCards = [
    {
      title: "Total Users",
      value: totalUsers.toLocaleString("en-NG"),
      change: "",
      trend: "up",
      icon: "Users",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Courses",
      value: activeCourses.toLocaleString("en-NG"),
      change: "",
      trend: "up",
      icon: "BookOpen",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Monthly Revenue",
      value: formatTransactionCurrency(monthlyRevenue),
      change: "",
      trend: "up",
      icon: "NairaSign",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Completion Rate",
      value: `${completionRate}%`,
      change: "",
      trend: "up",
      icon: "TrendingUp",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  const tutorProfiles = await db.tutor.findMany({
    where: { userId: { in: users.map((u) => u.id) } },
    select: { id: true, userId: true },
  });
  const tutorByUserId = new Map(tutorProfiles.map((t) => [t.userId, t.id]));
  const courseCountByTutor = new Map(
    tutorCourseCounts.map((entry) => [entry.tutorId, entry._count._all]),
  );
  const enrollmentCountByUser = new Map(
    studentEnrollmentCounts.map((entry) => [entry.userId, entry._count._all]),
  );

  const recentUsers = users.map((user) => {
    let courses = 0;
    if (user.role === "TUTOR") {
      const tutorId = tutorByUserId.get(user.id);
      courses = tutorId ? (courseCountByTutor.get(tutorId) ?? 0) : 0;
    } else if (user.role === "STUDENT") {
      courses = enrollmentCountByUser.get(user.id) ?? 0;
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      joinDate: formatDate(user.createdAt),
      status: user.isActive ? "active" : "suspended",
      courses,
    };
  });

  const topCourseIds = lineItemAgg.map((entry) => entry.courseId);
  const topCoursesRaw = topCourseIds.length
    ? await db.course.findMany({
        where: { id: { in: topCourseIds } },
        select: {
          id: true,
          title: true,
          tutor: { select: { user: { select: { name: true } } } },
        },
      })
    : [];

  const reviewByCourse = new Map(
    reviewAgg.map((entry) => [entry.courseId, entry._avg.rating ?? 0]),
  );

  const enrollmentByCourse = new Map<
    string,
    { total: number; completed: number }
  >();
  courseEnrollmentAgg.forEach((entry) => {
    const current = enrollmentByCourse.get(entry.courseId) || {
      total: 0,
      completed: 0,
    };
    const count = entry._count._all;
    current.total += count;
    if (entry.status === "COMPLETED") {
      current.completed += count;
    }
    enrollmentByCourse.set(entry.courseId, current);
  });

  const topCourses = lineItemAgg.map((entry) => {
    const course = topCoursesRaw.find((c) => c.id === entry.courseId);
    const revenue = entry._sum.totalAmount ?? 0;
    const rating = reviewByCourse.get(entry.courseId) ?? 0;
    const completionInfo = enrollmentByCourse.get(entry.courseId) || {
      total: 0,
      completed: 0,
    };
    const completion =
      completionInfo.total === 0
        ? 0
        : Math.round((completionInfo.completed / completionInfo.total) * 100);
    return {
      id: entry.courseId,
      title: course?.title || "Course",
      instructor: course?.tutor?.user?.name || "Tutor",
      students: completionInfo.total,
      revenue: formatTransactionCurrency(revenue),
      rating: Number(rating.toFixed(1)),
      completion,
    };
  });

  const roleCountMap = new Map(
    roleCounts.map((entry) => [entry.role, entry._count._all]),
  );
  const systemAlerts = [];
  if (draftCourses > 0) {
    systemAlerts.push({
      id: `alert-draft-${draftCourses}`,
      type: "warning" as const,
      title: "Courses awaiting approval",
      message: `${draftCourses} course(s) are in draft status and require admin review.`,
      timestamp: formatDate(new Date()),
    });
  }
  if (pendingWithdrawalsAgg._sum.amount) {
    systemAlerts.push({
      id: "alert-withdrawals",
      type: "info" as const,
      title: "Pending withdrawal requests",
      message: "There are withdrawal requests waiting for approval.",
      timestamp: formatDate(new Date()),
    });
  }
  if (suspendedUsers > 0) {
    systemAlerts.push({
      id: `alert-suspended-${suspendedUsers}`,
      type: "warning" as const,
      title: "Suspended users",
      message: `${suspendedUsers} user(s) are currently suspended.`,
      timestamp: formatDate(new Date()),
    });
  }
  const analyticsStats = [
    {
      label: "Total Revenue",
      value: formatCurrency(monthlyRevenue),
    },
    {
      label: "Total Payouts",
      value: formatCurrency(paidWithdrawalsAgg._sum.amount ?? 0),
    },
    {
      label: "Pending Payouts",
      value: formatCurrency(pendingWithdrawalsAgg._sum.amount ?? 0),
    },
    {
      label: "Pending Revenue",
      value: formatTransactionCurrency(pendingRevenueAgg._sum.amount ?? 0),
    },
    {
      label: "Active Tutors",
      value: (roleCountMap.get("TUTOR") ?? 0).toLocaleString("en-NG"),
    },
    {
      label: "Active Students",
      value: (roleCountMap.get("STUDENT") ?? 0).toLocaleString("en-NG"),
    },
    {
      label: "Admins",
      value: (roleCountMap.get("ADMIN") ?? 0).toLocaleString("en-NG"),
    },
  ];

  const enrollmentCountByCourse = new Map(
    courseEnrollmentCounts.map((entry) => [entry.courseId, entry._count._all]),
  );
  const revenueByCourse = new Map(
    courseRevenueAgg.map((entry) => [
      entry.courseId,
      entry._sum.totalAmount ?? 0,
    ]),
  );
  const courses = courseRows.map((course) => ({
    id: course.id,
    title: course.title,
    status: course.status,
    price: course.currentPrice ?? course.basePrice ?? course.price ?? 0,
    revenue: (revenueByCourse.get(course.id) ?? 0) / 100,
    enrollments: enrollmentCountByCourse.get(course.id) ?? 0,
    tutor: course.tutor?.user?.name || "Tutor",
    createdAt: formatDate(course.createdAt),
  }));

  const usersTable = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    status: user.isActive ? "active" : "suspended",
    joinDate: formatDate(user.createdAt),
  }));

  return {
    success: true,
    statsCards,
    recentUsers,
    topCourses,
    systemAlerts,
    analyticsStats,
    usersTable,
    courses,
  };
}

export async function getAdminUsersPageData(params?: {
  page?: number;
  pageSize?: number;
  role?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  const pageSize =
    typeof params?.pageSize === "number" && params.pageSize > 0
      ? Math.min(params.pageSize, 100)
      : 20;
  const requestedPage =
    typeof params?.page === "number" && params.page > 0 ? params.page : 1;
  const roleValues = ["USER", "STUDENT", "MENTOR", "TUTOR", "ADMIN"] as const;
  const normalizedRole = roleValues.includes(params?.role as UserRole)
    ? (params?.role as UserRole)
    : undefined;
  const normalizedSearch = params?.search?.trim();

  const where = {
    ...(normalizedRole ? { role: normalizedRole } : {}),
    ...(normalizedSearch
      ? {
          OR: [
            {
              name: {
                contains: normalizedSearch,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              email: {
                contains: normalizedSearch,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {}),
  };

  const [totalUsers, activeUsers, suspendedUsers, roleCounts, filteredCount] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { isActive: false } }),
      db.user.groupBy({ by: ["role"], _count: { _all: true } }),
      db.user.count({ where }),
    ]);

  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      isActive: true,
    },
  });

  const userIds = users.map((user) => user.id);
  const tutorProfiles = userIds.length
    ? await db.tutor.findMany({
        where: { userId: { in: userIds } },
        select: { id: true, userId: true },
      })
    : [];
  const tutorByUserId = new Map(tutorProfiles.map((t) => [t.userId, t.id]));
  const tutorIds = tutorProfiles.map((t) => t.id);

  const [courseCounts, enrollmentCounts] = await Promise.all([
    tutorIds.length
      ? db.course.groupBy({
          by: ["tutorId"],
          _count: { _all: true },
          where: { tutorId: { in: tutorIds } },
        })
      : [],
    userIds.length
      ? db.enrollment.groupBy({
          by: ["userId"],
          _count: { _all: true },
          where: { userId: { in: userIds } },
        })
      : [],
  ]);

  const courseCountByTutor = new Map(
    courseCounts.map((entry) => [entry.tutorId, entry._count._all]),
  );
  const enrollmentCountByUser = new Map(
    enrollmentCounts.map((entry) => [entry.userId, entry._count._all]),
  );

  const roleCountMap = new Map(
    roleCounts.map((entry) => [entry.role, entry._count._all]),
  );

  const usersTable = users.map((user) => {
    const tutorId = tutorByUserId.get(user.id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      status: user.isActive ? "active" : "suspended",
      joinDate: formatDate(user.createdAt),
      courses: tutorId ? (courseCountByTutor.get(tutorId) ?? 0) : 0,
      enrollments: enrollmentCountByUser.get(user.id) ?? 0,
    };
  });

  return {
    success: true,
    stats: {
      totalUsers,
      activeUsers,
      suspendedUsers,
      admins: roleCountMap.get("ADMIN") ?? 0,
      mentors: roleCountMap.get("MENTOR") ?? 0,
      tutors: roleCountMap.get("TUTOR") ?? 0,
      students: roleCountMap.get("STUDENT") ?? 0,
    },
    users: usersTable,
    pagination: {
      page,
      pageSize,
      totalPages,
      totalCount: filteredCount,
    },
  };
}

export async function getAdminUserProfile(userId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }
  if (!userId) {
    return { error: "Invalid user" };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      bankName: true,
      accountNumber: true,
      recipientCode: true,
    },
  });

  if (!user) {
    return { error: "User not found" };
  }

  const tutorProfile = await db.tutor.findUnique({
    where: { userId },
    select: { id: true },
  });

  const [coursesCount, enrollmentsCount] = await Promise.all([
    tutorProfile
      ? db.course.count({ where: { tutorId: tutorProfile.id } })
      : Promise.resolve(0),
    db.enrollment.count({ where: { userId } }),
  ]);

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      status: user.isActive ? "active" : "suspended",
      joinDate: formatDate(user.createdAt),
      bankName: user.bankName,
      accountNumber: user.accountNumber,
      recipientCode: user.recipientCode,
    },
    counts: {
      courses: coursesCount,
      enrollments: enrollmentsCount,
    },
  };
}

export async function getAdminCoursesPageData(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  const pageSize =
    typeof params?.pageSize === "number" && params.pageSize > 0
      ? Math.min(params.pageSize, 100)
      : 20;
  const requestedPage =
    typeof params?.page === "number" && params.page > 0 ? params.page : 1;
  const statusValues = ["DRAFT", "PUBLISHED", "ARCHIVED", "SUSPENDED"] as const;
  const normalizedStatus = statusValues.includes(
    params?.status as (typeof statusValues)[number],
  )
    ? (params?.status as (typeof statusValues)[number])
    : undefined;
  const normalizedSearch = params?.search?.trim();

  const where = {
    ...(normalizedStatus ? { status: normalizedStatus } : {}),
    ...(normalizedSearch
      ? {
          title: {
            contains: normalizedSearch,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {}),
  };

  const [totalCourses, statusCounts, filteredCount] = await Promise.all([
    db.course.count(),
    db.course.groupBy({ by: ["status"], _count: { _all: true } }),
    db.course.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const courses = await db.course.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      title: true,
      status: true,
      basePrice: true,
      currentPrice: true,
      price: true,
      createdAt: true,
      slug: true,
      tutor: { select: { user: { select: { name: true } } } },
    },
  });

  const courseIds = courses.map((course) => course.id);
  const [enrollmentCounts, revenueAgg] = await Promise.all([
    courseIds.length
      ? db.enrollment.groupBy({
          by: ["courseId"],
          _count: { _all: true },
          where: { courseId: { in: courseIds } },
        })
      : [],
    courseIds.length
      ? db.transactionLineItem.groupBy({
          by: ["courseId"],
          _sum: { totalAmount: true },
          where: { courseId: { in: courseIds } },
        })
      : [],
  ]);

  const enrollmentCountByCourse = new Map(
    enrollmentCounts.map((entry) => [entry.courseId, entry._count._all]),
  );
  const revenueByCourse = new Map(
    revenueAgg.map((entry) => [entry.courseId, entry._sum.totalAmount ?? 0]),
  );

  const coursesTable = courses.map((course) => ({
    id: course.id,
    title: course.title,
    status: course.status,
    price: course.currentPrice ?? course.basePrice ?? course.price ?? 0,
    revenue: (revenueByCourse.get(course.id) ?? 0) / 100,
    enrollments: enrollmentCountByCourse.get(course.id) ?? 0,
    tutor: course.tutor?.user?.name || "Tutor",
    createdAt: formatDate(course.createdAt),
    slug: course.slug ?? null,
  }));

  const statusCountMap = new Map(
    statusCounts.map((entry) => [entry.status, entry._count._all]),
  );

  return {
    success: true,
    stats: {
      totalCourses,
      draft: statusCountMap.get("DRAFT") ?? 0,
      published: statusCountMap.get("PUBLISHED") ?? 0,
      archived: statusCountMap.get("ARCHIVED") ?? 0,
      suspended: statusCountMap.get("SUSPENDED") ?? 0,
    },
    courses: coursesTable,
    pagination: {
      page,
      pageSize,
      totalPages,
      totalCount: filteredCount,
    },
  };
}

export async function updateUserRole({
  userId,
  role,
}: {
  userId: string;
  role: "USER" | "STUDENT" | "MENTOR" | "TUTOR" | "ADMIN";
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  if (!userId || !role) {
    return { error: "Invalid request" };
  }

  // Get the current user
  const existingUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!existingUser) {
    return { error: "User not found" };
  }

  // Only check admin count if you're removing ADMIN from an admin
  if (existingUser.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await db.user.count({
      where: { role: "ADMIN" },
    });

    if (adminCount <= 1) {
      return { error: "Cannot remove the last admin" };
    }
  }

  await db.user.update({
    where: { id: userId },
    data: { role },
  });
  console.log("Updating role to:", role);

  return { success: true };
}

// export async function updateUserRole({
//   userId,
//   role,
// }: {
//   userId: string;
//   role: "USER" | "STUDENT" | "MENTOR" | "TUTOR" | "ADMIN";
// }) {
//   const session = await auth();
//   if (!session?.user?.id) {
//     return { error: "Unauthorized" };
//   }
//   if (session.user.role !== "ADMIN") {
//     return { error: "Forbidden" };
//   }

//   if (!userId || !role) {
//     return { error: "Invalid request" };
//   }

//   if (role !== "ADMIN") {
//     const adminCount = await db.user.count({ where: { role: "ADMIN" } });
//     if (adminCount <= 1) {
//       return { error: "Cannot remove the last admin" };
//     }
//   }

//   const existingUser = await db.user.findUnique({
//     where: { id: userId },
//     select: { role: true },
//   });

//   if (!existingUser) {
//     return { error: "User not found" };
//   }

//   // Only check admin count if you're removing ADMIN from an admin
//   if (existingUser.role === "ADMIN" && role !== "ADMIN") {
//     const adminCount = await db.user.count({
//       where: { role: "ADMIN" },
//     });

//     if (adminCount <= 1) {
//       return { error: "Cannot remove the last admin" };
//     }
//   }

//   await db.user.update({
//     where: { id: userId },
//     data: { role },
//   });

//   return { success: true };
// }

export async function createUserByAdmin({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: "USER" | "STUDENT" | "MENTOR" | "TUTOR" | "ADMIN";
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  const normalizedName = name?.trim();
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedName || !normalizedEmail || !role) {
    return { error: "Name, email, and role are required" };
  }

  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existingUser) {
    return { error: "A user with this email already exists" };
  }

  // Create a temporary password and force user-set password via reset email.
  const temporaryPassword = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const hashedPassword = await hashPassword(temporaryPassword);

  await db.user.create({
    data: {
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: role as UserRole,
    },
  });

  const resetToken = await generatePasswordResetToken(normalizedEmail);
  const { sendPasswordResetToken } = await import("@/lib/mail");
  await sendPasswordResetToken(resetToken.email, resetToken.token);

  return { success: true };
}

export async function updateUserStatus({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  await db.user.update({
    where: { id: userId },
    data: { isActive },
  });

  return { success: true };
}

export async function updateCourseStatus({
  courseId,
  status,
}: {
  courseId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED";
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  await db.course.update({
    where: { id: courseId },
    data: { status },
  });

  return { success: true };
}
