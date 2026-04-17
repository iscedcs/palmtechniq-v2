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

  try {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        avatar: true,
        createdAt: true,
        isActive: true,
        studentProfile: {
          select: {
            level: true,
            currentRank: true,
            coursesStarted: true,
            coursesCompleted: true,
            totalPoints: true,
          },
        },
        enrollments: {
          where: { status: "ACTIVE" },
          select: {
            course: {
              select: {
                title: true,
              },
            },
          },
          take: 5,
        },
      },
    });

    if (!user || !user.studentProfile) {
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
        level: user.studentProfile.level,
        rank: user.studentProfile.currentRank,
        coursesStarted: user.studentProfile.coursesStarted,
        coursesCompleted: user.studentProfile.coursesCompleted,
        totalPoints: user.studentProfile.totalPoints,
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
