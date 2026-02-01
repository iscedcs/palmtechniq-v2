"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { taskSchema, gradeTaskSubmissionSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { notify } from "@/lib/notify";

export async function createTask(data: z.infer<typeof taskSchema>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return { error: "Unauthorized" };
  }

  const validated = taskSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
  });

  if (!tutor) return { error: "Tutor profile not found" };

  const module = await db.courseModule.findFirst({
    where: { id: validated.data.moduleId, courseId: validated.data.courseId },
    select: { id: true },
  });

  if (!module) {
    return { error: "Module not found or does not belong to course" };
  }

  const course = await db.course.findFirst({
    where: { id: validated.data.courseId, tutorId: tutor.id },
  });

  if (!course) return { error: "Course not found or unauthorized" };

  const task = await db.task.create({
    data: {
      title: validated.data.title,
      description: validated.data.description,
      requirements: validated.data.requirements,
      points: validated.data.points,
      dueDate: validated.data.dueDate ?? null,
      isActive: validated.data.isActive,
      submissionType: validated.data.submissionType,
      courseId: validated.data.courseId,
      moduleId: validated.data.moduleId,
      resources:
        validated.data.resources && validated.data.resources.length > 0
          ? {
              createMany: {
                data: validated.data.resources.map((resource) => ({
                  title: resource.title,
                  description: resource.description || null,
                  url: resource.url,
                  type: resource.type,
                  fileSize: resource.fileSize || null,
                  mimeType: resource.mimeType || null,
                  isPublic: resource.isPublic ?? true,
                })),
              },
            }
          : undefined,
    },
    include: {
      course: { select: { title: true } },
      module: { select: { title: true } },
      resources: true,
    },
  });

  try {
    await notify.course(task.courseId, {
      type: "info",
      title: "New Task Assigned",
      message: `New task: "${task.title}".`,
      actionUrl: "/student/assignments",
      actionLabel: "View Task",
      metadata: { category: "task_created", taskId: task.id },
    });
  } catch (error) {
    console.warn("⚠️ Socket.IO not initialized yet, skipping emit");
  }

  revalidatePath("/tutor/tasks");
  return { success: true, task };
}

export async function updateTask(taskId: string, data: z.infer<typeof taskSchema>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return { error: "Unauthorized" };
  }

  const validated = taskSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
  });

  if (!tutor) return { error: "Tutor profile not found" };

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { course: true },
  });

  if (!task || task.course.tutorId !== tutor.id) {
    return { error: "Unauthorized" };
  }

  const updated = await db.task.update({
    where: { id: taskId },
    data: {
      title: validated.data.title,
      description: validated.data.description,
      requirements: validated.data.requirements,
      points: validated.data.points,
      dueDate: validated.data.dueDate ?? null,
      isActive: validated.data.isActive,
      submissionType: validated.data.submissionType,
    },
  });

  revalidatePath("/tutor/tasks");
  return { success: true, task: updated };
}

export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return { error: "Unauthorized" };
  }

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
  });

  if (!tutor) return { error: "Tutor profile not found" };

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { course: true },
  });

  if (!task || task.course.tutorId !== tutor.id) {
    return { error: "Unauthorized" };
  }

  await db.task.delete({ where: { id: taskId } });

  revalidatePath("/tutor/tasks");
  return { success: true };
}

