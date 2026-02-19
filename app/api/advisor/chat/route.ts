import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateCourseAdvisorReply } from "@/lib/ai/course-advisor";

const requestSchema = z.object({
  message: z.string().trim().min(2).max(1200),
  sessionToken: z.string().trim().min(8).max(120).optional(),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;

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
  return `advisor-chat:${ip}`;
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
  const clientKey = getClientKey(req);
  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message payload." }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const incomingToken = parsed.data.sessionToken;
  const sessionToken =
    incomingToken && /^[a-zA-Z0-9_-]+$/.test(incomingToken)
      ? incomingToken
      : crypto.randomUUID().replace(/-/g, "");

  const advisorSession = await db.advisorSession.upsert({
    where: { sessionToken },
    update: userId ? { userId } : {},
    create: {
      sessionToken,
      userId,
    },
    select: { id: true },
  });

  const { reply, context } = await generateCourseAdvisorReply(parsed.data.message);
  const byCourseId = new Map(context.courses.map((course) => [course.id, course]));
  const byCategoryId = new Map(
    context.categories.map((category) => [category.id, category])
  );

  const recommendedCourses = reply.recommendedCourses
    .map((item) => {
      const course = byCourseId.get(item.id);
      if (!course) return null;
      return {
        id: course.id,
        reason: item.reason,
        title: course.title,
        level: course.level,
        price: course.currentPrice,
        categoryName: course.categoryName,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const recommendedCategories = reply.recommendedCategories
    .map((item) => {
      const category = byCategoryId.get(item.id);
      if (!category) return null;
      return {
        id: category.id,
        name: category.name,
        reason: item.reason,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const advisorTurn = await db.advisorTurn.create({
    data: {
      advisorSessionId: advisorSession.id,
      userMessage: parsed.data.message,
      assistantMessage: reply.answer,
      recommendations: {
        create: [
          ...recommendedCourses.map((course, index) => ({
            courseId: course.id,
            reason: course.reason,
            rank: index + 1,
          })),
          ...recommendedCategories.map((category, index) => ({
            categoryId: category.id,
            reason: category.reason,
            rank: recommendedCourses.length + index + 1,
          })),
        ],
      },
    },
    select: { id: true },
  });

  if (userId && (recommendedCourses.length > 0 || recommendedCategories.length > 0)) {
    await db.aIRecommendation.createMany({
      data: [
        ...recommendedCourses.map((course) => ({
          userId,
          courseId: course.id,
          type: "COURSE_ADVISOR",
          description: course.reason,
        })),
        ...recommendedCategories.map((category) => ({
          userId,
          type: "COURSE_ADVISOR_CATEGORY",
          description: `${category.name}: ${category.reason}`,
        })),
      ],
    });
  }

  return NextResponse.json({
    sessionToken,
    advisorTurnId: advisorTurn.id,
    answer: reply.answer,
    recommendedCourses,
    recommendedCategories,
    shouldOfferHumanFollowUp: reply.shouldOfferHumanFollowUp,
  });
}
