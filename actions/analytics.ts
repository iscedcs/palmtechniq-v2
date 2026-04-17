"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

// ─── Auth Guard ──────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERIOR") {
    throw new Error("Forbidden");
  }
  return session.user;
}

// ─── Types ───────────────────────────────────────────────────────

export type DateRange = "7d" | "30d" | "90d" | "all";

function getDateFilter(range: DateRange): Date | undefined {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "all":
      return undefined;
  }
}

// ─── Dashboard Overview ─────────────────────────────────────────

export async function getAnalyticsOverview(range: DateRange = "30d") {
  await requireAdmin();

  const since = getDateFilter(range);
  const dateFilter = since ? { createdAt: { gte: since } } : {};

  const [
    totalEvents,
    uniqueUsers,
    topEvents,
    categoryBreakdown,
    deviceBreakdown,
    browserBreakdown,
    recentEvents,
  ] = await Promise.all([
    // Total events
    db.platformEvent.count({ where: dateFilter }),

    // Unique users who performed actions
    db.platformEvent.groupBy({
      by: ["userId"],
      where: { ...dateFilter, userId: { not: null } },
    }),

    // Top events by count
    db.platformEvent.groupBy({
      by: ["event"],
      where: dateFilter,
      _count: { event: true },
      orderBy: { _count: { event: "desc" } },
      take: 15,
    }),

    // Category breakdown
    db.platformEvent.groupBy({
      by: ["category"],
      where: dateFilter,
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    }),

    // Device breakdown
    db.platformEvent.groupBy({
      by: ["device"],
      where: { ...dateFilter, device: { not: null } },
      _count: { device: true },
      orderBy: { _count: { device: "desc" } },
    }),

    // Browser breakdown
    db.platformEvent.groupBy({
      by: ["browser"],
      where: { ...dateFilter, browser: { not: null } },
      _count: { browser: true },
      orderBy: { _count: { browser: "desc" } },
    }),

    // Recent events (latest 50)
    db.platformEvent.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        event: true,
        category: true,
        action: true,
        path: true,
        device: true,
        browser: true,
        createdAt: true,
        value: true,
        entityType: true,
        entityId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    }),
  ]);

  return {
    totalEvents,
    uniqueUsers: uniqueUsers.length,
    topEvents: topEvents.map((e: any) => ({
      event: e.event,
      count: e._count.event,
    })),
    categoryBreakdown: categoryBreakdown.map((c: any) => ({
      category: c.category,
      count: c._count.category,
    })),
    deviceBreakdown: deviceBreakdown.map((d: any) => ({
      device: d.device!,
      count: d._count.device,
    })),
    browserBreakdown: browserBreakdown.map((b: any) => ({
      browser: b.browser!,
      count: b._count.browser,
    })),
    recentEvents,
  };
}

// ─── Conversion Funnel ──────────────────────────────────────────

export async function getConversionFunnel(range: DateRange = "30d") {
  await requireAdmin();

  const since = getDateFilter(range);
  const dateFilter = since ? { createdAt: { gte: since } } : {};

  const [
    pageViews,
    courseViews,
    addedToCart,
    checkoutStarted,
    checkoutCompleted,
    enrolled,
  ] = await Promise.all([
    db.platformEvent.count({ where: { ...dateFilter, event: "page_viewed" } }),
    db.platformEvent.count({
      where: { ...dateFilter, event: "course_viewed" },
    }),
    db.platformEvent.count({
      where: { ...dateFilter, event: "added_to_cart" },
    }),
    db.platformEvent.count({
      where: { ...dateFilter, event: "checkout_started" },
    }),
    db.platformEvent.count({
      where: { ...dateFilter, event: "checkout_completed" },
    }),
    db.platformEvent.count({
      where: { ...dateFilter, event: "course_enrolled" },
    }),
  ]);

  return {
    steps: [
      { name: "Page Views", count: pageViews },
      { name: "Course Views", count: courseViews },
      { name: "Added to Cart", count: addedToCart },
      { name: "Checkout Started", count: checkoutStarted },
      { name: "Payment Completed", count: checkoutCompleted },
      { name: "Enrolled", count: enrolled },
    ],
  };
}

// ─── Revenue Analytics ──────────────────────────────────────────

