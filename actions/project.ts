"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectSchema, gradeSubmissionSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";

// Get tutor's courses for project creation
export async function getTutorCoursesForProjects() {
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
      include: {
        modules: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { courses };
  } catch (error) {
    console.error("Error fetching courses:", error);
    return { error: "Failed to fetch courses" };
  }
}

// Create a new project
export async function createProject(data: z.infer<typeof projectSchema>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return { error: "Unauthorized" };
  }

  try {
    const validatedData = projectSchema.safeParse(data);
    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }

    const tutor = await db.tutor.findFirst({
      where: { userId: session.user.id },
    });

    if (!tutor) {
      return { error: "Tutor profile not found" };
    }

    // Verify course belongs to tutor
    const course = await db.course.findFirst({
      where: {
        id: validatedData.data.courseId,
        tutorId: tutor.id,
      },
    });

    if (!course) {
      return { error: "Course not found or unauthorized" };
    }

    const project = await db.project.create({
      data: {
        title: validatedData.data.title,
        description: validatedData.data.description,
        requirements: validatedData.data.requirements,
        difficulty: validatedData.data.difficulty,
        points: validatedData.data.points,
        isActive: validatedData.data.isActive,
        scope: "COURSE",
        courseId: validatedData.data.courseId,
        moduleId: null,
        resources:
          validatedData.data.resources &&
          validatedData.data.resources.length > 0
            ? {
                createMany: {
                  data: validatedData.data.resources.map((resource) => ({
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
        course: {
          select: {
            title: true,
          },
        },
        module: {
          select: {
            title: true,
          },
        },
        resources: true,
      },
    });

    // Update course totalProjects count
    await db.course.update({
      where: { id: validatedData.data.courseId },
      data: {
        totalProjects: {
          increment: 1,
        },
      },
    });

    revalidatePath("/tutor/projects");
    return { success: true, project };
  } catch (error) {
    console.error("Error creating project:", error);
    return { error: "Failed to create project" };
  }
}

// Get tutor's projects
export async function getTutorProjects() {
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

    const projects = await db.project.findMany({
      where: {
        course: {
          tutorId: tutor.id,
        },
        scope: "COURSE",
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
        module: {
          select: {
            title: true,
          },
        },
        submissions: {
          select: {
            id: true,
            status: true,
            score: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedProjects = projects.map((project) => {
      const submissions = project.submissions;
      const totalSubmissions = submissions.length;
      const gradedSubmissions = submissions.filter(
        (s: { status: string }) => s.status === "GRADED"
      ).length;
      const averageScore =
        gradedSubmissions > 0
          ? submissions
              .filter((s: { score: number | null }) => s.score !== null)
              .reduce(
                (sum: number, s: { score: number | null }) =>
                  sum + (s.score || 0),
                0
              ) / gradedSubmissions
          : 0;
      const completionRate =
        totalSubmissions > 0
          ? Math.round((gradedSubmissions / totalSubmissions) * 100)
          : 0;

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        requirements: project.requirements,
        course: project.course.title,
        module: project.module?.title,
        difficulty: project.difficulty,
        points: project.points,
        isActive: project.isActive,
        createdAt: project.createdAt,
        submissions: totalSubmissions,
        averageScore: Math.round(averageScore),
        completionRate,
        dueDate: project.dueDate,
      };
    });

    return { projects: formattedProjects };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { error: "Failed to fetch projects" };
  }
}

// Get pending submissions for review
export async function getPendingSubmissions() {
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

    const submissions = await db.submission.findMany({
      where: {
        project: {
          course: {
            tutorId: tutor.id,
          },
          scope: "COURSE",
        },
        status: {
          in: ["PENDING", "SUBMITTED"],
        },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            points: true,
            dueDate: true,
            requirements: true,
            course: {
              select: {
                title: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedSubmissions = submissions.map((submission) => {
      const isOverdue =
        submission.project.dueDate &&
        new Date(submission.project.dueDate) < new Date() &&
        submission.status === "PENDING";

      return {
        id: submission.id,
        title: submission.project.title,
        student: {
          name: submission.user.name,
          email: submission.user.email,
          avatar: submission.user.avatar || submission.user.image,
        },
        course: submission.project.course.title,
        submittedAt: formatDistanceToNow(submission.createdAt, {
          addSuffix: true,
        }),
        dueDate: submission.project.dueDate
          ? formatDistanceToNow(new Date(submission.project.dueDate), {
              addSuffix: true,
            })
          : null,
        difficulty: submission.project.difficulty,
        points: submission.project.points,
        submissionUrl: submission.githubUrl || submission.liveUrl,
        description: submission.content || submission.notes || "",
        requirements: submission.project.requirements || [],
        isOverdue,
        githubUrl: submission.githubUrl,
        liveUrl: submission.liveUrl,
        fileUrl: submission.fileUrl,
        notes: submission.notes,
        content: submission.content,
      };
    });

    return { submissions: formattedSubmissions };
  } catch (error) {
    console.error("Error fetching pending submissions:", error);
    return { error: "Failed to fetch pending submissions" };
  }
}

// Get graded submissions
export async function getGradedSubmissions() {
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

    const submissions = await db.submission.findMany({
      where: {
        project: {
          course: {
            tutorId: tutor.id,
          },
          scope: "COURSE",
        },
        status: "GRADED",
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            points: true,
            course: {
              select: {
                title: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            image: true,
          },
        },
      },
      orderBy: { gradedAt: "desc" },
    });

    const formattedSubmissions = submissions.map((submission) => {
      const score = submission.score || 0;
      let grade = "F";
      if (score >= 90) grade = "A";
      else if (score >= 80) grade = "B";
      else if (score >= 70) grade = "C";
      else if (score >= 60) grade = "D";

      return {
        id: submission.id,
        title: submission.project.title,
        student: {
          name: submission.user.name,
          email: submission.user.email,
          avatar: submission.user.avatar || submission.user.image,
        },
        course: submission.project.course.title,
        submittedAt: formatDistanceToNow(submission.createdAt, {
          addSuffix: true,
        }),
        gradedAt: submission.gradedAt
          ? formatDistanceToNow(submission.gradedAt, { addSuffix: true })
          : null,
        difficulty: submission.project.difficulty,
        points: submission.project.points,
        score: Math.round(score),
        grade,
        feedback: submission.feedback || "",
        submissionUrl: submission.githubUrl || submission.liveUrl,
        githubUrl: submission.githubUrl,
        liveUrl: submission.liveUrl,
        fileUrl: submission.fileUrl,
      };
    });

    return { submissions: formattedSubmissions };
  } catch (error) {
    console.error("Error fetching graded submissions:", error);
    return { error: "Failed to fetch graded submissions" };
  }
}

// Get submissions for a specific project
export async function getProjectSubmissions(projectId: string) {
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

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        course: { tutorId: tutor.id },
        scope: "COURSE",
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!project) {
      return { error: "Project not found or unauthorized" };
    }

    const submissions = await db.submission.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedSubmissions = submissions.map((submission) => ({
      id: submission.id,
      student: {
        name: submission.user.name,
        email: submission.user.email,
        avatar: submission.user.avatar || submission.user.image,
      },
      status: submission.status,
      score: submission.score,
      feedback: submission.feedback,
      submittedAt: formatDistanceToNow(submission.createdAt, {
        addSuffix: true,
      }),
      gradedAt: submission.gradedAt
        ? formatDistanceToNow(submission.gradedAt, { addSuffix: true })
        : null,
      githubUrl: submission.githubUrl,
      liveUrl: submission.liveUrl,
      fileUrl: submission.fileUrl,
      notes: submission.notes,
      content: submission.content,
    }));

    return { project, submissions: formattedSubmissions };
  } catch (error) {
    console.error("Error fetching project submissions:", error);
    return { error: "Failed to fetch project submissions" };
  }
}

// Grade a submission
export async function gradeSubmission(
  data: z.infer<typeof gradeSubmissionSchema>
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return { error: "Unauthorized" };
  }

  try {
    const validatedData = gradeSubmissionSchema.safeParse(data);
    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }

    const tutor = await db.tutor.findFirst({
      where: { userId: session.user.id },
    });

    if (!tutor) {
      return { error: "Tutor profile not found" };
    }

    // Verify submission belongs to tutor's course
    const submission = await db.submission.findFirst({
      where: {
        id: validatedData.data.submissionId,
        project: {
          course: {
            tutorId: tutor.id,
          },
        },
      },
    });

    if (!submission) {
      return { error: "Submission not found or unauthorized" };
    }

    // Update submission
    await db.submission.update({
      where: { id: validatedData.data.submissionId },
      data: {
        score: validatedData.data.score,
        feedback: validatedData.data.feedback,
        status: "GRADED",
        gradedAt: new Date(),
      },
    });

    revalidatePath("/tutor/projects");
    return { success: true };
  } catch (error) {
    console.error("Error grading submission:", error);
    return { error: "Failed to grade submission" };
  }
}

// Get project statistics
export async function getProjectStats() {
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

    const projects = await db.project.findMany({
      where: {
        course: {
          tutorId: tutor.id,
        },
        scope: "COURSE",
      },
      include: {
        submissions: {
          select: {
            status: true,
            score: true,
          },
        },
      },
    });

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.isActive).length;
    const pendingSubmissions = projects.reduce(
      (sum, p) =>
        sum +
        p.submissions.filter(
          (s) => s.status === "PENDING" || s.status === "SUBMITTED"
        ).length,
      0
    );
    const gradedSubmissions = projects.reduce(
      (sum, p) =>
        sum + p.submissions.filter((s) => s.status === "GRADED").length,
      0
    );

    const allScores = projects
      .flatMap((p) => p.submissions)
      .filter((s) => s.score !== null)
      .map((s) => s.score!);

    const averageScore =
      allScores.length > 0
        ? Math.round(
            allScores.reduce((sum, score) => sum + score, 0) / allScores.length
          )
        : 0;

    const totalSubmissions = projects.reduce(
      (sum, p) => sum + p.submissions.length,
      0
    );
    const completionRate =
      totalSubmissions > 0
        ? Math.round((gradedSubmissions / totalSubmissions) * 100)
        : 0;

    return {
      stats: {
        totalProjects,
        activeProjects,
        pendingSubmissions,
        gradedSubmissions,
        averageScore,
        completionRate,
      },
    };
  } catch (error) {
    console.error("Error fetching project stats:", error);
    return { error: "Failed to fetch project statistics" };
  }
}

// Update project
export async function updateProject(
  projectId: string,
  data: Partial<z.infer<typeof projectSchema>>
) {
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

    // Verify project belongs to tutor
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        course: {
          tutorId: tutor.id,
        },
        scope: "COURSE",
      },
    });

    if (!project) {
      return { error: "Project not found or unauthorized" };
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.requirements) updateData.requirements = data.requirements;
    if (data.difficulty) updateData.difficulty = data.difficulty;
    if (data.points) updateData.points = data.points;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.resources) {
      updateData.resources = {
        deleteMany: {},
        createMany: {
          data: data.resources.map((resource: any) => ({
            title: resource.title,
            description: resource.description || null,
            url: resource.url,
            type: resource.type,
            fileSize: resource.fileSize || null,
            mimeType: resource.mimeType || null,
            isPublic: resource.isPublic ?? true,
          })),
        },
      };
    }

    await db.project.update({
      where: { id: projectId },
      data: updateData,
    });

    revalidatePath("/tutor/projects");
    return { success: true };
  } catch (error) {
    console.error("Error updating project:", error);
    return { error: "Failed to update project" };
  }
}

