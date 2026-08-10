"use server";

import { randomUUID } from "crypto";
import slugify from "slugify";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { paystackInitialize } from "@/actions/paystack";
import {
  REVENUE,
  allocateBundlePrices,
  computeBundlePriceFloor,
  computeCheckoutTotals,
  validateBundlePrice,
} from "@/lib/payments/revenue";
import { resolveTutorReferralCode } from "@/lib/referral";

/**
 * Course bundles.
 *
 * A bundle is a curated, discounted, price-capped, reviewed multi-course cart.
 * It deliberately introduces no new payment infrastructure: the bundle price is
 * allocated across its courses and fed through the existing checkout pipeline,
 * so settlement, enrollment and earnings all work unchanged.
 *
 * Bundles carry NO split rate of their own. Line items inherit the normal
 * attribution rates — 25/75 on platform traffic, 50/50 on a tutor referral —
 * because a bundle is a packaging format, not an acquisition channel.
 *
 * See docs/implementation/course_bundle_implementation_plan.
 */

type GuardFailure = { ok: false; error: string };

const bundleSlug = (title: string) =>
  `${slugify(title, { lower: true, strict: true }).slice(0, 60)}-${randomUUID().slice(0, 6)}`;

async function requireTutor() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" as const };
  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
    select: { id: true, userId: true },
  });
  if (!tutor) return { error: "Only tutors can manage bundles" as const };
  return { tutor, userId: session.user.id };
}

/**
 * Every composition rule that must hold whenever a bundle's courses or price
 * change. Re-run on create, on update, and again at checkout — an individual
 * course can be unpublished or repriced after a bundle is approved.
 */
async function validateComposition({
  tutorId,
  courseIds,
  price,
}: {
  tutorId: string;
  courseIds: string[];
  price: number;
}): Promise<GuardFailure | { ok: true; courses: { id: string; price: number }[] }> {
  const unique = Array.from(new Set(courseIds));
  if (unique.length !== courseIds.length) {
    return { ok: false, error: "A course cannot appear twice in a bundle" };
  }
  if (unique.length < REVENUE.bundle.minCourses) {
    return {
      ok: false,
      error: `A bundle needs at least ${REVENUE.bundle.minCourses} courses`,
    };
  }

  const courses = await db.course.findMany({
    where: { id: { in: unique } },
    select: {
      id: true,
      title: true,
      status: true,
      tutorId: true,
      price: true,
      basePrice: true,
      currentPrice: true,
    },
  });

  if (courses.length !== unique.length) {
    return { ok: false, error: "One or more courses could not be found" };
  }

  // Cross-tutor bundles would break attribution: whose wallet gets the share?
  const foreign = courses.find((c: any) => c.tutorId !== tutorId);
  if (foreign) {
    return {
      ok: false,
      error: `"${foreign.title}" belongs to another tutor and cannot be bundled`,
    };
  }

  const unpublished = courses.find((c: any) => c.status !== "PUBLISHED");
  if (unpublished) {
    return {
      ok: false,
      error: `"${unpublished.title}" is not published`,
    };
  }

  const priced: { id: string; price: number }[] = courses.map((c: any) => ({
    id: c.id as string,
    price: (c.currentPrice && c.currentPrice > 0
      ? c.currentPrice
      : (c.basePrice ?? c.price ?? 0)) as number,
  }));

  const check = validateBundlePrice({
    coursePrices: priced.map((c) => c.price),
    bundlePrice: price,
  });

  if (!check.ok) {
    const floor = check.priceFloor.toLocaleString();
    const messages: Record<typeof check.reason, string> = {
      too_few_courses: `A bundle needs at least ${REVENUE.bundle.minCourses} courses`,
      not_positive: "Bundle price must be greater than zero",
      below_minimum: `Bundle price must be at least ₦${REVENUE.bundle.minPrice.toLocaleString()}`,
      below_floor: `Bundle price cannot be below ₦${floor} — the maximum discount is ${Math.round(REVENUE.bundle.maxDiscount * 100)}% of the ₦${check.listSum.toLocaleString()} list total`,
    };
    return { ok: false, error: messages[check.reason] };
  }

  return { ok: true, courses: priced };
}

