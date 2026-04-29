import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const resourceTypeSchema = z.enum([
  "PDF",
  "VIDEO",
  "AUDIO",
  "IMAGE",
  "LINK",
  "CODE",
  "DOCUMENT",
]);

const createResourceSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    url: z.string().trim().url().max(2000),
    type: resourceTypeSchema.default("LINK"),
    fileSize: z.number().int().positive().max(500 * 1024 * 1024).optional(),
    mimeType: z.string().trim().min(1).max(200).optional(),
    moduleId: z.string().trim().min(1).optional(),
    lessonId: z.string().trim().min(1).optional(),
    projectId: z.string().trim().min(1).optional(),
    taskId: z.string().trim().min(1).optional(),
    isPublic: z.boolean().optional(),
  })
  .refine(
    (payload) =>
      Boolean(
        payload.moduleId || payload.lessonId || payload.projectId || payload.taskId
      ),
    {
      message: "At least one parent context is required",
      path: ["moduleId"],
    }
  );

const updateResourceSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1).max(180).optional(),
    url: z.string().trim().url().max(2000).optional(),
    type: resourceTypeSchema.optional(),
    isPublic: z.boolean().optional(),
    moduleId: z.string().trim().min(1).optional(),
    lessonId: z.string().trim().min(1).optional(),
    projectId: z.string().trim().min(1).optional(),
    taskId: z.string().trim().min(1).optional(),
  })
  .refine(
    (payload) =>
      payload.title !== undefined ||
      payload.url !== undefined ||
      payload.type !== undefined ||
      payload.isPublic !== undefined ||
      payload.moduleId !== undefined ||
      payload.lessonId !== undefined ||
      payload.projectId !== undefined ||
      payload.taskId !== undefined,
    {
      message: "No valid update fields provided",
      path: ["id"],
    }
  );

function canManageResources(role?: string | null) {
  return role === "ADMIN" || role === "TUTOR";
}

async function resolveContextOwner(payload: {
  moduleId?: string;
  lessonId?: string;
  projectId?: string;
  taskId?: string;
}) {
  if (payload.lessonId) {
    const lesson = await db.lesson.findUnique({
      where: { id: payload.lessonId },
      select: {
        id: true,
        moduleId: true,
        module: { select: { course: { select: { tutor: { select: { userId: true } } } } } },
      },
    });
    if (!lesson) return { error: "Lesson not found" as const };
    if (payload.moduleId && payload.moduleId !== lesson.moduleId) {
      return { error: "Lesson/module context mismatch" as const };
    }
    return { ownerUserId: lesson.module.course.tutor.userId };
  }

  if (payload.moduleId) {
    const module = await db.courseModule.findUnique({
      where: { id: payload.moduleId },
      select: { course: { select: { tutor: { select: { userId: true } } } } },
    });
    if (!module) return { error: "Module not found" as const };
    return { ownerUserId: module.course.tutor.userId };
  }

  if (payload.projectId) {
    const project = await db.project.findUnique({
      where: { id: payload.projectId },
      select: { course: { select: { tutor: { select: { userId: true } } } } },
    });
    if (!project) return { error: "Project not found" as const };
    return { ownerUserId: project.course.tutor.userId };
  }

  if (payload.taskId) {
    const task = await db.task.findUnique({
      where: { id: payload.taskId },
      select: { course: { select: { tutor: { select: { userId: true } } } } },
    });
    if (!task) return { error: "Task not found" as const };
    return { ownerUserId: task.course.tutor.userId };
  }

  return { error: "Missing parent context" as const };
}

async function getResourceOwner(resourceId: string) {
  const resource = await db.resource.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      module: { select: { course: { select: { tutor: { select: { userId: true } } } } } },
      lesson: {
        select: {
          module: { select: { course: { select: { tutor: { select: { userId: true } } } } } },
        },
      },
      project: { select: { course: { select: { tutor: { select: { userId: true } } } } } },
      task: { select: { course: { select: { tutor: { select: { userId: true } } } } } },
    },
  });
  if (!resource) return { error: "Resource not found" as const };
  const ownerUserId =
    resource.lesson?.module.course.tutor.userId ||
    resource.module?.course.tutor.userId ||
    resource.project?.course.tutor.userId ||
    resource.task?.course.tutor.userId ||
    null;
  if (!ownerUserId) return { error: "Resource owner not found" as const };
  return { ownerUserId };
}

/**
 * 🟢 CREATE RESOURCE
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageResources(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createResourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { title, url, type, fileSize, mimeType, moduleId, lessonId, projectId, taskId } =
      parsed.data;

    const ownerContext = await resolveContextOwner({
      moduleId,
      lessonId,
      projectId,
      taskId,
    });
    if ("error" in ownerContext) {
      return NextResponse.json({ error: ownerContext.error }, { status: 400 });
    }
    if (session.user.role !== "ADMIN" && ownerContext.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resource = await db.resource.create({
      data: {
        title,
        url,
        type,
        fileSize,
        mimeType,
        moduleId,
        lessonId,
        projectId,
        taskId,
        isPublic: parsed.data.isPublic ?? true,
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageResources(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get("moduleId") ?? undefined;
    const lessonId = searchParams.get("lessonId") ?? undefined;
    const projectId = searchParams.get("projectId") ?? undefined;
    const taskId = searchParams.get("taskId") ?? undefined;

    if (!moduleId && !lessonId && !projectId && !taskId) {
      return NextResponse.json(
        { error: "moduleId, lessonId, projectId or taskId is required" },
        { status: 400 }
      );
    }

    const ownerContext = await resolveContextOwner({
      moduleId,
      lessonId,
      projectId,
      taskId,
    });
    if ("error" in ownerContext) {
      return NextResponse.json({ error: ownerContext.error }, { status: 400 });
    }
    if (session.user.role !== "ADMIN" && ownerContext.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const where = moduleId
      ? { moduleId }
      : lessonId
      ? { lessonId }
      : projectId
      ? { projectId }
      : { taskId };

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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageResources(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = updateResourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { id, title, url, type, isPublic, moduleId, lessonId, projectId, taskId } =
      parsed.data;

    const existingOwner = await getResourceOwner(id);
    if ("error" in existingOwner) {
      return NextResponse.json({ error: existingOwner.error }, { status: 404 });
    }
    if (session.user.role !== "ADMIN" && existingOwner.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (moduleId || lessonId || projectId || taskId) {
      const nextOwner = await resolveContextOwner({
        moduleId,
        lessonId,
        projectId,
        taskId,
      });
      if ("error" in nextOwner) {
        return NextResponse.json({ error: nextOwner.error }, { status: 400 });
      }
      if (session.user.role !== "ADMIN" && nextOwner.ownerUserId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
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
        ...(projectId && { projectId }),
        ...(taskId && { taskId }),
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageResources(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Missing resource ID" },
        { status: 400 }
      );

    const existingOwner = await getResourceOwner(id);
    if ("error" in existingOwner) {
      return NextResponse.json({ error: existingOwner.error }, { status: 404 });
    }
    if (session.user.role !== "ADMIN" && existingOwner.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
