"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PromotionStatus, PromotionType } from "@prisma/client";
import { randomUUID } from "crypto";
import { paystackInitialize } from "./paystack";

// ─── Platform Settings Helpers ──────────────────────────────────────────────

async function getPlatformSettingsRecord() {
  let record = await db.platformSettings.findUnique({
    where: { id: "platform_settings" },
  });
  if (!record) {
    record = await db.platformSettings.create({
      data: { id: "platform_settings", settings: {} },
    });
  }
  return record;
}

export async function getPromotionSettings() {
  const record = await getPlatformSettingsRecord();
  const settings = record.settings as Record<string, unknown>;
  return {
    promotionsEnabled: (settings.promotionsEnabled as boolean) ?? true,
    tutorPromotionFee: (settings.tutorPromotionFee as number) ?? 5000,
    maxActivePromotions: (settings.maxActivePromotions as number) ?? 5,
    defaultPromotionDays: (settings.defaultPromotionDays as number) ?? 7,
  };
}

export async function updatePromotionSettings(data: {
  promotionsEnabled?: boolean;
  tutorPromotionFee?: number;
  maxActivePromotions?: number;
  defaultPromotionDays?: number;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const record = await getPlatformSettingsRecord();
  const current = record.settings as Record<string, unknown>;

  await db.platformSettings.update({
    where: { id: "platform_settings" },
    data: {
      settings: { ...current, ...data },
    },
  });

  return { success: true };
}

// ─── Scheduling Helpers ─────────────────────────────────────────────────────

export async function getNextAvailableSlot(durationDays: number) {
  const now = new Date();

  // Find the last scheduled promotion that ends in the future
  const lastScheduled = await db.coursePromotion.findFirst({
    where: {
      status: { in: [PromotionStatus.ACTIVE, PromotionStatus.PENDING] },
      endDate: { gte: now },
    },
    orderBy: { endDate: "desc" },
    select: { endDate: true },
  });

  const startDate = lastScheduled
    ? new Date(lastScheduled.endDate.getTime() + 60 * 60 * 1000) // 1 hour gap
    : now;

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);

  return { startDate, endDate };
}

export async function getPromotionSchedule() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const now = new Date();
  const promotions = await db.coursePromotion.findMany({
    where: {
      status: { in: [PromotionStatus.ACTIVE, PromotionStatus.PENDING] },
      endDate: { gte: now },
    },
    orderBy: { startDate: "asc" },
    include: {
      course: {
        select: { id: true, title: true, thumbnail: true },
      },
      promoter: {
        select: { name: true },
      },
    },
  });

  return { success: true, schedule: promotions };
}

// ─── Get Active Promotion (for popup) ───────────────────────────────────────

export async function getActivePromotion() {
  const settings = await getPromotionSettings();
  if (!settings.promotionsEnabled) return null;

  const now = new Date();

  const promotion = await db.coursePromotion.findFirst({
    where: {
      status: PromotionStatus.ACTIVE,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          description: true,
          currentPrice: true,
          basePrice: true,
          price: true,
          salePrice: true,
          level: true,
          totalLessons: true,
          duration: true,
          tutor: {
            select: {
              user: {
                select: { name: true, avatar: true },
              },
            },
          },
          enrollments: { select: { id: true } },
          reviews: { select: { rating: true } },
        },
      },
    },
  });

  if (!promotion) return null;

  // Increment impressions (fire-and-forget, don't crash the page)
  db.coursePromotion
    .update({
      where: { id: promotion.id },
      data: { impressions: { increment: 1 } },
    })
    .catch(() => {});

  return promotion;
}

export async function trackPromotionClick(promotionId: string) {
  await db.coursePromotion.update({
    where: { id: promotionId },
    data: { clicks: { increment: 1 } },
  });
  return { success: true };
}

// ─── Admin: Manage Promotions ───────────────────────────────────────────────

export async function getAdminPromotions() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const promotions = await db.coursePromotion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
        },
      },
      promoter: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return { success: true, promotions };
}

