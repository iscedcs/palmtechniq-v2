import "server-only";

import OpenAI from "openai";
import { z } from "zod";
import { db } from "@/lib/db";

const MAX_COURSES_IN_CONTEXT = 40;
const MAX_DESCRIPTION_CHARS = 220;

const advisorReplySchema = z.object({
  answer: z.string().min(1),
  recommendedCourses: z
    .array(
      z.object({
        id: z.string(),
        reason: z.string().min(1),
      })
    )
    .default([]),
  recommendedCategories: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        reason: z.string().min(1),
      })
    )
    .default([]),
  shouldOfferHumanFollowUp: z.boolean().default(false),
});

export type AdvisorReply = z.infer<typeof advisorReplySchema>;

type CourseContextItem = {
  id: string;
  title: string;
  level: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  shortDescription: string;
  currentPrice: number;
  basePrice: number;
  totalStudents: number;
};

type CategoryContextItem = {
  id: string;
  name: string;
  courseCount: number;
};

type AdvisorContext = {
  courses: CourseContextItem[];
  categories: CategoryContextItem[];
};

export async function getCourseAdvisorContext(): Promise<AdvisorContext> {
  const courses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      category: { select: { id: true, name: true } },
      tags: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: MAX_COURSES_IN_CONTEXT,
  });

  const normalizedCourses: CourseContextItem[] = courses.map((course) => ({
    id: course.id,
    title: course.title,
    level: course.level,
    categoryId: course.category.id,
    categoryName: course.category.name,
    tags: course.tags.map((tag) => tag.name).slice(0, 8),
    shortDescription: course.description.slice(0, MAX_DESCRIPTION_CHARS),
    currentPrice: course.currentPrice ?? course.price ?? 0,
    basePrice: course.basePrice ?? course.price ?? 0,
    totalStudents: course._count.enrollments,
  }));

  const categoryMap = new Map<string, CategoryContextItem>();
  normalizedCourses.forEach((course) => {
    const existing = categoryMap.get(course.categoryId);
    if (existing) {
      existing.courseCount += 1;
      return;
    }

    categoryMap.set(course.categoryId, {
      id: course.categoryId,
      name: course.categoryName,
      courseCount: 1,
    });
  });

  return {
    courses: normalizedCourses,
    categories: Array.from(categoryMap.values()).sort(
      (a, b) => b.courseCount - a.courseCount
    ),
  };
}

function buildSystemPrompt(context: AdvisorContext) {
  return [
    "You are PalmTechnIQ Course Advisor.",
    "Primary goal: help users choose from PalmTechnIQ published courses only.",
    "If direct course recommendations are weak, provide category-led guidance using available platform categories.",
    "Never invent course IDs, course names, categories, pricing, or platform capabilities.",
    "Keep tone concise, practical, and conversion-oriented.",
    "Output MUST be valid JSON with this exact shape:",
    '{"answer":"string","recommendedCourses":[{"id":"string","reason":"string"}],"recommendedCategories":[{"id":"string","name":"string","reason":"string"}],"shouldOfferHumanFollowUp":boolean}',
    "",
    "Available categories (source of truth):",
    JSON.stringify(context.categories),
    "",
    "Available courses (source of truth):",
    JSON.stringify(context.courses),
  ].join("\n");
}

function fallbackReply(): AdvisorReply {
  return {
    answer:
      "I can help you choose the right course. Share your goal, current level, and preferred learning pace, and I will suggest the best options available on PalmTechnIQ.",
    recommendedCourses: [],
    recommendedCategories: [],
    shouldOfferHumanFollowUp: false,
  };
}

function extractJsonObject(value: string): string | null {
  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace < 0 || lastBrace <= firstBrace) {
    return null;
  }
  return value.slice(firstBrace, lastBrace + 1);
}

function sanitizeReply(
  raw: AdvisorReply,
  context: AdvisorContext
): AdvisorReply {
  const courseIds = new Set(context.courses.map((course) => course.id));
  const categoryIds = new Set(context.categories.map((category) => category.id));

  return {
    answer: raw.answer.trim(),
    recommendedCourses: raw.recommendedCourses
      .filter((item) => courseIds.has(item.id))
      .slice(0, 4),
    recommendedCategories: raw.recommendedCategories
      .filter((item) => categoryIds.has(item.id))
      .slice(0, 4),
    shouldOfferHumanFollowUp: Boolean(raw.shouldOfferHumanFollowUp),
  };
}

export async function generateCourseAdvisorReply(
  userMessage: string
): Promise<{ reply: AdvisorReply; context: AdvisorContext }> {
  const context = await getCourseAdvisorContext();

  if (!process.env.OPENAI_API_KEY) {
    return { reply: fallbackReply(), context };
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_ADVISOR_MODEL || "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: buildSystemPrompt(context),
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_output_tokens: 600,
    });

    const outputText = response.output_text?.trim();
    if (!outputText) {
      return { reply: fallbackReply(), context };
    }

    const jsonText = extractJsonObject(outputText);
    if (!jsonText) {
      return { reply: fallbackReply(), context };
    }

    const parsed = advisorReplySchema.safeParse(JSON.parse(jsonText));
    if (!parsed.success) {
      return { reply: fallbackReply(), context };
    }

    return {
      reply: sanitizeReply(parsed.data, context),
      context,
    };
  } catch (error) {
    console.error("Course advisor generation failed:", error);
    return { reply: fallbackReply(), context };
  }
}
