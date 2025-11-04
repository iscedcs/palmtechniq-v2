import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * 🟢 CREATE RESOURCE
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, url, type, fileSize, mimeType, moduleId, lessonId } = body;

    const resource = await db.resource.create({
      data: {
        title,
        url,
        type,
        fileSize,
        mimeType,
        moduleId,
        lessonId,
        isPublic: true,
      },
    });

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}

/**
 * 🟣 FETCH RESOURCES (by moduleId or lessonId)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get("moduleId");
    const lessonId = searchParams.get("lessonId");

    const where = moduleId ? { moduleId } : lessonId ? { lessonId } : {};

    const resources = await db.resource.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, resources });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

/**
 * 🟡 UPDATE RESOURCE (PATCH)
 * Allows tutor to edit title, type, visibility, or URL if needed.
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, title, url, type, isPublic, moduleId, lessonId } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required for update" },
        { status: 400 }
      );
    }

    const updatedResource = await db.resource.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(url && { url }),
        ...(type && { type }),
        ...(typeof isPublic === "boolean" && { isPublic }),
        ...(moduleId && { moduleId }),
        ...(lessonId && { lessonId }),
      },
    });

    return NextResponse.json({ success: true, resource: updatedResource });
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}

/**
 * 🔴 DELETE RESOURCE
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Missing resource ID" },
        { status: 400 }
      );

    await db.resource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
