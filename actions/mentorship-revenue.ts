"use server";

import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { paystackInitialize } from "@/actions/paystack";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";

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
      status: input.bookingMode === "REQUEST" ? "PENDING_MENTOR_REVIEW" : "SCHEDULED",
      scheduledAt,
      studentId: session.user.id,
      tutorId: tutor.id,
      bookingMode: input.bookingMode,
      notes:
        input.bookingMode === "REQUEST"
          ? "REQUEST_FIRST_BOOKING"
          : `INSTANT_BOOKING${packageEntry ? ` | ${packageEntry.label}` : ""}`,
      approvalDeadline: input.bookingMode === "REQUEST" 
        ? new Date(Date.now() + 72 * 60 * 60 * 1000) 
        : null,
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

  const callbackBase = process.env.NEXT_PUBLIC_URL || "http://localhost:2026";
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
/**
 * Mentor approves a REQUEST mode booking
 * Updates session status to SCHEDULED and notifies student to proceed with payment
 */
export async function approveMentorshipRequest(sessionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const mentorshipSession = await db.mentorshipSession.findUnique({
    where: { id: sessionId },
  });

  if (!mentorshipSession) {
    return { error: "Session not found" };
  }

  if (mentorshipSession.tutorId !== session.user.id) {
    return { error: "You can only approve your own sessions" };
  }

  if (mentorshipSession.status !== "PENDING_MENTOR_REVIEW") {
    return { error: "This session is not pending approval" };
  }

  const updated = await db.mentorshipSession.update({
    where: { id: sessionId },
    data: {
      status: "SCHEDULED",
      notes: "APPROVED_BY_MENTOR",
    },
  });

  // Notify student that their request was approved
  notify.user(updated.studentId, {
    type: "success",
    title: "Mentorship Request Approved",
    message: `Your mentorship request for "${updated.title}" has been approved! Proceed to payment to confirm the booking.`,
    actionUrl: `/student/mentorship?approved=${sessionId}`,
    actionLabel: "View Session",
  });

  return { ok: true, session: updated };
}

/**
 * Mentor rejects a REQUEST mode booking
 * Updates session status to REJECTED and stores rejection reason
 */
export async function rejectMentorshipRequest(sessionId: string, reason: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const mentorshipSession = await db.mentorshipSession.findUnique({
    where: { id: sessionId },
  });

  if (!mentorshipSession) {
    return { error: "Session not found" };
  }

  if (mentorshipSession.tutorId !== session.user.id) {
    return { error: "You can only reject your own sessions" };
  }

  if (mentorshipSession.status !== "PENDING_MENTOR_REVIEW") {
    return { error: "This session is not pending approval" };
  }

  const updated = await db.mentorshipSession.update({
    where: { id: sessionId },
    data: {
      status: "REJECTED",
      approvalNotes: reason || null,
      rejectedAt: new Date(),
    },
  });

  // Notify student that their request was rejected
  notify.user(updated.studentId, {
    type: "warning",
    title: "Mentorship Request Declined",
    message: `Your mentorship request for "${updated.title}" was declined${
      reason ? ` with feedback: "${reason}"` : "."
    } You can request with another mentor.`,
    actionUrl: `/student/mentorship`,
    actionLabel: "Browse Mentors",
  });

  return { ok: true, session: updated };
}

/**
 * Process payment for an approved REQUEST mode booking
 * Creates transaction and initiates Paystack payment
 */
