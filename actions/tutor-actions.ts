// File: app/lib/actions/tutor-actions.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import slugify from "slugify";

import { courseSchema, lessonSchema, moduleSchema } from "@/schemas";
import { z } from "zod";
import { toSlug } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { getIO } from "@/lib/socket";
import { recomputeCourseDurations } from "@/lib/course-duration";

export async function createCourse(data: any, modulesData: any[] = []) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return { error: "Unauthorized" };
  }
  // console.log("Looking for tutor with userId:", session.user.id);

  try {
    const validatedData = courseSchema.safeParse({
      ...data,
      level: data.level.toUpperCase().replace(" ", "_"),
      flashSaleEnd: data.flashSaleEnd ? new Date(data.flashSaleEnd) : undefined,
    });

    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }

    // const tutors = await db.tutor.findMany();
    // console.log("All tutors Prisma sees:", tutors);

    // console.log("Session userId raw:", session.user.id);
    // console.log("Session userId trimmed:", session.user.id.trim());

    const tutor = await db.tutor.findFirst({
      where: { userId: session.user.id.trim() },
    });

    // console.log("Tutor found:", tutor);

    if (!tutor) {
      throw new Error(
        "Tutor profile not found for this user. Please contact support."
      );
    }

    const result = await db.$transaction(
      async (tx) => {
        const resolvedBasePrice =
          typeof validatedData.data.basePrice === "number"
            ? validatedData.data.basePrice
            : typeof validatedData.data.currentPrice === "number"
            ? validatedData.data.currentPrice
            : validatedData.data.price ?? 0;
        const resolvedCurrentPrice =
          typeof validatedData.data.currentPrice === "number"
            ? validatedData.data.currentPrice
            : resolvedBasePrice;

        const course = await tx.course.create({
          data: {
            title: validatedData.data.title,
            subtitle: validatedData.data.subtitle,
            description: validatedData.data.description,
            category: {
              connect: { name: validatedData.data.category },
            },
            level: validatedData.data.level as any,
            language: validatedData.data.language,
            price: resolvedBasePrice,
            basePrice: resolvedBasePrice,
            currentPrice: resolvedCurrentPrice,
            demandLevel:
              resolvedBasePrice && resolvedCurrentPrice
                ? resolvedCurrentPrice < resolvedBasePrice * 0.7
                  ? "high"
                  : resolvedCurrentPrice < resolvedBasePrice * 0.9
                  ? "medium"
                  : "low"
                : undefined,
            requirements: validatedData.data.requirements,
            outcomes: validatedData.data.outcomes,

            isFlashSale: validatedData.data.isFlashSale,
            allowDiscussions: validatedData.data.allowDiscussions ?? false,
            certificate: validatedData.data.certificate ?? false,
            duration: 0,
            flashSaleEnd: validatedData.data.flashSaleEnd,

            publishedAt: null,
            slug: toSlug(validatedData.data.title),

            groupBuyingEnabled: validatedData.data.groupBuyingEnabled,
            groupBuyingDiscount: validatedData.data.groupBuyingDiscount,
            thumbnail: validatedData.data.thumbnail,
            previewVideo: validatedData.data.previewVideo,
            status: "DRAFT",
            creator: { connect: { id: session.user.id } },
            tutor: { connect: { id: tutor.id } },
          },
        });

        const groupTiers = validatedData.data.groupTiers ?? [];
        if (validatedData.data.groupBuyingEnabled && groupTiers.length > 0) {
          await tx.groupTier.createMany({
            data: groupTiers.map((tier) => ({
              courseId: course.id,
              size: tier.size,
              groupPrice: tier.groupPrice,
              cashbackPercent: tier.cashbackPercent ?? 0,
              isActive: tier.isActive ?? true,
            })),
          });
        }

        // Create tags
        if (validatedData.data.tags.length > 0) {
          await tx.courseTag.createMany({
            data: validatedData.data.tags.map((tag) => ({
              courseId: course.id,
              name: tag,
            })),
          });
        }

        // Create modules and lessons
        const shouldValidateContent = validatedData.data.isPublished;
        for (const mod of modulesData) {
          const modulePayload = {
            title: mod.title ?? "",
            description: mod.description ?? "",
            content: mod.content ?? "",
            sortOrder: typeof mod.sortOrder === "number" ? mod.sortOrder : 0,
            duration: typeof mod.duration === "number" ? mod.duration : 0,
            isPublished: Boolean(mod.isPublished),
          };
          const validatedModule = shouldValidateContent
            ? moduleSchema.safeParse(modulePayload)
            : { success: true, data: modulePayload };

          if (!validatedModule.success) {
            throw new Error(validatedModule.error.issues[0].message);
          }

          const newModule = await tx.courseModule.create({
            data: {
              title: validatedModule.data.title,
              description: validatedModule.data.description,
              content: validatedModule.data.content,
              sortOrder: validatedModule.data.sortOrder,
              duration: 0,
              isPublished: validatedModule.data.isPublished,
              courseId: course.id,
            },
          });

          for (const lesson of mod.lessons || []) {
            const lessonPayload = {
              title: lesson.title ?? "",
              lessonType: lesson.lessonType ?? "VIDEO",
              duration: typeof lesson.duration === "number" ? lesson.duration : 0,
              content: lesson.content ?? "",
              description: lesson.description ?? "",
              videoUrl: lesson.videoUrl ?? "",
              sortOrder:
                typeof lesson.sortOrder === "number" ? lesson.sortOrder : 0,
              isPreview: Boolean(lesson.isPreview),
            };
            const validatedLesson = shouldValidateContent
              ? lessonSchema.safeParse(lessonPayload)
              : { success: true, data: lessonPayload };

            if (!validatedLesson.success) {
              throw new Error(validatedLesson.error.issues[0].message);
            }
            await tx.lesson.create({
              data: {
                title: validatedLesson.data.title,
                lessonType: validatedLesson.data.lessonType,
                duration: validatedLesson.data.duration ?? 0,
                content: validatedLesson.data.content,
                videoUrl: validatedLesson.data.videoUrl || null,
                sortOrder: validatedLesson.data.sortOrder,
                description: validatedLesson.data.description,
                isPreview: validatedLesson.data.isPreview,
                moduleId: newModule.id,
              },
            });
          }
        }

        await recomputeCourseDurations(tx, course.id);

        return course;
      },
      { timeout: 30000 }
    );

    const requestedPublish = Boolean(validatedData.data.isPublished);
    await notify.user(session.user.id, {
      type: "success",
      title: "Course Created",
      message: `“${result.title}” has been created${
        requestedPublish ? " and submitted for approval" : ""
      }.`,
      actionUrl: `/tutor/courses/${result.id}/edit`,
      actionLabel: "Continue Editing",
      metadata: { category: "course_created", courseId: result.id },
    });

    if (requestedPublish) {
      await notify.role("ADMIN", {
        type: "info",
        title: "Course awaiting approval",
        message: `Tutor submitted “${result.title}” for approval.`,
        actionUrl: `/admin/courses`,
        actionLabel: "Review Course",
        metadata: { category: "course_review", courseId: result.id },
      });
    }

    return {
      success: true,
      courseId: result.id,
      requiresApproval: requestedPublish,
    };
  } catch (error) {
    console.error("Error creating course:", error);
    return {
      error:
        error instanceof z.ZodError
          ? error.issues[0].message
          : "Failed to create course",
    };
  }
}