export async function getRevenueAnalytics(range: DateRange = "30d") {
  await requireAdmin();

  const since = getDateFilter(range);
  const dateFilter = since ? { createdAt: { gte: since } } : {};

  const revenueEvents = await db.platformEvent.findMany({
    where: {
      ...dateFilter,
      event: { in: ["checkout_completed", "program_enrollment_paid"] },
      value: { not: null },
    },
    select: {
      event: true,
      value: true,
      createdAt: true,
      entityType: true,
      metadata: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const totalRevenue = revenueEvents.reduce(
    (sum: any, e: any) => sum + (e.value || 0),
    0,
  );
  const courseRevenue = revenueEvents
    .filter((e: any) => e.event === "checkout_completed")
    .reduce((sum: any, e: any) => sum + (e.value || 0), 0);
  const programRevenue = revenueEvents
    .filter((e: any) => e.event === "program_enrollment_paid")
    .reduce((sum: any, e: any) => sum + (e.value || 0), 0);

  // Daily revenue aggregation
  const dailyRevenue = new Map<string, number>();
  for (const e of revenueEvents) {
    const day = e.createdAt.toISOString().split("T")[0]!;
    dailyRevenue.set(day, (dailyRevenue.get(day) || 0) + (e.value || 0));
  }

  return {
    totalRevenue,
    courseRevenue,
    programRevenue,
    transactionCount: revenueEvents.length,
    dailyRevenue: Array.from(dailyRevenue.entries()).map(([date, amount]) => ({
      date,
      amount,
    })),
  };
}

// ─── User Activity Timeline ─────────────────────────────────────

export async function getActivityTimeline(range: DateRange = "30d") {
  await requireAdmin();

  const since = getDateFilter(range);
  const dateFilter = since ? { createdAt: { gte: since } } : {};

  // Get daily event counts
  const events = await db.platformEvent.findMany({
    where: dateFilter,
    select: { createdAt: true, category: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyActivity = new Map<
    string,
    { total: number; byCategory: Record<string, number> }
  >();

  for (const e of events) {
    const day = e.createdAt.toISOString().split("T")[0]!;
    const entry = dailyActivity.get(day) || { total: 0, byCategory: {} };
    entry.total += 1;
    entry.byCategory[e.category] = (entry.byCategory[e.category] || 0) + 1;
    dailyActivity.set(day, entry);
  }

  return {
    timeline: Array.from(dailyActivity.entries()).map(([date, data]) => ({
      date,
      total: data.total,
      ...data.byCategory,
    })),
  };
}

// ─── Top Courses ────────────────────────────────────────────────

export async function getTopCourses(range: DateRange = "30d") {
  await requireAdmin();

  const since = getDateFilter(range);
  const dateFilter = since ? { createdAt: { gte: since } } : {};

  const courseEvents = await db.platformEvent.groupBy({
    by: ["entityId"],
    where: {
      ...dateFilter,
      entityType: "course",
      entityId: { not: null },
    },
    _count: { entityId: true },
    orderBy: { _count: { entityId: "desc" } },
    take: 20,
  });

  const courseIds = courseEvents.map((e: any) => e.entityId!);
  const courses = await db.course.findMany({
    where: { id: { in: courseIds } },
    select: {
      id: true,
      title: true,
      thumbnail: true,
      currentPrice: true,
      basePrice: true,
      price: true,
    },
  });

  const courseMap = new Map(courses.map((c: any) => [c.id, c]));

  // Get event breakdown per course
  const courseEventBreakdown = await db.platformEvent.groupBy({
    by: ["entityId", "event"],
    where: {
      ...dateFilter,
      entityType: "course",
      entityId: { in: courseIds },
    },
    _count: { event: true },
  });

  const breakdownMap = new Map<string, Record<string, number>>();
  for (const item of courseEventBreakdown) {
    const existing = breakdownMap.get(item.entityId!) || {};
    existing[item.event] = item._count.event;
    breakdownMap.set(item.entityId!, existing);
  }

  return {
    courses: courseEvents.map((e: any) => {
      const course = courseMap.get(e.entityId!) as
        | (typeof courses)[number]
        | undefined;
      return {
        id: e.entityId!,
        title: course?.title || "Unknown",
        thumbnail: course?.thumbnail,
        price: course?.currentPrice ?? course?.basePrice ?? course?.price ?? 0,
        totalInteractions: e._count.entityId,
        breakdown: breakdownMap.get(e.entityId!) || {},
      };
    }),
  };
}

// ─── User Signups Over Time ─────────────────────────────────────

export async function getSignupAnalytics(range: DateRange = "30d") {
  await requireAdmin();

  const since = getDateFilter(range);
  const dateFilter = since ? { createdAt: { gte: since } } : {};

  const signups = await db.platformEvent.findMany({
    where: { ...dateFilter, event: "user_signed_up" },
    select: { createdAt: true, metadata: true },
    orderBy: { createdAt: "asc" },
  });

  const logins = await db.platformEvent.count({
    where: { ...dateFilter, event: "user_logged_in" },
  });

  const dailySignups = new Map<string, number>();
  for (const s of signups) {
    const day = s.createdAt.toISOString().split("T")[0]!;
    dailySignups.set(day, (dailySignups.get(day) || 0) + 1);
  }

  return {
    totalSignups: signups.length,
    totalLogins: logins,
    dailySignups: Array.from(dailySignups.entries()).map(([date, count]) => ({
      date,
      count,
    })),
  };
}
