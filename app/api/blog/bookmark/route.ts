import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    const existing = await db.blogBookmark.findUnique({
      where: {
        sanityPostId_userId: {
          sanityPostId: postId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      await db.blogBookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ bookmarked: false });
    }

    await db.blogBookmark.create({
      data: { sanityPostId: postId, userId: session.user.id },
    });

    return NextResponse.json({ bookmarked: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ bookmarked: false });
    }

    const postId = req.nextUrl.searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    const existing = await db.blogBookmark.findUnique({
      where: {
        sanityPostId_userId: {
          sanityPostId: postId,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({ bookmarked: !!existing });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
