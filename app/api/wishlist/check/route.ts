import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ exists: false });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId")!;

  const existing = await db.wishlist.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  });

  return NextResponse.json({ exists: !!existing });
}