export async function createCourseBundle(input: {
  title: string;
  description?: string;
  price: number;
  courseIds: string[];
}) {
  const ctx = await requireTutor();
  if ("error" in ctx) return { ok: false as const, error: ctx.error };

  const title = input.title?.trim();
  if (!title) return { ok: false as const, error: "Title is required" };

  const valid = await validateComposition({
    tutorId: ctx.tutor.id,
    courseIds: input.courseIds,
    price: input.price,
  });
  if (!valid.ok) return { ok: false as const, error: valid.error };

  const bundle = await db.courseBundle.create({
    data: {
      title,
      slug: bundleSlug(title),
      description: input.description?.trim() || null,
      price: input.price,
      tutorId: ctx.tutor.id,
      reviewStatus: "DRAFT",
      items: { create: input.courseIds.map((courseId) => ({ courseId })) },
    },
    select: { id: true, slug: true },
  });

  revalidatePath("/tutor/bundles");
  return { ok: true as const, bundle };
}

export async function updateCourseBundle(input: {
  bundleId: string;
  title?: string;
  description?: string;
  price?: number;
  courseIds?: string[];
  isActive?: boolean;
}) {
  const ctx = await requireTutor();
  if ("error" in ctx) return { ok: false as const, error: ctx.error };

  const existing = await db.courseBundle.findFirst({
    where: { id: input.bundleId, tutorId: ctx.tutor.id },
    include: { items: { select: { courseId: true } } },
  });
  if (!existing) return { ok: false as const, error: "Bundle not found" };

  const nextCourseIds =
    input.courseIds ?? existing.items.map((i: any) => i.courseId);
  const nextPrice = input.price ?? existing.price;

  const valid = await validateComposition({
    tutorId: ctx.tutor.id,
    courseIds: nextCourseIds,
    price: nextPrice,
  });
  if (!valid.ok) return { ok: false as const, error: valid.error };

  // A material change invalidates the platform's approval. Cosmetic edits
  // (title, description, pause/resume) do not — otherwise approval means
  // nothing, because a tutor could get a fair bundle approved and then halve
  // the price.
  const priceChanged = input.price !== undefined && input.price !== existing.price;
  const compositionChanged =
    input.courseIds !== undefined &&
    (input.courseIds.length !== existing.items.length ||
      input.courseIds.some(
        (id) => !existing.items.some((i: any) => i.courseId === id),
      ));
  const material = priceChanged || compositionChanged;

  await db.$transaction(async (tx: any) => {
    if (input.courseIds) {
      await tx.courseBundleItem.deleteMany({ where: { bundleId: existing.id } });
      await tx.courseBundleItem.createMany({
        data: input.courseIds.map((courseId) => ({
          bundleId: existing.id,
          courseId,
        })),
      });
    }

    await tx.courseBundle.update({
      where: { id: existing.id },
      data: {
        title: input.title?.trim() || existing.title,
        description:
          input.description !== undefined
            ? input.description.trim() || null
            : existing.description,
        price: nextPrice,
        isActive: input.isActive ?? existing.isActive,
        ...(material && existing.reviewStatus === "APPROVED"
          ? {
              reviewStatus: "PENDING_REVIEW",
              reviewedAt: null,
              reviewedById: null,
              reviewNote: null,
              submittedAt: new Date(),
            }
          : {}),
      },
    });
  });

  revalidatePath("/tutor/bundles");
  return {
    ok: true as const,
    requiresReReview: material && existing.reviewStatus === "APPROVED",
  };
}

