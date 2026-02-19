"use server";

import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { paystackInitialize } from "@/actions/paystack";
import { db } from "@/lib/db";

type BookingMode = "INSTANT" | "REQUEST";
type PackageCode = "NONE" | "STARTER_3" | "GROWTH_5";

const packageConfig: Record<
  Exclude<PackageCode, "NONE">,
  { sessions: number; discountPercent: number; label: string }
> = {
  STARTER_3: { sessions: 3, discountPercent: 10, label: "Starter Pack (3)" },
  GROWTH_5: { sessions: 5, discountPercent: 18, label: "Growth Pack (5)" },
};

export async function getMentorshipMarketplaceData() {
  const mentors = await db.tutor.findMany({
    where: { isVerified: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          image: true,
          bio: true,
          location: true,
          timezone: true,
          role: true,
        },
      },
    },
    orderBy: { totalReviews: "desc" },
    take: 24,
  });

  const platformMentors = await db.user.findMany({
    where: { role: "MENTOR", isActive: true },
    select: {
      id: true,
      name: true,
      avatar: true,
      image: true,
      bio: true,
      location: true,
      timezone: true,
      tutoredSessions: {
        select: { id: true },
      },
      tutorProfile: {
        select: {
          title: true,
          expertise: true,
          averageRating: true,
          totalReviews: true,
          hourlyRate: true,
          totalStudents: true,
        },
      },
    },
    take: 24,
  });

  const mentorMap = new Map<string, any>();

  mentors.forEach((mentor) => {
    mentorMap.set(mentor.user.id, {
      tutorUserId: mentor.user.id,
      name: mentor.user.name,
      avatar: mentor.user.image || mentor.user.avatar || "",
      title: mentor.title,
      rating: mentor.averageRating || 4.8,
      reviews: mentor.totalReviews,
      hourlyRate: mentor.hourlyRate || 0,
      location: mentor.user.location || "Remote",
      timezone: mentor.timezone || mentor.user.timezone || "UTC",
      bio: mentor.user.bio || "Experienced mentor helping learners grow faster.",
      specialties: mentor.expertise?.slice(0, 5) || [],
      sessions: mentor.totalStudents,
    });
  });

  platformMentors.forEach((mentor) => {
    if (mentorMap.has(mentor.id)) return;
    mentorMap.set(mentor.id, {
      tutorUserId: mentor.id,
      name: mentor.name,
      avatar: mentor.image || mentor.avatar || "",
      title: mentor.tutorProfile?.title || "Mentor",
      rating: mentor.tutorProfile?.averageRating || 4.8,
      reviews: mentor.tutorProfile?.totalReviews || 0,
      hourlyRate: mentor.tutorProfile?.hourlyRate || 15000,
      location: mentor.location || "Remote",
      timezone: mentor.timezone || "UTC",
      bio: mentor.bio || "Experienced mentor helping learners grow faster.",
      specialties: mentor.tutorProfile?.expertise?.slice(0, 5) || ["Mentorship"],
      sessions: mentor.tutorProfile?.totalStudents || mentor.tutoredSessions.length || 0,
    });
  });

  return {
    mentors: Array.from(mentorMap.values()),
  };
}

export async function beginMentorshipCheckout(input: {
  tutorUserId: string;
  topic: string;
  description?: string;
  scheduledAtIso: string;
  durationMinutes: number;
  bookingMode: BookingMode;
  packageCode?: PackageCode;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { error: "You need to be logged in to book mentorship." };
  }
  if (session.user.role === "ADMIN") {
    return { error: "Admins cannot book mentorship sessions." };
  }

  const tutor = await db.user.findFirst({
    where: { id: input.tutorUserId, role: { in: ["TUTOR", "MENTOR"] } },
    select: { id: true, name: true },
  });
  if (!tutor) {
    return { error: "Selected mentor is unavailable." };
  }

  const scheduledAt = new Date(input.scheduledAtIso);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { error: "Please select a valid session date/time." };
  }

  const duration = Math.max(30, Math.min(180, input.durationMinutes || 60));
  const tutorProfile = await db.tutor.findUnique({
    where: { userId: tutor.id },
    select: { hourlyRate: true },
  });
  const hourlyRate = tutorProfile?.hourlyRate || 15000;
  const basePrice = (hourlyRate / 60) * duration;

  const packageCode: PackageCode = input.packageCode || "NONE";
  const packageEntry =
    packageCode === "NONE" ? null : packageConfig[packageCode as "STARTER_3" | "GROWTH_5"];
  const sessionsCount = packageEntry?.sessions || 1;
  const discountPercent = packageEntry?.discountPercent || 0;
  const discountedTotal = basePrice * sessionsCount * (1 - discountPercent / 100);
  const totalAmount = Number(discountedTotal.toFixed(2));
  const tutorShareAmount = Number((totalAmount * 0.7).toFixed(2));
  const platformShareAmount = Number((totalAmount * 0.3).toFixed(2));

  const mentorshipSession = await db.mentorshipSession.create({
    data: {
      title: input.topic.trim() || "Mentorship Session",
      description: input.description?.trim() || null,
      duration,
      price: totalAmount,
      status: "SCHEDULED",
      scheduledAt,
      studentId: session.user.id,
      tutorId: tutor.id,
      notes:
        input.bookingMode === "REQUEST"
          ? "REQUEST_FIRST_BOOKING"
          : `INSTANT_BOOKING${packageEntry ? ` | ${packageEntry.label}` : ""}`,
    },
  });

  if (input.bookingMode === "REQUEST") {
    return { ok: true, mode: "REQUEST", mentorshipSessionId: mentorshipSession.id };
  }

  const reference = `mentorship_${randomUUID()}`;
  const tx = await db.transaction.create({
    data: {
      amount: totalAmount,
      status: "PENDING",
      paymentMethod: "paystack",
      description: `${packageEntry ? packageEntry.label : "One-off"} mentorship with ${tutor.name}`,
      userId: session.user.id,
      transactionId: reference,
      tutorShareAmount,
      platformShareAmount,
      metadata: {
        productType: "MENTORSHIP",
        mentorshipKind: packageEntry ? "PACKAGE" : "ONE_OFF",
        mentorshipSessionId: mentorshipSession.id,
        packageCode: packageCode === "NONE" ? null : packageCode,
        packageSessions: sessionsCount,
        tutorUserId: tutor.id,
      },
    },
  });

  const callbackBase = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const pay = await paystackInitialize({
    email: session.user.email,
    amountKobo: Math.round(tx.amount * 100),
    reference,
    callback_url: `${callbackBase}/mentorship/verify-payment?reference=${reference}`,
    metadata: tx.metadata as Record<string, unknown>,
  });

  return {
    ok: true,
    mode: "INSTANT",
    authorizationUrl: pay.authorization_url,
    mentorshipSessionId: mentorshipSession.id,
  };
}