export async function getTutorTasks() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return { error: "Unauthorized" };
  }

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
  });

  if (!tutor) return { error: "Tutor profile not found" };

  const tasks = await db.task.findMany({
    where: { course: { tutorId: tutor.id } },
    include: {
      course: { select: { title: true } },
      module: { select: { title: true } },
      submissions: { select: { id: true, status: true, score: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { tasks };
}

export async function getTutorCoursesForTasks() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return { error: "Unauthorized" };
  }

  try {
    const tutor = await db.tutor.findFirst({
      where: { userId: session.user.id },
    });

    if (!tutor) {
      return { error: "Tutor profile not found" };
    }

    const courses = await db.course.findMany({
      where: { tutorId: tutor.id },
      select: {
        id: true,
        title: true,
        modules: {
          select: { id: true, title: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { courses };
  } catch (error) {
    console.error("Error fetching tutor modules:", error);
    return { error: "Failed to load tutor modules" };
  }
}

export async function getTaskSubmissions(taskId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return { error: "Unauthorized" };
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { course: true },
  });

  if (!task) return { error: "Task not found" };

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
  });

  if (!tutor || task.course.tutorId !== tutor.id) {
    return { error: "Unauthorized" };
  }

  const submissions = await db.taskSubmission.findMany({
    where: { taskId },
    include: { user: { select: { name: true, image: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return { submissions };
}

export async function gradeTaskSubmission(
  data: z.infer<typeof gradeTaskSubmissionSchema>
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return { error: "Unauthorized" };
  }

  const validated = gradeTaskSubmissionSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const submission = await db.taskSubmission.findUnique({
    where: { id: validated.data.submissionId },
    include: { task: { include: { course: true } } },
  });

  if (!submission) return { error: "Submission not found" };

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
  });

  if (!tutor || submission.task.course.tutorId !== tutor.id) {
    return { error: "Unauthorized" };
  }

  const updated = await db.taskSubmission.update({
    where: { id: validated.data.submissionId },
    data: {
      score: validated.data.score,
      feedback: validated.data.feedback,
      status: "GRADED",
      gradedAt: new Date(),
    },
  });

  try {
    await notify.user(submission.userId, {
      type: "success",
      title: "Task Graded",
      message: `Your task "${submission.task.title}" has been graded.`,
      actionUrl: "/student/assignments",
      actionLabel: "View Feedback",
      metadata: { category: "task_graded", taskId: submission.taskId },
    });
  } catch (error) {
    console.warn("⚠️ Socket.IO not initialized yet, skipping emit");
  }

  revalidatePath("/tutor/tasks");
  return { success: true, submission: updated };
}

export async function getStudentTasks() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  const tasks = await db.task.findMany({
    where: {
      isActive: true,
      course: {
        enrollments: {
          some: {
            userId: session.user.id,
            status: { in: ["ACTIVE", "COMPLETED"] },
          },
        },
      },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          tutor: { select: { user: { select: { name: true, avatar: true } } } },
        },
      },
      module: { select: { title: true } },
      resources: true,
      submissions: {
        where: { userId: session.user.id },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = tasks.map((task) => {
    const submission = task.submissions[0];
    return {
      id: task.id,
      title: task.title,
      course: task.course.title,
      courseId: task.course.id,
      module: task.module.title,
      instructor: task.course.tutor?.user?.name || "Tutor",
      instructorAvatar: task.course.tutor?.user?.avatar || "",
      dueDate: task.dueDate,
      points: task.points,
      description: task.description,
      requirements: task.requirements,
      resources: task.resources,
      status: submission?.status || "PENDING",
      submissionType: task.submissionType,
      submittedAt: submission?.createdAt,
      gradedAt: submission?.gradedAt,
      score: submission?.score ?? null,
      feedback: submission?.feedback ?? null,
      githubUrl: submission?.githubUrl ?? null,
      liveUrl: submission?.liveUrl ?? null,
      fileUrl: submission?.fileUrl ?? null,
      content: submission?.content ?? null,
      notes: submission?.notes ?? null,
    };
  });

  const activeTasks = formatted.filter(
    (task) => task.status !== "GRADED"
  );
  const completedTasks = formatted.filter(
    (task) => task.status === "GRADED"
  );

  return { activeTasks, completedTasks };
}

export async function submitTaskSubmission({
  taskId,
  content,
  fileUrl,
  githubUrl,
  liveUrl,
  notes,
}: {
  taskId: string;
  content?: string;
  fileUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { module: { include: { course: { include: { modules: true } } } } },
  });
  if (!task) return { error: "Task not found" };

  const trimmedContent = content?.trim();
  const trimmedGithub = githubUrl?.trim();
  const trimmedLive = liveUrl?.trim();

  switch (task.submissionType) {
    case "GITHUB":
      if (!trimmedGithub) {
        return { error: "Please submit a GitHub URL for this task." };
      }
      break;
    case "LINK":
      if (!trimmedLive) {
        return { error: "Please submit the required link for this task." };
      }
      break;
    case "FILE":
      if (!fileUrl) {
        return { error: "Please upload a file for this task." };
      }
      break;
    case "TEXT":
      if (!trimmedContent) {
        return { error: "Please enter your response for this task." };
      }
      break;
    default:
      break;
  }

  const normalizedSubmission = {
    content: task.submissionType === "TEXT" ? trimmedContent || null : null,
    fileUrl: task.submissionType === "FILE" ? fileUrl || null : null,
    githubUrl: task.submissionType === "GITHUB" ? trimmedGithub || null : null,
    liveUrl: task.submissionType === "LINK" ? trimmedLive || null : null,
  };

  const submission = await db.taskSubmission.upsert({
    where: {
      userId_taskId: {
        userId: session.user.id,
        taskId,
      },
    },
    create: {
      userId: session.user.id,
      taskId,
      content: normalizedSubmission.content,
      fileUrl: normalizedSubmission.fileUrl,
      githubUrl: normalizedSubmission.githubUrl,
      liveUrl: normalizedSubmission.liveUrl,
      notes: notes || null,
      status: "SUBMITTED",
    },
    update: {
      content: normalizedSubmission.content,
      fileUrl: normalizedSubmission.fileUrl,
      githubUrl: normalizedSubmission.githubUrl,
      liveUrl: normalizedSubmission.liveUrl,
      notes: notes || null,
      status: "SUBMITTED",
    },
  });

  try {
    const course = await db.course.findUnique({
      where: { id: task.courseId },
      select: { tutorId: true },
    });

    if (course?.tutorId) {
      const tutor = await db.tutor.findUnique({
        where: { id: course.tutorId },
        select: { userId: true },
      });

      if (tutor?.userId) {
        await notify.user(tutor.userId, {
          type: "info",
          title: "Task Submission",
          message: `A student submitted "${task.title}".`,
          actionUrl: `/tutor/tasks`,
          actionLabel: "Review Submission",
          metadata: { category: "task_submitted", taskId: task.id },
        });
      }
    }
  } catch (error) {
    console.warn("⚠️ Socket.IO not initialized yet, skipping emit");
  }

  const module = task.module;
  const courseModules = module.course.modules.sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  const currentIndex = courseModules.findIndex((m) => m.id === module.id);
  const nextModule = courseModules[currentIndex + 1];

  if (nextModule) {
    const moduleLessons = await db.lesson.findMany({
      where: { moduleId: module.id },
      select: { id: true },
      orderBy: { sortOrder: "asc" },
    });

    const completedLessons = await db.lessonProgress.count({
      where: {
        userId: session.user.id,
        lessonId: { in: moduleLessons.map((l) => l.id) },
        isCompleted: true,
      },
    });

    const allLessonsCompleted =
      moduleLessons.length > 0 && completedLessons === moduleLessons.length;

    const lessonQuizzes = await db.quiz.findMany({
      where: { lessonId: { in: moduleLessons.map((l) => l.id) } },
      select: { id: true },
    });

    const passedQuizCount = await db.quizAttempt.count({
      where: {
        quizId: { in: lessonQuizzes.map((q) => q.id) },
        userId: session.user.id,
        passed: true,
      },
    });

    const quizPassed =
      lessonQuizzes.length === 0 || passedQuizCount === lessonQuizzes.length;

    if (quizPassed && allLessonsCompleted) {
      const firstLesson = await db.lesson.findFirst({
        where: { moduleId: nextModule.id },
        orderBy: { sortOrder: "asc" },
      });

      if (firstLesson) {
        await db.lesson.update({
          where: { id: firstLesson.id },
          data: { isLocked: false },
        });
      }
    }
  }

  revalidatePath("/student/assignments");
  return { success: true, submission };
}
