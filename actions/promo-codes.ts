"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { normalizePromoCode } from "@/lib/payments/promo";
import type { PromoCode } from "@prisma/client";

// A single consistent return shape across every branch, so callers can
// safely check `res?.error` / `res?.success` without TypeScript inferring a
// union where one branch is missing the property entirely.
// eslint-disable-next-line @typescript-eslint/ban-types
type ActionResult<T extends Record<string, unknown> = {}> =
  | { error: string; success?: undefined }
  | ({ success: true; error?: undefined } & T);

type PromoCodeInput = {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  courseId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  maxRedemptions?: number | null;
  perUserLimit?: number | null;
};

type ValidateCommonResult =
  | { ok: false; error: string }
  | { ok: true; code: string; startsAt: Date | null; endsAt: Date | null };

function validateCommon(data: PromoCodeInput): ValidateCommonResult {
  const code = normalizePromoCode(data.code || "");
  if (!code || code.length < 3) {
    return { ok: false, error: "Code must be at least 3 characters" };
  }
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    return { ok: false, error: "Code can only contain letters, numbers, - and _" };
  }

  if (data.discountType === "PERCENTAGE") {
    if (!(data.discountValue > 0 && data.discountValue <= 100)) {
      return { ok: false, error: "Percentage discount must be between 1 and 100" };
    }
  } else if (data.discountType === "FIXED") {
    if (!(data.discountValue > 0)) {
      return { ok: false, error: "Fixed discount must be greater than 0" };
    }
  } else {
    return { ok: false, error: "Invalid discount type" };
  }

  let startsAt: Date | null = null;
  let endsAt: Date | null = null;
  if (data.startsAt) {
    startsAt = new Date(data.startsAt);
    if (Number.isNaN(startsAt.getTime()))
      return { ok: false, error: "Invalid start date" };
  }
  if (data.endsAt) {
    endsAt = new Date(data.endsAt);
    if (Number.isNaN(endsAt.getTime()))
      return { ok: false, error: "Invalid end date" };
  }
  if (startsAt && endsAt && endsAt <= startsAt) {
    return { ok: false, error: "End date must be after start date" };
  }

  if (
    data.maxRedemptions != null &&
    (!Number.isInteger(data.maxRedemptions) || data.maxRedemptions < 1)
  ) {
    return { ok: false, error: "Max redemptions must be a positive whole number" };
  }
  if (
    data.perUserLimit != null &&
    (!Number.isInteger(data.perUserLimit) || data.perUserLimit < 1)
  ) {
    return { ok: false, error: "Per-user limit must be a positive whole number" };
  }

  return { ok: true, code, startsAt, endsAt };
}

export async function createPromoCode(
  data: PromoCodeInput,
): Promise<ActionResult<{ promoCode: PromoCode }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const role = session.user.role;
  if (role !== "TUTOR" && role !== "ADMIN") return { error: "Unauthorized" };

  const validated = validateCommon(data);
  if (!validated.ok) return { error: validated.error };
  const { code, startsAt, endsAt } = validated;

  let promoType: "PLATFORM" | "INSTRUCTOR";
  let isGlobal = false;

  if (role === "TUTOR") {
    promoType = "INSTRUCTOR";
    // No courseId means "applies to every course this tutor owns" — see
    // promoAppliesToCourse in lib/payments/revenue.ts, which matches an
    // INSTRUCTOR promo with no courseId against course.tutorId === creatorId.
    if (data.courseId) {
      const owns = await db.course.findFirst({
        where: { id: data.courseId, tutor: { userId: session.user.id } },
        select: { id: true },
      });
      if (!owns) return { error: "You don't own this course" };
    }
  } else {
    promoType = "PLATFORM";
    isGlobal = !data.courseId;
    if (data.courseId) {
      const exists = await db.course.findFirst({
        where: { id: data.courseId },
        select: { id: true },
      });
      if (!exists) return { error: "Course not found" };
    }
  }

  try {
    const promoCode = await db.promoCode.create({
      data: {
        code,
        promoType,
        discountType: data.discountType,
        discountValue: data.discountValue,
        isGlobal,
        courseId: data.courseId || null,
        creatorId: session.user.id,
        startsAt,
        endsAt,
        maxRedemptions: data.maxRedemptions || null,
        perUserLimit: data.perUserLimit || null,
      },
    });
    return { success: true, promoCode };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: "A promo code with this code already exists" };
    }
    console.error("Error creating promo code:", error);
    return { error: "Failed to create promo code" };
  }
}