export async function getStudentMentorshipSessions() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const sessions = await db.mentorshipSession.findMany({
    where: { studentId: session.user.id },
    orderBy: { scheduledAt: "asc" },
    include: {
      tutor: {
        select: { id: true, name: true, image: true, avatar: true, email: true },
      },
    },
    take: 100,
  });

  return { sessions };
}

export async function getTutorMentorshipSessions() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const sessions = await db.mentorshipSession.findMany({
    where: { tutorId: session.user.id },
    orderBy: { scheduledAt: "asc" },
    include: {
      student: {
        select: { id: true, name: true, image: true, avatar: true, email: true },
      },
    },
    take: 100,
  });

  return { sessions };
}

export async function updateTutorMentorshipSessionStatus(input: {
  mentorshipSessionId: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const existing = await db.mentorshipSession.findFirst({
    where: { id: input.mentorshipSessionId, tutorId: session.user.id },
    select: { id: true },
  });
  if (!existing) return { error: "Session not found." };

  await db.mentorshipSession.update({
    where: { id: input.mentorshipSessionId },
    data: {
      status: input.status as any,
      startedAt: input.status === "IN_PROGRESS" ? new Date() : undefined,
      endedAt: input.status === "COMPLETED" ? new Date() : undefined,
    },
  });

  return { success: true };
}

export async function getMentorshipAdminOverview() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  const [sessions, mentorshipRevenueAgg, mentorshipTxCount] = await Promise.all([
    db.mentorshipSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        tutor: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    }),
    db.transaction.aggregate({
      where: { metadata: { path: ["productType"], equals: "MENTORSHIP" } as any, status: "COMPLETED" },
      _sum: { amount: true },
    }),
    db.transaction.count({
      where: { metadata: { path: ["productType"], equals: "MENTORSHIP" } as any },
    }),
  ]);

  return {
    sessions,
    stats: {
      totalSessions: sessions.length,
      completedSessions: sessions.filter((s) => s.status === "COMPLETED").length,
      pendingSessions: sessions.filter((s) => s.status === "SCHEDULED").length,
      mentorshipRevenue: mentorshipRevenueAgg._sum.amount || 0,
      mentorshipTransactions: mentorshipTxCount,
    },
  };
}

export async function updateAdminMentorshipSessionStatus(input: {
  mentorshipSessionId: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  note?: string;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  const record = await db.mentorshipSession.findUnique({
    where: { id: input.mentorshipSessionId },
    select: { id: true, notes: true },
  });
  if (!record) return { error: "Session not found" };

  await db.mentorshipSession.update({
    where: { id: input.mentorshipSessionId },
    data: {
      status: input.status as any,
      notes: input.note ? `${record.notes || ""}\nADMIN: ${input.note}`.trim() : record.notes,
    },
  });

  return { success: true };
}

export async function getMentorshipFinanceSummary() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  const [completedTx, pendingTx, tutorShare] = await Promise.all([
    db.transaction.aggregate({
      where: {
        status: "COMPLETED",
        metadata: { path: ["productType"], equals: "MENTORSHIP" } as any,
      },
      _sum: { amount: true, platformShareAmount: true },
      _count: { _all: true },
    }),
    db.transaction.aggregate({
      where: {
        status: "PENDING",
        metadata: { path: ["productType"], equals: "MENTORSHIP" } as any,
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.transaction.aggregate({
      where: {
        status: "COMPLETED",
        metadata: { path: ["productType"], equals: "MENTORSHIP" } as any,
      },
      _sum: { tutorShareAmount: true },
    }),
  ]);

  return {
    success: true,
    mentorship: {
      completedCount: completedTx._count._all,
      pendingCount: pendingTx._count._all,
      grossRevenue: completedTx._sum.amount || 0,
      platformRevenue: completedTx._sum.platformShareAmount || 0,
      tutorPayouts: tutorShare._sum.tutorShareAmount || 0,
      pendingRevenue: pendingTx._sum.amount || 0,
    },
  };
}
