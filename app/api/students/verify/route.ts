import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Student ID is required" },
      { status: 400 },
    );
  }

  const userSelect = {
    id: true,
    name: true,
    image: true,
    avatar: true,
    role: true,
    createdAt: true,
    isActive: true,
    studentProfile: {
      select: {
        id: true,
        level: true,
        currentRank: true,
        coursesStarted: true,
        coursesCompleted: true,
        totalPoints: true,
      },
    },
    enrollments: {
      where: { status: "ACTIVE" as const },
      select: {
        course: {
          select: {
            title: true,
          },
        },
      },
      take: 5,
    },
    _count: {
      select: { enrollments: true },
    },
  } as const;

  try {
    // Try finding by User ID first, then by Student profile ID
    let user = await db.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      const student = await db.student.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (student) {
        user = await db.user.findUnique({
          where: { id: student.userId },
          select: userSelect,
        });
      }
    }

    // Valid if user has a student profile, STUDENT role, or any enrollments
    const isStudent =
      user &&
      (user.studentProfile ||
        user.role === "STUDENT" ||
        user._count.enrollments > 0);

    if (!user || !isStudent) {
      return NextResponse.json(
        { error: "Student not found", valid: false },
        { status: 404 },
      );
    }

    return NextResponse.json({
      valid: true,
      student: {
        name: user.name,
        image: user.image || user.avatar,
        memberSince: user.createdAt,
        isActive: user.isActive,
        level: user.studentProfile?.level ?? "BEGINNER",
        rank: user.studentProfile?.currentRank ?? "Novice",
        coursesStarted: user.studentProfile?.coursesStarted ?? user._count.enrollments,
        coursesCompleted: user.studentProfile?.coursesCompleted ?? 0,
        totalPoints: user.studentProfile?.totalPoints ?? 0,
        activeEnrollments: user.enrollments.map((e: { course: { title: string } }) => e.course.title),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