export async function proceedWithApprovedBookingPayment(sessionId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { error: "Unauthorized" };
  }

  const mentorshipSession = await db.mentorshipSession.findUnique({
    where: { id: sessionId },
    include: {
      tutor: { select: { id: true, name: true } },
    },
  });

  if (!mentorshipSession) {
    return { error: "Session not found" };
  }

  if (mentorshipSession.studentId !== session.user.id) {
    return { error: "You can only pay for your own sessions" };
  }

  if (mentorshipSession.status !== "SCHEDULED" || mentorshipSession.bookingMode !== "REQUEST") {
    return { error: "This session is not ready for payment" };
  }

  if (mentorshipSession.paymentStatus === "PAID") {
    return { error: "This session has already been paid for" };
  }

  const tutorShareAmount = Number((mentorshipSession.price * 0.7).toFixed(2));
  const platformShareAmount = Number((mentorshipSession.price * 0.3).toFixed(2));

  const reference = `mentorship_${randomUUID()}`;
  const tx = await db.transaction.create({
    data: {
      amount: mentorshipSession.price,
      status: "PENDING",
      paymentMethod: "paystack",
      description: `Mentorship with ${mentorshipSession.tutor.name}`,
      userId: session.user.id,
      transactionId: reference,
      tutorShareAmount,
      platformShareAmount,
      metadata: {
        productType: "MENTORSHIP",
        mentorshipKind: "REQUEST_APPROVED",
        mentorshipSessionId: mentorshipSession.id,
        tutorUserId: mentorshipSession.tutor.id,
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
    mode: "REQUEST_APPROVED_PAYMENT",
    authorizationUrl: pay.authorization_url,
    mentorshipSessionId: mentorshipSession.id,
  };
}

/**
 * Get pending mentorship approvals for a tutor
 */
export async function getTutorPendingApprovals() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const sessions = await db.mentorshipSession.findMany({
    where: {
      tutorId: session.user.id,
      status: "PENDING_MENTOR_REVIEW",
    },
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: { id: true, name: true, image: true, avatar: true, email: true },
      },
    },
  });

  return { sessions };
}

/**
 * Get approved REQUEST sessions ready for student payment
 */
export async function getApprovedSessionsReadyForPayment() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const sessions = await db.mentorshipSession.findMany({
    where: {
      studentId: session.user.id,
      status: "SCHEDULED",
      bookingMode: "REQUEST",
      paymentStatus: "PENDING",
    },
    orderBy: { createdAt: "desc" },
    include: {
      tutor: {
        select: { 
          id: true, 
          name: true, 
          image: true, 
          avatar: true, 
          email: true 
        },
      },
    },
  });

  return { sessions };
}

/**
 * Create a mentorship offering (pre-scheduled availability for students to book)
 */
export async function createMentorshipOffering(data: {
  title: string;
  description?: string;
  duration: number;
  price: number;
  courseId?: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify user is a tutor
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== "TUTOR" && user.role !== "MENTOR")) {
    throw new Error("Only tutors/mentors can create mentorship offerings");
  }

  // If courseId provided, verify the tutor owns the course
  if (data.courseId) {
    const course = await db.course.findUnique({
      where: { id: data.courseId },
      select: { tutorId: true, creatorId: true },
    });

    if (!course || (course.tutorId !== session.user.id && course.creatorId !== session.user.id)) {
      throw new Error("Course not found or you don't have permission to link to it");
    }
  }

  const offering = await db.mentorshipSession.create({
    data: {
      title: data.title,
      description: data.description,
      duration: data.duration,
      price: data.price,
      courseId: data.courseId || null,
      tutorId: session.user.id,
      studentId: session.user.id, // Placeholder: tutor is both student and tutor for offerings
      status: "SCHEDULED",
      bookingMode: "INSTANT",
      paymentStatus: "PENDING",
      scheduledAt: new Date(),
      isOffering: true, // Mark this as an offering, not an actual booking
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  return offering;
}

/**
 * Get all mentorship offerings created by the tutor
 */
export async function getTutorMentorshipOfferings() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const offerings = await db.mentorshipSession.findMany({
    where: {
      tutorId: session.user.id,
      isOffering: true, // Only get offerings, not bookings
      status: "SCHEDULED",
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return offerings;
}

/**
 * Get all courses created/taught by the tutor (for linking mentorship)
 */
export async function getTutorCourses() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const courses = await db.course.findMany({
    where: {
      OR: [
        { tutorId: session.user.id },
        { creatorId: session.user.id },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      thumbnail: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return courses;
}

/**
 * Delete a mentorship offering
 */
export async function deleteMentorshipOffering(offeringId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const offering = await db.mentorshipSession.findUnique({
    where: { id: offeringId },
    select: { tutorId: true, isOffering: true },
  });

  if (!offering) {
    throw new Error("Offering not found");
  }

  if (offering.tutorId !== session.user.id) {
    throw new Error("You don't have permission to delete this offering");
  }

  if (!offering.isOffering) {
    throw new Error("Can only delete offerings, not actual bookings");
  }

  await db.mentorshipSession.delete({
    where: { id: offeringId },
  });

  return { success: true };
}

