import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendCourseAdvisorLeadNotification } from "@/lib/mail";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  note: z.string().trim().max(600).optional(),
  sessionToken: z.string().trim().min(8).max(120),
  advisorTurnId: z.string().trim().min(8).max(40).optional(),
});

const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT_MAX_REQUESTS = 4;

type Bucket = {
  count: number;
  expiresAt: number;
};

const bucketStore = new Map<string, Bucket>();

function getClientKey(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `advisor-lead:${ip}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = bucketStore.get(key);

  if (!bucket || bucket.expiresAt < now) {
    bucketStore.set(key, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(req: NextRequest) {
  if (isRateLimited(getClientKey(req))) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead data." }, { status: 400 });
  }

  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const advisorSession = await db.advisorSession.upsert({
      where: { sessionToken: parsed.data.sessionToken },
      update: userId ? { userId } : {},
      create: {
        sessionToken: parsed.data.sessionToken,
        userId,
      },
      select: { id: true },
    });

    const relatedTurn =
      parsed.data.advisorTurnId &&
      (await db.advisorTurn.findFirst({
        where: {
          id: parsed.data.advisorTurnId,
          advisorSessionId: advisorSession.id,
        },
        select: { id: true },
      }));

    await db.advisorFollowUp.create({
      data: {
        advisorSessionId: advisorSession.id,
        advisorTurnId: relatedTurn?.id,
        userId,
        name: parsed.data.name,
        email: parsed.data.email,
        note: parsed.data.note,
      },
    });

    await sendCourseAdvisorLeadNotification(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send course advisor lead email:", error);
    return NextResponse.json(
      { error: "Unable to submit request right now." },
      { status: 500 }
    );
  }
}