// Toggle project active status
export async function toggleProjectActive(
  projectId: string,
  isActive: boolean
) {
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

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        course: { tutorId: tutor.id },
        scope: "COURSE",
      },
    });

    if (!project) {
      return { error: "Project not found or unauthorized" };
    }

    await db.project.update({
      where: { id: projectId },
      data: { isActive },
    });

    revalidatePath("/tutor/projects");
    return { success: true };
  } catch (error) {
    console.error("Error toggling project status:", error);
    return { error: "Failed to update project status" };
  }
}

// Duplicate a project
export async function duplicateProject(projectId: string) {
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

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        course: { tutorId: tutor.id },
        scope: "COURSE",
      },
      include: {
        resources: true,
      },
    });

    if (!project) {
      return { error: "Project not found or unauthorized" };
    }

    const duplicatedProject = await db.project.create({
      data: {
        title: `Copy of ${project.title}`,
        description: project.description,
        requirements: project.requirements,
        difficulty: project.difficulty,
        points: project.points,
        dueDate: project.dueDate,
        isActive: false,
        scope: "COURSE",
        courseId: project.courseId,
        moduleId: null,
        resources:
          project.resources.length > 0
            ? {
                createMany: {
                  data: project.resources.map((resource) => ({
                    title: resource.title,
                    description: resource.description || null,
                    url: resource.url,
                    type: resource.type,
                    fileSize: resource.fileSize || null,
                    mimeType: resource.mimeType || null,
                    isPublic: resource.isPublic,
                  })),
                },
              }
            : undefined,
      },
    });

    await db.course.update({
      where: { id: project.courseId },
      data: {
        totalProjects: {
          increment: 1,
        },
      },
    });

    revalidatePath("/tutor/projects");
    return { success: true, project: duplicatedProject };
  } catch (error) {
    console.error("Error duplicating project:", error);
    return { error: "Failed to duplicate project" };
  }
}

