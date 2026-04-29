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

    await db.blogView.upsert({
      where: { sanityPostId_sessionId: { sanityPostId: postId, sessionId } },
      create: { sanityPostId: postId, sessionId, userId },
      update: {},
    });

    const count = await db.blogView.count({
      where: { sanityPostId: postId },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const postId = req.nextUrl.searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    const count = await db.blogView.count({
      where: { sanityPostId: postId },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
