import { db } from "@/lib/db";
import { headers } from "next/headers";

// ─── Event Categories ────────────────────────────────────────────

export type EventCategory =
  | "auth"
  | "course"
  | "cart"
  | "checkout"
  | "enrollment"
  | "application"
  | "engagement"
  | "mentorship"
  | "program"
  | "promotion"
  | "content";

// ─── Event Definitions ──────────────────────────────────────────

export const PLATFORM_EVENTS = {
  // Auth events
  USER_SIGNED_UP: { event: "user_signed_up", category: "auth" as const, action: "User created an account" },
  USER_LOGGED_IN: { event: "user_logged_in", category: "auth" as const, action: "User logged in" },
  PASSWORD_CHANGED: { event: "password_changed", category: "auth" as const, action: "User changed password" },

  // Course events
  COURSE_VIEWED: { event: "course_viewed", category: "course" as const, action: "User viewed a course" },
  COURSE_CREATED: { event: "course_created", category: "course" as const, action: "Tutor created a course" },
  COURSE_PUBLISHED: { event: "course_published", category: "course" as const, action: "Course was published" },
  COURSE_SEARCHED: { event: "course_searched", category: "course" as const, action: "User searched for courses" },
  LESSON_VIEWED: { event: "lesson_viewed", category: "course" as const, action: "User viewed a lesson" },
  LESSON_COMPLETED: { event: "lesson_completed", category: "course" as const, action: "User completed a lesson" },

  // Cart events
  ADDED_TO_CART: { event: "added_to_cart", category: "cart" as const, action: "User added a course to cart" },
  REMOVED_FROM_CART: { event: "removed_from_cart", category: "cart" as const, action: "User removed a course from cart" },

  // Checkout events
  CHECKOUT_STARTED: { event: "checkout_started", category: "checkout" as const, action: "User started checkout" },
  CHECKOUT_COMPLETED: { event: "checkout_completed", category: "checkout" as const, action: "User completed purchase" },
  PAYMENT_FAILED: { event: "payment_failed", category: "checkout" as const, action: "Payment failed" },
  PROMO_CODE_APPLIED: { event: "promo_code_applied", category: "checkout" as const, action: "User applied a promo code" },

  // Enrollment events
  COURSE_ENROLLED: { event: "course_enrolled", category: "enrollment" as const, action: "User enrolled in a course" },
  COURSE_COMPLETED: { event: "course_completed", category: "enrollment" as const, action: "User completed a course" },

  // Application events
  APPLICATION_SUBMITTED: { event: "application_submitted", category: "application" as const, action: "User submitted an application" },
  APPLICATION_APPROVED: { event: "application_approved", category: "application" as const, action: "Application was approved" },
  APPLICATION_REJECTED: { event: "application_rejected", category: "application" as const, action: "Application was rejected" },

  // Program enrollment events
  PROGRAM_ENROLLMENT_STARTED: { event: "program_enrollment_started", category: "program" as const, action: "User started program enrollment" },
  PROGRAM_ENROLLMENT_PAID: { event: "program_enrollment_paid", category: "program" as const, action: "User paid for program enrollment" },
  INSTALLMENT_PAID: { event: "installment_paid", category: "program" as const, action: "User paid an installment" },

  // Engagement events
  REVIEW_SUBMITTED: { event: "review_submitted", category: "engagement" as const, action: "User submitted a review" },
  DISCUSSION_POSTED: { event: "discussion_posted", category: "engagement" as const, action: "User posted in discussion" },
  WISHLIST_ADDED: { event: "wishlist_added", category: "engagement" as const, action: "User added course to wishlist" },
  CERTIFICATE_EARNED: { event: "certificate_earned", category: "engagement" as const, action: "User earned a certificate" },
  QUIZ_ATTEMPTED: { event: "quiz_attempted", category: "engagement" as const, action: "User attempted a quiz" },
  PROJECT_SUBMITTED: { event: "project_submitted", category: "engagement" as const, action: "User submitted a project" },

  // Mentorship events
  MENTORSHIP_SESSION_BOOKED: { event: "mentorship_session_booked", category: "mentorship" as const, action: "User booked a mentorship session" },
  MENTORSHIP_PACKAGE_PURCHASED: { event: "mentorship_package_purchased", category: "mentorship" as const, action: "User purchased a mentorship package" },

  // Content events
  PAGE_VIEWED: { event: "page_viewed", category: "content" as const, action: "User viewed a page" },
  BLOG_VIEWED: { event: "blog_viewed", category: "content" as const, action: "User viewed a blog post" },

  // Promotion events
  PROMOTION_VIEWED: { event: "promotion_viewed", category: "promotion" as const, action: "User viewed a promotion" },
  GROUP_PURCHASE_CREATED: { event: "group_purchase_created", category: "promotion" as const, action: "User created a group purchase" },
  GROUP_PURCHASE_JOINED: { event: "group_purchase_joined", category: "promotion" as const, action: "User joined a group purchase" },
} as const;

