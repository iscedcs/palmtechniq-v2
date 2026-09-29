import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimiter, RateLimitError } from "@/lib/rate-limit";
import {
  MAX_TRANSCRIBE_DURATION_SECONDS,
  transcribeLessonVideo,
} from "@/lib/ai/transcribe-lesson";
import { NextResponse } from "next/server";

// A sanity cap on the raw video we'll pull into memory to extract audio
// from. Real lesson videos are comfortably under this; anything bigger just
// skips auto-captioning rather than tying up the server.
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { include: { course: { include: { tutor: true } } } },
    },
  });

  if (!lesson) {
    return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 });
  }
  if (lesson.module.course.tutor?.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  // Transcribe once per lesson — never spend tokens re-generating captions
  // a lesson already has. Re-uploading a new video requires the tutor to
  // explicitly clear captions first (or paste a new one) before this runs
  // again.
  if (lesson.captionsUrl) {
    return NextResponse.json({ success: false, skipped: true, reason: "Lesson already has captions" });
  }

  try {
    await rateLimiter({
      key: `transcribe:${session.user.id}`,
      limit: 10,
      window: 3600,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ success: false, skipped: true, reason: error.message });
    }
    throw error;
  }

  const durationMinutes = Number(
    (await request.headers.get("x-lesson-duration-minutes")) ?? NaN,
  );
  if (
    Number.isFinite(durationMinutes) &&
    durationMinutes * 60 > MAX_TRANSCRIBE_DURATION_SECONDS
  ) {
    return NextResponse.json({
      success: false,
      skipped: true,
      reason: "Lesson is too long for automatic captions",
    });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({
      success: false,
      skipped: true,
      reason: "Video is too large for automatic captions",
    });
  }

  const videoBuffer = Buffer.from(await file.arrayBuffer());
  const result = await transcribeLessonVideo({ lessonId, videoBuffer });

  if (result.success) {
    await db.lesson.update({
      where: { id: lessonId },
      data: { captionsUrl: result.captionsUrl },
    });
  }

  return NextResponse.json(result);
}
