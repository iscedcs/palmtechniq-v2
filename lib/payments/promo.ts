import { db } from "@/lib/db";

export type PromoValidationResult =
  | { ok: true; promo: PromoCodePayload }
  | { ok: false; reason: string };

export type PromoCodePayload = {
  id: string;
  code: string;
  promoType: "PLATFORM" | "INSTRUCTOR";
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  isGlobal: boolean;
  courseId?: string | null;
  creatorId?: string | null;
};

const normalizeCode = (code: string) => code.trim().toUpperCase();

export async function validatePromoCode({
  code,
  userId,
  courseIds,
}: {
  code: string;
  userId: string;
  courseIds: string[];
}): Promise<PromoValidationResult> {
  const normalized = normalizeCode(code);
  if (!normalized) return { ok: false, reason: "invalid_code" };

  const promo = await db.promoCode.findUnique({
    where: { code: normalized },
    include: {
      allowedUsers: { select: { userId: true } },
    },
  });

  if (!promo || !promo.isActive) return { ok: false, reason: "inactive" };

  const now = new Date();
  if (promo.startsAt && promo.startsAt > now)
    return { ok: false, reason: "not_started" };
  if (promo.endsAt && promo.endsAt < now)
    return { ok: false, reason: "expired" };

  if (promo.courseId && !courseIds.includes(promo.courseId)) {
    return { ok: false, reason: "not_applicable" };
  }

  if (promo.allowedUsers.length > 0) {
    const allowed = promo.allowedUsers.some((u) => u.userId === userId);
    if (!allowed) return { ok: false, reason: "not_allowed" };
  }

  if (promo.maxRedemptions) {
    const totalRedemptions = await db.promoRedemption.count({
      where: { promoCodeId: promo.id },
    });
    if (totalRedemptions >= promo.maxRedemptions) {
      return { ok: false, reason: "maxed_out" };
    }
  }

  if (promo.perUserLimit) {
    const userRedemptions = await db.promoRedemption.count({
      where: { promoCodeId: promo.id, userId },
    });
    if (userRedemptions >= promo.perUserLimit) {
      return { ok: false, reason: "user_limit" };
    }
  }

  return {
    ok: true,
    promo: {
      id: promo.id,
      code: promo.code,
      promoType: promo.promoType,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      isGlobal: promo.isGlobal,
      courseId: promo.courseId,
      creatorId: promo.creatorId,
    },
  };
}

export const normalizePromoCode = normalizeCode;