export async function updatePromoCode(
  id: string,
  data: Partial<PromoCodeInput> & { isActive?: boolean },
): Promise<ActionResult<{ promoCode: PromoCode }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const existing = await db.promoCode.findUnique({ where: { id } });
  if (!existing) return { error: "Promo code not found" };

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && existing.creatorId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  const updateData: Record<string, unknown> = {};

  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const touchesCore =
    data.code !== undefined ||
    data.discountType !== undefined ||
    data.discountValue !== undefined ||
    data.startsAt !== undefined ||
    data.endsAt !== undefined ||
    data.maxRedemptions !== undefined ||
    data.perUserLimit !== undefined;

  if (touchesCore) {
    const merged: PromoCodeInput = {
      code: data.code ?? existing.code,
      discountType: (data.discountType ?? existing.discountType) as PromoCodeInput["discountType"],
      discountValue: data.discountValue ?? existing.discountValue,
      startsAt:
        data.startsAt !== undefined
          ? data.startsAt
          : (existing.startsAt?.toISOString() ?? null),
      endsAt:
        data.endsAt !== undefined
          ? data.endsAt
          : (existing.endsAt?.toISOString() ?? null),
      maxRedemptions:
        data.maxRedemptions !== undefined
          ? data.maxRedemptions
          : existing.maxRedemptions,
      perUserLimit:
        data.perUserLimit !== undefined
          ? data.perUserLimit
          : existing.perUserLimit,
    };
    const validated = validateCommon(merged);
    if (!validated.ok) return { error: validated.error };

    updateData.code = validated.code;
    updateData.discountType = merged.discountType;
    updateData.discountValue = merged.discountValue;
    updateData.startsAt = validated.startsAt;
    updateData.endsAt = validated.endsAt;
    updateData.maxRedemptions = merged.maxRedemptions || null;
    updateData.perUserLimit = merged.perUserLimit || null;
  }

  if (data.courseId !== undefined) {
    if (data.courseId) {
      const courseQuery = isAdmin
        ? { id: data.courseId }
        : { id: data.courseId, tutor: { userId: session.user.id } };
      const course = await db.course.findFirst({
        where: courseQuery,
        select: { id: true },
      });
      if (!course) {
        return {
          error: isAdmin ? "Course not found" : "You don't own this course",
        };
      }
    }
    updateData.courseId = data.courseId || null;
    if (isAdmin) updateData.isGlobal = !data.courseId;
  }

  try {
    const promoCode = await db.promoCode.update({
      where: { id },
      data: updateData,
    });
    return { success: true, promoCode };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: "A promo code with this code already exists" };
    }
    console.error("Error updating promo code:", error);
    return { error: "Failed to update promo code" };
  }
}

export async function deletePromoCode(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const existing = await db.promoCode.findUnique({ where: { id } });
  if (!existing) return { error: "Promo code not found" };

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && existing.creatorId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  const redemptionCount = await db.promoRedemption.count({
    where: { promoCodeId: id },
  });
  if (redemptionCount > 0) {
    return {
      error:
        "This code has already been used and can't be deleted — deactivate it instead",
    };
  }

  try {
    await db.promoCode.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting promo code:", error);
    return { error: "Failed to delete promo code" };
  }
}

function tutorPromoCodesQuery(userId: string) {
  return db.promoCode.findMany({
    where: { creatorId: userId },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { redemptions: true } },
    },
    orderBy: { createdAt: "desc" as const },
  });
}

export async function getTutorPromoCodes(): Promise<
  ActionResult<{ promoCodes: Awaited<ReturnType<typeof tutorPromoCodesQuery>> }>
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const promoCodes = await tutorPromoCodesQuery(session.user.id);

  return { success: true, promoCodes };
}

function adminPromoCodesQuery() {
  return db.promoCode.findMany({
    include: {
      course: { select: { id: true, title: true } },
      creator: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { redemptions: true } },
    },
    orderBy: { createdAt: "desc" as const },
  });
}

export async function getAdminPromoCodes(): Promise<
  ActionResult<{ promoCodes: Awaited<ReturnType<typeof adminPromoCodesQuery>> }>
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const promoCodes = await adminPromoCodesQuery();

  return { success: true, promoCodes };
}