export async function addModuleToCourse(courseId: string, moduleData: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (course?.creatorId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const modulePayload = {
      title: moduleData.title ?? "",
      description: moduleData.description ?? "",
      content: moduleData.content ?? "",
      duration: typeof moduleData.duration === "number" ? moduleData.duration : 0,
      sortOrder:
        typeof moduleData.sortOrder === "number" ? moduleData.sortOrder : 0,
      isPublished: Boolean(moduleData.isPublished),
    };

    const newModule = await db.courseModule.create({
      data: {
        title: modulePayload.title,
        description: modulePayload.description,
        duration: 0,
        sortOrder: modulePayload.sortOrder,
        isPublished: modulePayload.isPublished,
        courseId,
      },
    });
    await recomputeCourseDurations(db, courseId);

    const io = getIO();
    if (io) {
      const sockets = await io.in(`course:${courseId}`).allSockets();
      console.log(
        `course:${courseId} ${newModule.id} sockets = ${sockets.size}`
      );
    }
    await notify.course(courseId, {
      type: "info",
      title: "New Module Added",
      message: `Module “${newModule.title}” was added to “${course?.title}”.`,
      actionUrl: `/courses/${courseId}`,
      actionLabel: "Open Course",
      metadata: { category: "course_update", courseId, moduleId: newModule.id },
    });

    return { success: true, moduleId: newModule.id };
  } catch (error) {
    console.error("Error adding module:", error);
    return { error: "Failed to add module" };
  }
}

