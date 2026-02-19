import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = params;

    const mentorshipSession = await db.mentorshipSession.findUnique({
      where: { id: sessionId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatar: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatar: true,
          },
        },
      },
    });

    if (!mentorshipSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if user is authorized to view this session
    if (
      mentorshipSession.studentId !== session.user.id &&
      mentorshipSession.tutorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ session: mentorshipSession });
  } catch (error) {
    console.error("[API] Mentorship session fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