export async function submitBundleForReview(bundleId: string) {
  const ctx = await requireTutor();
  if ("error" in ctx) return { ok: false as const, error: ctx.error };

  const bundle = await db.courseBundle.findFirst({
    where: { id: bundleId, tutorId: ctx.tutor.id },
    include: { items: { select: { courseId: true } } },
  });
  if (!bundle) return { ok: false as const, error: "Bundle not found" };
  if (bundle.reviewStatus === "PENDING_REVIEW") {
    return { ok: false as const, error: "Already awaiting review" };
  }

  const valid = await validateComposition({
    tutorId: ctx.tutor.id,
    courseIds: bundle.items.map((i: any) => i.courseId),
    price: bundle.price,
  });
  if (!valid.ok) return { ok: false as const, error: valid.error };

  await db.courseBundle.update({
    where: { id: bundle.id },
    data: { reviewStatus: "PENDING_REVIEW", submittedAt: new Date(), reviewNote: null },
  });

  revalidatePath("/tutor/bundles");
  revalidatePath("/admin/bundles");
  return { ok: true as const };
}

export async function reviewBundle(input: {
  bundleId: string;
  decision: "APPROVED" | "REJECTED";
  note?: string;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false as const, error: "Forbidden" };
  }

  const bundle = await db.courseBundle.findUnique({
    where: { id: input.bundleId },
    include: {
      items: { select: { courseId: true } },
      tutor: { select: { userId: true } },
    },
  });
  if (!bundle) return { ok: false as const, error: "Bundle not found" };

  // Re-validate at approval: prices and course status may have moved since the
  // tutor submitted.
  if (input.decision === "APPROVED") {
    const valid = await validateComposition({
      tutorId: bundle.tutorId,
      courseIds: bundle.items.map((i: any) => i.courseId),
      price: bundle.price,
    });
    if (!valid.ok) {
      return {
        ok: false as const,
        error: `Cannot approve: ${valid.error}`,
      };
    }
  }

  await db.courseBundle.update({
    where: { id: bundle.id },
    data: {
      reviewStatus: input.decision,
      reviewedAt: new Date(),
      reviewedById: session.user.id,
      reviewNote: input.note?.trim() || null,
    },
  });

  await notify.user(bundle.tutor.userId, {
    type: input.decision === "APPROVED" ? "success" : "warning",
    title:
      input.decision === "APPROVED" ? "Bundle Approved" : "Bundle Not Approved",
    message:
      input.decision === "APPROVED"
        ? `"${bundle.title}" is now live.`
        : `"${bundle.title}" was not approved${input.note ? `: ${input.note}` : "."}`,
    actionUrl: "/tutor/bundles",
    actionLabel: "View Bundles",
  });

  revalidatePath("/admin/bundles");
  revalidatePath("/tutor/bundles");
  return { ok: true as const };
}

/** Public bundle page data. Only approved, active bundles are visible. */
export async function getPublicBundle(slug: string) {
  const bundle = await db.courseBundle.findFirst({
    where: { slug, reviewStatus: "APPROVED", isActive: true },
    include: {
      tutor: { select: { userId: true, user: { select: { name: true, image: true } } } },
      items: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              status: true,
              price: true,
              basePrice: true,
              currentPrice: true,
            },
          },
        },
      },
    },
  });
  if (!bundle) return null;

  const prices = bundle.items.map((item: any) =>
    item.course.currentPrice && item.course.currentPrice > 0
      ? item.course.currentPrice
      : (item.course.basePrice ?? item.course.price ?? 0),
  );
  const { listSum } = computeBundlePriceFloor(prices);

  return {
    id: bundle.id,
    slug: bundle.slug,
    title: bundle.title,
    description: bundle.description,
    price: bundle.price,
    listSum,
    savings: Math.max(0, listSum - bundle.price),
    savingsPercent: listSum > 0 ? Math.round((1 - bundle.price / listSum) * 100) : 0,
    tutorName: bundle.tutor.user.name,
    courses: bundle.items.map((item: any, i: number) => ({
      ...item.course,
      listPrice: prices[i],
    })),
  };
}

