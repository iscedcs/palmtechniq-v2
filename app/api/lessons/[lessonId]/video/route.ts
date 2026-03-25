import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  // Fetch lesson and check if it's a preview lesson (accessible without enrollment)
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      videoUrl: true,
      isPreview: true,
      module: {
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Preview lessons are accessible without enrollment
  if (!lesson.isPreview) {
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: lesson.module.courseId,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in this course" },
        { status: 403 },
      );
    }
  }

  return NextResponse.json({ videoUrl: lesson.videoUrl });
}
