import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const { postId, sessionId } = await req.json();
    if (!postId || !sessionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;

    const existing = await db.blogLike.findUnique({
      where: { sanityPostId_sessionId: { sanityPostId: postId, sessionId } },
    });

    if (existing) {
      await db.blogLike.delete({ where: { id: existing.id } });
      const count = await db.blogLike.count({
        where: { sanityPostId: postId },
      });
      return NextResponse.json({ liked: false, count });
    }

    await db.blogLike.create({
      data: { sanityPostId: postId, sessionId, userId },
    });

    const count = await db.blogLike.count({
      where: { sanityPostId: postId },
    });

    return NextResponse.json({ liked: true, count });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const postId = req.nextUrl.searchParams.get("postId");
    const sessionId = req.nextUrl.searchParams.get("sessionId");

    if (!postId || !sessionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const [count, existing] = await Promise.all([
      db.blogLike.count({ where: { sanityPostId: postId } }),
      db.blogLike.findUnique({
        where: { sanityPostId_sessionId: { sanityPostId: postId, sessionId } },
      }),
    ]);

    return NextResponse.json({ liked: !!existing, count });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