/**
 * Start a bundle purchase.
 *
 * Every guard is re-checked here, not just at page load — approval state,
 * course status and prices can all move between a student opening the page and
 * clicking pay.
 */
export async function beginBundleCheckout(slug: string, referralCode?: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    // Typed so the caller can send the visitor to sign in and back again,
    // rather than showing a dead end.
    return {
      ok: false as const,
      reason: "unauthenticated" as const,
      error: "You need to be signed in to buy this bundle",
    };
  }

  const bundle = await db.courseBundle.findUnique({
    where: { slug },
    include: {
      tutor: { select: { id: true, userId: true } },
      items: { select: { courseId: true } },
    },
  });

  if (!bundle) return { ok: false as const, error: "Bundle not found" };
  if (bundle.reviewStatus !== "APPROVED" || !bundle.isActive) {
    return { ok: false as const, error: "This bundle is no longer available" };
  }
  if (bundle.tutor.userId === session.user.id) {
    return { ok: false as const, error: "You cannot buy your own bundle" };
  }

  const courseIds = bundle.items.map((i: any) => i.courseId);

  const valid = await validateComposition({
    tutorId: bundle.tutorId,
    courseIds,
    price: bundle.price,
  });
  if (!valid.ok) {
    return {
      ok: false as const,
      error: "This bundle is temporarily unavailable",
      detail: valid.error,
    };
  }

  // Owning ANY course in the bundle blocks the purchase. Pro-rating would mean
  // charging a bundle price for less than the bundle.
  const owned = await db.enrollment.findFirst({
    where: {
      userId: session.user.id,
      courseId: { in: courseIds },
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    select: { course: { select: { title: true } } },
  });
  if (owned) {
    return {
      ok: false as const,
      error: `You already own "${owned.course.title}" from this bundle. Buy the remaining courses individually instead.`,
    };
  }

  // Allocate the fixed bundle price across courses proportionally to list
  // price, so each course keeps its own line item, VAT record and earning.
  const shares = allocateBundlePrices({
    coursePrices: valid.courses.map((c) => c.price),
    bundlePrice: bundle.price,
  });

  const referralTutorId = referralCode
    ? await resolveTutorReferralCode(referralCode)
    : null;

  // No promo: a bundle is already discounted, and stacking compounds the
  // margin loss on a price the platform does not control.
  const totals = computeCheckoutTotals({
    courses: valid.courses.map((course, i) => ({
      id: course.id,
      tutorId: bundle.tutor.userId,
      basePrice: course.price,
      currentPrice: shares[i],
      price: shares[i],
    })),
    promo: null,
    referralTutorId,
  });

  if (Math.abs(totals.subtotalAmount - bundle.price) > 0.01) {
    // Line items must reconcile exactly to the bundle price.
    return { ok: false as const, error: "Bundle pricing failed to reconcile" };
  }

  const reference = `ps_${randomUUID()}`;

  await db.transaction.create({
    data: {
      userId: session.user.id,
      amount: totals.totalAmount,
      currency: "NGN",
      status: "PENDING",
      paymentMethod: "PAYSTACK",
      transactionId: reference,
      description: `Bundle: ${bundle.title}`,
      subtotalAmount: totals.subtotalAmount,
      discountAmount: totals.discountAmount,
      vatAmount: totals.vatAmount,
      tutorShareAmount: totals.tutorShareAmount,
      platformShareAmount: totals.platformShareAmount,
      referralCode: referralCode ?? null,
      isReferralPurchase: !!referralTutorId,
      metadata: {
        type: "bundle",
        bundleId: bundle.id,
        bundleSlug: bundle.slug,
        courseIds,
      },
      lineItems: {
        create: totals.lineItems.map((item) => ({
          courseId: item.courseId,
          tutorId: item.tutorId,
          basePrice: item.basePrice,
          discountedPrice: item.discountedPrice,
          discountAmount: item.discountAmount,
          vatAmount: item.vatAmount,
          totalAmount: item.totalAmount,
          tutorShareAmount: item.tutorShareAmount,
          platformShareAmount: item.platformShareAmount,
          isReferralPurchase: item.isReferralPurchase,
        })),
      },
    },
  });

  const init = await paystackInitialize({
    email: session.user.email,
    amountKobo: Math.round(totals.totalAmount * 100),
    reference,
    callback_url: `${process.env.NEXT_PUBLIC_URL}/courses/verify-course-payment`,
    metadata: {
      type: "bundle",
      bundleId: bundle.id,
      courseIds,
      userId: session.user.id,
    },
  });

  return { ok: true as const, authorizationUrl: init.authorization_url };
}

