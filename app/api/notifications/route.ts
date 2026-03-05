import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/notifications - Fetch notifications for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ notifications: [] });
    }

    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since"); // ISO timestamp
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const notifications = await db.notification.findMany({
      where: {
        userId: session.user.id,
        ...(since && {
          createdAt: { gt: new Date(since) },
        }),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });

    // Map database notification to frontend format
    const mapped = notifications.map((n) => ({
      id: n.id,
      type: n.type.toLowerCase() as string,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
      actionUrl: (n.data as any)?.actionUrl,
      actionLabel: (n.data as any)?.actionLabel,
      metadata: n.data as Record<string, any> | undefined,
    }));

    return NextResponse.json({
      notifications: mapped,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ids, markAllRead } = body;

    if (markAllRead) {
      await db.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (ids?.length) {
      await db.notification.updateMany({
        where: {
          id: { in: ids },
          userId: session.user.id,
        },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 },
    );
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      await db.notification.deleteMany({
        where: { userId: session.user.id },
      });
    } else if (id) {
      await db.notification.delete({
        where: { id, userId: session.user.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 },
    );
  }
}