// Project analytics
export async function getProjectAnalytics(projectId: string) {
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

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        course: { tutorId: tutor.id },
        scope: "COURSE",
      },
      include: {
        submissions: {
          select: {
            status: true,
            score: true,
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      return { error: "Project not found or unauthorized" };
    }

    const totalSubmissions = project.submissions.length;
    const gradedSubmissions = project.submissions.filter(
      (s) => s.status === "GRADED"
    ).length;
    const pendingSubmissions = project.submissions.filter(
      (s) => s.status === "PENDING" || s.status === "SUBMITTED"
    ).length;
    const averageScore =
      gradedSubmissions > 0
        ? Math.round(
            project.submissions
              .filter((s) => s.score !== null)
              .reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions
          )
        : 0;
    const completionRate =
      totalSubmissions > 0
        ? Math.round((gradedSubmissions / totalSubmissions) * 100)
        : 0;

    return {
      analytics: {
        totalSubmissions,
        gradedSubmissions,
        pendingSubmissions,
        averageScore,
        completionRate,
      },
      project: {
        id: project.id,
        title: project.title,
      },
    };
  } catch (error) {
    console.error("Error fetching project analytics:", error);
    return { error: "Failed to fetch project analytics" };
  }
}

// Get project details (for editing)
export async function getProjectDetails(projectId: string) {
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

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        course: { tutorId: tutor.id },
        scope: "COURSE",
      },
      include: {
        resources: true,
      },
    });

    if (!project) {
      return { error: "Project not found or unauthorized" };
    }

    return { project };
  } catch (error) {
    console.error("Error fetching project details:", error);
    return { error: "Failed to fetch project details" };
  }
}

// Delete project
export async function deleteProject(projectId: string) {
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

    // Verify project belongs to tutor
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        course: {
          tutorId: tutor.id,
        },
        scope: "COURSE",
      },
    });

    if (!project) {
      return { error: "Project not found or unauthorized" };
    }

    await db.project.delete({
      where: { id: projectId },
    });

    // Update course totalProjects count
    await db.course.update({
      where: { id: project.courseId },
      data: {
        totalProjects: {
          decrement: 1,
        },
      },
    });

    revalidatePath("/tutor/projects");
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { error: "Failed to delete project" };
  }
}
