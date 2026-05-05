import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const COMMENT_COOLDOWN_SECONDS = 20;
const COMMENT_RATE_LIMIT_WINDOW_MINUTES = 10;
const MAX_COMMENTS_PER_WINDOW = 5;

function formatComment(
  comment: {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    user: { id: string; name: string; image: string | null };
  },
  viewerId?: string,
  viewerRole?: string,
) {
  const isOwner = viewerId ? comment.userId === viewerId : false;
  const isAdmin = viewerRole === "ADMIN";

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    user: {
      id: comment.user.id,
      name: comment.user.name,
      image: comment.user.image,
    },
    canEdit: isOwner || isAdmin,
    canDelete: isOwner || isAdmin,
    deleteLabel: isAdmin && !isOwner ? "Remove" : "Delete",
  };
}

function validateCommentContent(content: unknown) {
  if (!content || typeof content !== "string") {
    return { valid: false as const, message: "Missing content" };
  }

  const trimmed = content.trim();
  if (trimmed.length < 3) {
    return {
      valid: false as const,
      message: "Comment must be at least 3 characters",
    };
  }

  if (trimmed.length > 1000) {
    return {
      valid: false as const,
      message: "Comment must be 1000 characters or less",
    };
  }

  return { valid: true as const, trimmed };
}

export async function GET(req: NextRequest) {
  try {
    const postId = req.nextUrl.searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    const session = await auth();
    const viewerId = session?.user?.id;
    const viewerRole = session?.user?.role;

    const comments = await db.blogComment.findMany({
      where: { sanityPostId: postId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      canComment: !!viewerId,
      comments: comments.map((comment: (typeof comments)[number]) =>
        formatComment(comment, viewerId, viewerRole),
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, content } = await req.json();

    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    const validated = validateCommentContent(content);
    if (!validated.valid) {
      return NextResponse.json({ error: validated.message }, { status: 400 });
    }

    const trimmed = validated.trimmed;
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - COMMENT_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    );

    const [recentCount, latestComment] = await Promise.all([
      db.blogComment.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: windowStart },
        },
      }),
      db.blogComment.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    if (recentCount >= MAX_COMMENTS_PER_WINDOW) {
      return NextResponse.json(
        {
          error: `Too many comments. You can post up to ${MAX_COMMENTS_PER_WINDOW} comments every ${COMMENT_RATE_LIMIT_WINDOW_MINUTES} minutes.`,
        },
        { status: 429 },
      );
    }

    if (latestComment?.createdAt) {
      const secondsSinceLast = Math.floor(
        (now.getTime() - new Date(latestComment.createdAt).getTime()) / 1000,
      );

      if (secondsSinceLast < COMMENT_COOLDOWN_SECONDS) {
        const waitSeconds = COMMENT_COOLDOWN_SECONDS - secondsSinceLast;
        return NextResponse.json(
          {
            error: `Please wait ${waitSeconds}s before posting another comment.`,
          },
          { status: 429 },
        );
      }
    }

    const comment = await db.blogComment.create({
      data: {
        sanityPostId: postId,
        userId: session.user.id,
        content: trimmed,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        comment: formatComment(comment, session.user.id, session.user.role),
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId, content } = await req.json();

    if (!commentId || typeof commentId !== "string") {
      return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
    }

    const validated = validateCommentContent(content);
    if (!validated.valid) {
      return NextResponse.json({ error: validated.message }, { status: 400 });
    }

    const existing = await db.blogComment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const isOwner = existing.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.blogComment.update({
      where: { id: existing.id },
      data: { content: validated.trimmed },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      comment: formatComment(updated, session.user.id, session.user.role),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const commentId = req.nextUrl.searchParams.get("commentId");
    if (!commentId) {
      return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
    }

    const existing = await db.blogComment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const isOwner = existing.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.blogComment.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