export async function getTutorBundles() {
  const ctx = await requireTutor();
  if ("error" in ctx) return { ok: false as const, error: ctx.error };

  const bundles = await db.courseBundle.findMany({
    where: { tutorId: ctx.tutor.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              price: true,
              basePrice: true,
              currentPrice: true,
            },
          },
        },
      },
    },
  });

  return { ok: true as const, bundles };
}

export async function getAdminBundleQueue() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { ok: false as const, error: "Forbidden" };
  }

  const bundles = await db.courseBundle.findMany({
    orderBy: [{ reviewStatus: "asc" }, { submittedAt: "desc" }],
    include: {
      tutor: { select: { user: { select: { id: true, name: true, email: true } } } },
      items: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              price: true,
              basePrice: true,
              currentPrice: true,
            },
          },
        },
      },
    },
  });

  // Trailing 90-day individual sales per course, so the reviewer can judge
  // cannibalisation: a bundle of a tutor's two strongest sellers discounts
  // sales that were already going to happen.
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const courseIds = bundles.flatMap((b: any) =>
    b.items.map((i: any) => i.courseId),
  );

  const sales = courseIds.length
    ? await db.transactionLineItem.groupBy({
        by: ["courseId"],
        where: {
          courseId: { in: courseIds },
          transaction: { status: "COMPLETED", createdAt: { gte: since } },
        },
        _count: { _all: true },
        _sum: { totalAmount: true },
      })
    : [];

  const salesByCourse = new Map<string, { count: number; revenue: number }>(
    sales.map((row: any) => [
      row.courseId as string,
      { count: row._count._all as number, revenue: (row._sum.totalAmount ?? 0) as number },
    ]),
  );

  return {
    ok: true as const,
    bundles: bundles.map((bundle: any) => {
      const prices = bundle.items.map((item: any) =>
        item.course.currentPrice && item.course.currentPrice > 0
          ? item.course.currentPrice
          : (item.course.basePrice ?? item.course.price ?? 0),
      );
      const { listSum, priceFloor } = computeBundlePriceFloor(prices);
      return {
        id: bundle.id,
        title: bundle.title,
        slug: bundle.slug,
        price: bundle.price,
        listSum,
        priceFloor,
        discountPercent:
          listSum > 0 ? Math.round((1 - bundle.price / listSum) * 100) : 0,
        reviewStatus: bundle.reviewStatus,
        reviewNote: bundle.reviewNote,
        submittedAt: bundle.submittedAt,
        isActive: bundle.isActive,
        tutorName: bundle.tutor.user.name,
        tutorEmail: bundle.tutor.user.email,
        courses: bundle.items.map((item: any, i: number) => ({
          id: item.course.id,
          title: item.course.title,
          listPrice: prices[i],
          sales90d: salesByCourse.get(item.courseId)?.count ?? 0,
          revenue90d: salesByCourse.get(item.courseId)?.revenue ?? 0,
        })),
      };
    }),
  };
}