export async function removeModuleFromCourse(
  courseId: string,
  moduleId: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const module = await db.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (!module || module.course.creatorId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    await db.courseModule.delete({ where: { id: moduleId } });
    await recomputeCourseDurations(db, courseId);

    await notify.course(courseId, {
      type: "warning",
      title: "Module Removed",
      message: `Module “${module.title}” was removed from “${module.course.title}”.`,
      actionUrl: `/courses/${courseId}`,
      actionLabel: "Open Course",
      metadata: { category: "course_update", courseId, moduleId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error removing module:", error);
    return { error: "Failed to remove module" };
  }
}
export async function addLessonToModule(
  courseId: string,
  moduleId: string,
  lessonData: any
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const module = await db.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (module?.course.creatorId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const lessonPayload = {
      title: lessonData.title ?? "",
      lessonType: lessonData.lessonType ?? "VIDEO",
      duration: typeof lessonData.duration === "number" ? lessonData.duration : 0,
      content: lessonData.content ?? "",
      description: lessonData.description ?? "",
      videoUrl: lessonData.videoUrl ?? "",
      sortOrder:
        typeof lessonData.sortOrder === "number" ? lessonData.sortOrder : 0,
      isPreview: Boolean(lessonData.isPreview),
    };

    const newLesson = await db.lesson.create({
      data: {
        title: lessonPayload.title,
        lessonType: lessonPayload.lessonType,
        duration: lessonPayload.duration ?? 0,
        content: lessonPayload.content,
        videoUrl: lessonPayload.videoUrl,
        sortOrder: lessonPayload.sortOrder,
        description: lessonPayload.description,
        isPreview: lessonPayload.isPreview,
        moduleId,
      },
    });
    await recomputeCourseDurations(db, courseId);

    const io = getIO();
    if (io) {
      const sockets = await io.in(`course:${courseId}`).allSockets();
      console.log(
        `course:${courseId},${newLesson.id} sockets = ${sockets.size}`
      );
    }
    await notify.course(courseId, {
      type: "info",
      title: "New Lesson Added",
      message: `Lesson “${newLesson.title}” was added to module “${module?.title}”.`,
      actionUrl: `/courses/${courseId}`,
      actionLabel: "Open Course",
      metadata: {
        category: "course_update",
        courseId,
        moduleId,
        lessonId: newLesson.id,
      },
    });

    return { success: true, lessonId: newLesson.id };
  } catch (error) {
    console.error("Error adding lesson:", error);
    return { error: "Failed to add lesson" };
  }
}

export async function updateLessonVideo(
  lessonId: string,
  videoUrl: string,
  duration?: number
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!lessonId || !videoUrl) {
    return { error: "Lesson ID and video URL are required" };
  }

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { include: { course: { include: { tutor: true } } } },
    },
  });

  if (!lesson) return { error: "Lesson not found" };
  if (lesson.module.course.tutor?.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  await db.lesson.update({
    where: { id: lessonId },
    data: {
      videoUrl,
      duration: typeof duration === "number" ? duration : lesson.duration,
    },
  });

  await recomputeCourseDurations(db, lesson.module.courseId);

  return { success: true };
}

export async function removeLessonFromModule(
  courseId: string,
  moduleId: string,
  lessonId: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });

    if (!lesson || lesson.module.course.creatorId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    await db.lesson.delete({ where: { id: lessonId } });
    await recomputeCourseDurations(db, courseId);

    await notify.course(courseId, {
      type: "warning",
      title: "Lesson Removed",
      message: `Lesson “${lesson.title}” was removed from module “${lesson.module.title}” in “${lesson.module.course.title}” .`,
      actionUrl: `/courses/${courseId}`,
      actionLabel: "Open Course",
      metadata: { category: "course_update", courseId, moduleId, lessonId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error removing lesson:", error);
    return { error: "Failed to remove lesson" };
  }
}

export async function uploadCourseFile(
  formData: FormData,
  type: "thumbnail" | "video"
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return { error: "Unauthorized" };
  }

  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "No file provided" };
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        type,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { error: data.error || "Failed to generate upload URL" };
    }

    const { url, fields } = data;

    const uploadFormData = new FormData();
    Object.entries(fields).forEach(([key, value]) =>
      uploadFormData.append(key, value as string)
    );
    uploadFormData.append("file", file);

    const uploadResponse = await fetch(url, {
      method: "POST",
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      return { error: `Failed to upload ${type}` };
    }

    return { success: true, url: `${url}${fields.key}` };
  } catch (error) {
    console.error(`Error uploading ${type}:`, error);
    return { error: `Failed to upload ${type}` };
  }
}

export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    });
    return { success: true, categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { error: "Failed to fetch categories" };
  }
}
