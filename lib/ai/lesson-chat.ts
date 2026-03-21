import "server-only";

import OpenAI from "openai";
import { db } from "@/lib/db";

type LessonContext = {
  lessonTitle: string;
  lessonDescription: string | null;
  lessonContent: string | null;
  moduleTitle: string;
  moduleDescription: string | null;
  courseTitle: string;
  courseDescription: string;
  siblingLessons: string[];
};

export async function getLessonContext(
  lessonId: string,
): Promise<LessonContext | null> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      title: true,
      description: true,
      content: true,
      module: {
        select: {
          title: true,
          description: true,
          course: {
            select: {
              title: true,
              description: true,
            },
          },
          lessons: {
            select: { title: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!lesson) return null;

  return {
    lessonTitle: lesson.title,
    lessonDescription: lesson.description,
    lessonContent: lesson.content,
    moduleTitle: lesson.module.title,
    moduleDescription: lesson.module.description,
    courseTitle: lesson.module.course.title,
    courseDescription: lesson.module.course.description,
    siblingLessons: lesson.module.lessons.map((l: any) => l.title),
  };
}

function buildSystemPrompt(ctx: LessonContext): string {
  const parts = [
    "You are PalmAsk, the AI learning assistant for PalmTechnIQ.",
    `The student is currently watching a video lesson called "${ctx.lessonTitle}".`,
    `This lesson is part of the module "${ctx.moduleTitle}" in the course "${ctx.courseTitle}".`,
    "",
    "Course description:",
    ctx.courseDescription,
    "",
  ];

  if (ctx.lessonDescription) {
    parts.push("Lesson description/notes:", ctx.lessonDescription, "");
  }

  if (ctx.lessonContent) {
    parts.push("Additional lesson content:", ctx.lessonContent, "");
  }

  if (ctx.moduleDescription) {
    parts.push("Module description:", ctx.moduleDescription, "");
  }

  parts.push(
    "Other lessons in this module:",
    ctx.siblingLessons.map((t, i) => `${i + 1}. ${t}`).join("\n"),
    "",
    "Rules:",
    "- Answer questions about the lesson topic clearly and concisely.",
    "- If the student asks about something unrelated, gently guide them back to the lesson topic.",
    "- Use examples and analogies to explain concepts.",
    "- Keep responses focused and educational — avoid unnecessary fluff.",
    "- If you truly don't know, say so honestly and suggest the student ask their tutor.",
    "- Format responses using markdown for readability (bold, lists, code blocks when relevant).",
    "- Respond in the same language the student writes in.",
  );

  return parts.join("\n");
}

export type LessonChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function generateLessonChatReply(
  lessonId: string,
  history: LessonChatMessage[],
): Promise<{ reply: string } | { error: string }> {
  const ctx = await getLessonContext(lessonId);
  if (!ctx) {
    return { error: "Lesson not found." };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      error: "AI assistant is temporarily unavailable. Please try again later.",
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_LESSON_MODEL || "gpt-4.1",
      input: [
        { role: "system", content: buildSystemPrompt(ctx) },
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      max_output_tokens: 800,
    });

    const text = response.output_text?.trim();
    if (!text) {
      return {
        error:
          "I couldn't generate a response. Please try rephrasing your question.",
      };
    }

    return { reply: text };
  } catch (error) {
    console.error("Lesson AI chat failed:", error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}