// ─── Types ───────────────────────────────────────────────────────

type PlatformEventKey = keyof typeof PLATFORM_EVENTS;
type PlatformEventDef = (typeof PLATFORM_EVENTS)[PlatformEventKey];

interface TrackEventOptions {
  userId?: string | null;
  sessionId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  path?: string;
  value?: number;
  duration?: number;
}

// ─── Device Detection Helper ────────────────────────────────────

function parseUserAgent(ua: string | null): { device: string; browser: string; os: string } {
  if (!ua) return { device: "unknown", browser: "unknown", os: "unknown" };

  let device = "desktop";
  if (/mobile|android|iphone|ipad/i.test(ua)) {
    device = /ipad|tablet/i.test(ua) ? "tablet" : "mobile";
  }

  let browser = "unknown";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  let os = "unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad/i.test(ua)) os = "iOS";

  return { device, browser, os };
}

// ─── Main Track Function ────────────────────────────────────────

export async function trackEvent(
  eventDef: PlatformEventDef,
  options: TrackEventOptions = {},
) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent");
    const referer = headersList.get("referer");
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null;

    const { device, browser, os } = parseUserAgent(userAgent);

    await db.platformEvent.create({
      data: {
        event: eventDef.event,
        category: eventDef.category,
        action: eventDef.action,
        userId: options.userId || undefined,
        sessionId: options.sessionId,
        entityType: options.entityType,
        entityId: options.entityId,
        metadata: options.metadata || undefined,
        path: options.path,
        referrer: referer,
        userAgent,
        ipAddress,
        device,
        browser,
        os,
        duration: options.duration,
        value: options.value,
      },
    });
  } catch (error) {
    // Analytics should never break the main flow
    console.error("[Analytics] Failed to track event:", eventDef.event, error);
  }
}

// ─── Convenience Wrappers ───────────────────────────────────────

export async function trackCourseView(userId: string | null, courseId: string, courseTitle: string, path?: string) {
  return trackEvent(PLATFORM_EVENTS.COURSE_VIEWED, {
    userId,
    entityType: "course",
    entityId: courseId,
    metadata: { courseTitle },
    path,
  });
}

export async function trackAddToCart(userId: string, courseId: string, courseTitle: string, price: number) {
  return trackEvent(PLATFORM_EVENTS.ADDED_TO_CART, {
    userId,
    entityType: "course",
    entityId: courseId,
    metadata: { courseTitle, price },
    value: price,
  });
}

export async function trackCheckoutStarted(userId: string, courseIds: string[], totalAmount: number) {
  return trackEvent(PLATFORM_EVENTS.CHECKOUT_STARTED, {
    userId,
    entityType: "transaction",
    metadata: { courseIds, courseCount: courseIds.length },
    value: totalAmount,
  });
}

export async function trackCheckoutCompleted(userId: string, transactionId: string, totalAmount: number, courseIds: string[]) {
  return trackEvent(PLATFORM_EVENTS.CHECKOUT_COMPLETED, {
    userId,
    entityType: "transaction",
    entityId: transactionId,
    metadata: { courseIds, courseCount: courseIds.length },
    value: totalAmount,
  });
}

export async function trackEnrollment(userId: string, courseId: string, courseTitle: string) {
  return trackEvent(PLATFORM_EVENTS.COURSE_ENROLLED, {
    userId,
    entityType: "course",
    entityId: courseId,
    metadata: { courseTitle },
  });
}

export async function trackProgramEnrollment(userId: string | null, programId: string, programTitle: string, amount: number) {
  return trackEvent(PLATFORM_EVENTS.PROGRAM_ENROLLMENT_STARTED, {
    userId,
    entityType: "program",
    entityId: programId,
    metadata: { programTitle },
    value: amount,
  });
}

export async function trackApplicationSubmitted(userId: string, applicationType: string) {
  return trackEvent(PLATFORM_EVENTS.APPLICATION_SUBMITTED, {
    userId,
    entityType: "application",
    metadata: { applicationType },
  });
}

export async function trackUserSignup(userId: string, method: string) {
  return trackEvent(PLATFORM_EVENTS.USER_SIGNED_UP, {
    userId,
    metadata: { method },
  });
}

export async function trackUserLogin(userId: string) {
  return trackEvent(PLATFORM_EVENTS.USER_LOGGED_IN, {
    userId,
  });
}
