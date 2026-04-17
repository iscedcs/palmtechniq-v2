import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, entityType, entityId, metadata, path, sessionId } = body;

    if (!event || typeof event !== "string" || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

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
        sessionId: typeof sessionId === "string" ? sessionId : undefined,
        entityType: typeof entityType === "string" ? entityType : undefined,
        entityId: typeof entityId === "string" ? entityId : undefined,
        metadata: metadata && typeof metadata === "object" ? metadata : undefined,
        path: typeof path === "string" ? path : undefined,
        referrer: referer,
        userAgent,
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
