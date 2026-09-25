import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit-guard";
import { parseUserAgent } from "@/lib/analytics/user-agent";

const ALLOWED_EVENTS = new Set([
  "page_viewed",
  "course_viewed",
  "course_searched",
  "lesson_viewed",
  "blog_viewed",
  "promotion_viewed",
]);

const CATEGORY_MAP: Record<string, string> = {
  page_viewed: "content",
  course_viewed: "course",
  course_searched: "course",
  lesson_viewed: "course",
  blog_viewed: "content",
  promotion_viewed: "promotion",
};

const ACTION_MAP: Record<string, string> = {
  page_viewed: "User viewed a page",
  course_viewed: "User viewed a course",
  course_searched: "User searched for courses",
  lesson_viewed: "User viewed a lesson",
  blog_viewed: "User viewed a blog post",
  promotion_viewed: "User viewed a promotion",
};

/**
 * This endpoint is public and unauthenticated by design — page views come from
 * anonymous visitors — and it writes to the database. That was harmless while
 * the PlatformEvent table did not exist and every insert failed; now that it
 * does, it is a way for anyone to fill the table. So every field is bounded,
 * and each IP is limited.
 *
 * The limit is generous because many Nigerian mobile users share one IP
 * (carrier-grade NAT), and dropping some of a busy network's page views costs
 * a little analytics accuracy, not a broken page.
 */
const MAX_FIELD_LENGTH = 512;
const MAX_METADATA_CHARS = 4000;
const EVENTS_PER_IP_PER_MINUTE = 300;

const bounded = (value: unknown): string | undefined =>
  typeof value === "string" ? value.slice(0, MAX_FIELD_LENGTH) : undefined;

const boundedMetadata = (value: unknown): object | undefined => {
  if (!value || typeof value !== "object") return undefined;
  try {
    return JSON.stringify(value).length <= MAX_METADATA_CHARS
      ? (value as object)
      : undefined;
  } catch {
    return undefined;
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, entityType, entityId, metadata, path, sessionId } = body;

    if (!event || typeof event !== "string" || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    // Over the limit: pretend it worked. Telling a flooder they were throttled
    // only teaches them the threshold.
    const throttled = await enforceRateLimit({
      name: "analytics-track",
      limit: EVENTS_PER_IP_PER_MINUTE,
      ipLimit: EVENTS_PER_IP_PER_MINUTE,
      windowSeconds: 60,
    });
    if (throttled) return NextResponse.json({ ok: true });

    const session = await auth();
    const userId = session?.user?.id || null;

    const userAgent = req.headers.get("user-agent");
    const referer = req.headers.get("referer");
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null;
    const { device, browser, os } = parseUserAgent(userAgent);

    await db.platformEvent.create({
      data: {
        event,
        category: CATEGORY_MAP[event] || "content",
        action: ACTION_MAP[event] || event,
        userId,
        sessionId: bounded(sessionId),
        entityType: bounded(entityType),
        entityId: bounded(entityId),
        metadata: boundedMetadata(metadata),
        path: bounded(path),
        referrer: referer?.slice(0, MAX_FIELD_LENGTH),
        userAgent: userAgent?.slice(0, MAX_FIELD_LENGTH),
        ipAddress,
        device,
        browser,
        os,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Analytics API] track error:", error);
    return NextResponse.json({ ok: true }); // Don't expose errors, silently fail
  }
}