export async function createAdminPromotion(data: {
  courseId: string;
  headline?: string;
  description?: string;
  ctaText?: string;
  promoPrice?: number;
  originalPrice?: number;
  startDate: string;
  endDate: string;
  priority?: number;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const course = await db.course.findUnique({
    where: { id: data.courseId },
  });
  if (!course) return { error: "Course not found" };

  const promotion = await db.coursePromotion.create({
    data: {
      courseId: data.courseId,
      promotedBy: session.user.id,
      type: PromotionType.ADMIN,
      status: PromotionStatus.ACTIVE,
      headline: data.headline || course.title,
      description: data.description,
      ctaText: data.ctaText || "Enroll Now",
      promoPrice: data.promoPrice ?? null,
      originalPrice: data.originalPrice ?? null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      priority: data.priority ?? 10,
      fee: 0,
      feePaid: true,
    },
  });

  return { success: true, promotion };
}

export async function approvePromotion(
  promotionId: string,
  data: {
    startDate: string;
    endDate: string;
    priority?: number;
  },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const promo = await db.coursePromotion.findUnique({
    where: { id: promotionId },
  });
  if (!promo) return { error: "Promotion not found" };
  if (!promo.feePaid && promo.type === "TUTOR") {
    return { error: "Tutor has not paid the promotion fee yet" };
  }

  await db.coursePromotion.update({
    where: { id: promotionId },
    data: {
      status: PromotionStatus.ACTIVE,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      priority: data.priority ?? promo.priority,
    },
  });

  return { success: true };
}

export async function updatePromotionStatus(
  promotionId: string,
  status: PromotionStatus,
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  await db.coursePromotion.update({
    where: { id: promotionId },
    data: { status },
  });

  return { success: true };
}

export async function deletePromotion(promotionId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  await db.coursePromotion.delete({ where: { id: promotionId } });
  return { success: true };
}

// ─── Tutor: Request Promotion ───────────────────────────────────────────────

export async function getTutorPromotions() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const promotions = await db.coursePromotion.findMany({
    where: { promotedBy: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
        },
      },
    },
  });

  return { success: true, promotions };
}

export async function requestTutorPromotion(data: {
  courseId: string;
  headline?: string;
  description?: string;
  ctaText?: string;
  promoPrice?: number;
  originalPrice?: number;
  durationDays: number;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { error: "Unauthorized" };
  }

  // Verify the tutor owns the course
  const course = await db.course.findFirst({
    where: {
      id: data.courseId,
      tutor: { userId: session.user.id },
      status: "PUBLISHED",
    },
  });
  if (!course) return { error: "Course not found or not owned by you" };

  const settings = await getPromotionSettings();

  // Check existing active/pending promotions for this course
  const existing = await db.coursePromotion.count({
    where: {
      courseId: data.courseId,
      promotedBy: session.user.id,
      status: {
        in: ["PENDING_PAYMENT", "PENDING", "ACTIVE"],
      },
    },
  });
  if (existing > 0) {
    return { error: "This course already has an active or pending promotion" };
  }

  // Get suggested scheduling slot
  const slot = await getNextAvailableSlot(data.durationDays);

  const reference = `promo_${randomUUID()}`;

  // Create promotion with PENDING_PAYMENT status
  const promotion = await db.coursePromotion.create({
    data: {
      courseId: data.courseId,
      promotedBy: session.user.id,
      type: PromotionType.TUTOR,
      status: PromotionStatus.PENDING_PAYMENT,
      headline: data.headline || course.title,
      description: data.description,
      ctaText: data.ctaText || "Enroll Now",
      promoPrice: data.promoPrice ?? null,
      originalPrice: data.originalPrice ?? null,
      startDate: slot.startDate,
      endDate: slot.endDate,
      fee: settings.tutorPromotionFee,
      feePaid: false,
      paystackReference: reference,
      priority: 1,
    },
  });

  // Initialize Paystack payment
  const amountKobo = Math.round(settings.tutorPromotionFee * 100);
  const callbackUrl = `${process.env.NEXT_PUBLIC_URL}/tutor/promotions?verify=${reference}`;

  const paystack = await paystackInitialize({
    email: session.user.email,
    amountKobo,
    reference,
    callback_url: callbackUrl,
    metadata: {
      type: "promotion_fee",
      promotionId: promotion.id,
      courseId: data.courseId,
      userId: session.user.id,
    },
  });

  return {
    success: true,
    promotion,
    fee: settings.tutorPromotionFee,
    paymentUrl: paystack.authorization_url,
  };
}

export async function verifyPromotionPayment(reference: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const promotion = await db.coursePromotion.findUnique({
    where: { paystackReference: reference },
  });

  if (!promotion) return { error: "Promotion not found" };
  if (promotion.promotedBy !== session.user.id) {
    return { error: "Unauthorized" };
  }
  if (promotion.feePaid) {
    return { success: true, alreadyPaid: true };
  }

  // Verify with Paystack
  const { paystackVerify } = await import("./paystack");
  const result = await paystackVerify(reference);

  if (result.status === "success") {
    await db.coursePromotion.update({
      where: { id: promotion.id },
      data: {
        feePaid: true,
        status: PromotionStatus.PENDING,
      },
    });
    return { success: true };
  }

  return { error: "Payment not confirmed yet. Please try again." };
}

// ─── Search courses (for admin promotion creation) ──────────────────────────

export async function searchCoursesForPromotion(query: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const courses = await db.course.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      currentPrice: true,
      price: true,
      tutor: {
        select: { user: { select: { name: true } } },
      },
    },
    take: 10,
  });

  return { success: true, courses };
}
