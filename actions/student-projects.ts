"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import { studentSubmissionSchema } from "@/schemas";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function getStudentProjectsOverview() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const enrollments = await db.enrollment.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
      include: {
        lessonProgress: {
          select: {
            lessonId: true,
            isCompleted: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            duration: true,
            tags: { select: { name: true } },
            tutor: {
              select: {
                user: { select: { name: true } },
              },
            },
            modules: {
              select: {
                id: true,
                lessons: { select: { id: true } },
              },
            },
            projects: {
              where: { isActive: true, scope: "COURSE" },
              include: {
                submissions: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const activeProjects: any[] = [];
    const completedProjects: any[] = [];
    const upcomingProjects: any[] = [];
    const gradedScores: number[] = [];

    for (const enrollment of enrollments) {
      const { course } = enrollment;
      const instructor = course.tutor?.user?.name || "PalmTechnIQ Tutor";
      const technologies =
        course.tags?.length > 0 ? course.tags.map((t) => t.name) : [];
      const completedLessonIds = new Set(
        enrollment.lessonProgress
          .filter((progress) => progress.isCompleted)
          .map((progress) => progress.lessonId)
      );
      const allCourseLessonIds = course.modules.flatMap((module) =>
        module.lessons.map((lesson) => lesson.id)
      );
      const moduleLessonIds = course.modules.map((module) => ({
        moduleId: module.id,
        lessonIds: module.lessons.map((lesson) => lesson.id),
      }));
      const completedModulesCount = moduleLessonIds.filter((module) => {
        if (module.lessonIds.length === 0) return true;
        return module.lessonIds.every((lessonId) =>
          completedLessonIds.has(lessonId)
        );
      }).length;

      for (const project of course.projects) {
        const submission = project.submissions[0] || null;
        const isCompleted = submission?.status === "GRADED";
        const requiredLessonIds = allCourseLessonIds;
        const isEligible = requiredLessonIds.every((lessonId) =>
          completedLessonIds.has(lessonId)
        );

        if (isCompleted) {
          const score = submission?.score ?? 0;
          let grade = "F";
          if (score >= 90) grade = "A+";
          else if (score >= 80) grade = "A";
          else if (score >= 70) grade = "B";
          else if (score >= 60) grade = "C";
          else if (score >= 50) grade = "D";

          if (submission?.score !== null && submission?.score !== undefined) {
            gradedScores.push(submission.score);
          }

          completedProjects.push({
            id: project.id,
            title: project.title,
            description: project.description,
            course: course.title,
            courseId: course.id,
            instructor,
            completedDate: submission?.gradedAt || submission?.updatedAt,
            grade,
            status: "completed",
            difficulty: project.difficulty,
            technologies,
            liveUrl: submission?.liveUrl || null,
            githubUrl: submission?.githubUrl || null,
            feedback: submission?.feedback || "No feedback yet.",
          });
          continue;
        }

        if (!isEligible) {
          const completedLessonsForProject = Array.from(
            completedLessonIds
          ).filter((lessonId) => requiredLessonIds.includes(lessonId)).length;
          const remainingLessons = Math.max(
            requiredLessonIds.length - completedLessonsForProject,
            0
          );
          const remainingModules = Math.max(
            course.modules.length - completedModulesCount,
            0
          );

          upcomingProjects.push({
            id: project.id,
            title: project.title,
            description: project.description,
            course: course.title,
            courseId: course.id,
            instructor,
            startDate: project.createdAt,
            difficulty: project.difficulty,
            technologies,
            estimatedDuration: course.duration
              ? `${course.duration} hrs`
              : "TBD",
            eligibilityType: "COURSE",
            requiredLessons: requiredLessonIds.length,
            completedLessons: completedLessonsForProject,
            remainingLessons,
            totalModules: course.modules.length,
            completedModules: completedModulesCount,
            remainingModules,
          });
          continue;
        }

        activeProjects.push({
          id: project.id,
          title: project.title,
          description: project.description,
          course: course.title,
          courseId: course.id,
          instructor,
          progress: Math.round(enrollment.progress || 0),
          status: "in-progress",
          difficulty: project.difficulty,
          technologies,
          submissions: submission ? 1 : 0,
          maxSubmissions: 1,
          feedback: submission?.feedback || "No feedback yet.",
          lastUpdated: formatDistanceToNow(
            submission?.updatedAt || project.updatedAt,
            { addSuffix: true }
          ),
        });
      }
    }

    const avgGrade =
      gradedScores.length > 0
        ? Math.round(
            (gradedScores.reduce((sum, score) => sum + score, 0) /
              gradedScores.length /
              20) *
              10
          ) / 10
        : 0;

    return {
      stats: {
        totalProjects:
          activeProjects.length +
          completedProjects.length +
          upcomingProjects.length,
        completed: completedProjects.length,
        inProgress: activeProjects.length,
        avgGrade,
      },
      activeProjects,
      completedProjects,
      upcomingProjects,
    };
  } catch (error) {
    console.error("Error fetching student projects:", error);
    return { error: "Failed to fetch projects" };
  }
}

export async function submitProjectWork(
  data: z.infer<typeof studentSubmissionSchema>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const validated = studentSubmissionSchema.safeParse(data);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    const project = await db.project.findUnique({
      where: { id: validated.data.projectId },
      select: { id: true, courseId: true },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: project.courseId,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
    });

    if (!enrollment) {
      return { error: "You are not enrolled in this course" };
    }

    await db.submission.upsert({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: project.id,
        },
      },
      create: {
        userId: session.user.id,
        projectId: project.id,
        githubUrl: validated.data.githubUrl,
        liveUrl: validated.data.liveUrl,
        notes: validated.data.notes,
        fileUrl: validated.data.fileUrl,
        status: "SUBMITTED",
      },
      update: {
        githubUrl: validated.data.githubUrl,
        liveUrl: validated.data.liveUrl,
        notes: validated.data.notes,
        fileUrl: validated.data.fileUrl,
        status: "SUBMITTED",
      },
    });

    revalidatePath("/student/projects");
    return { success: true };
  } catch (error) {
    console.error("Error submitting project:", error);
    return { error: "Failed to submit project" };
  }
}
