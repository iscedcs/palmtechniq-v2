import { db } from "../lib/db";

const run = async () => {
  const moduleProjects = await db.project.findMany({
    where: { moduleId: { not: null } },
    include: { resources: true, submissions: true },
  });

  for (const project of moduleProjects) {
    if (!project.moduleId) continue;

    const existingTask = await db.task.findFirst({
      where: {
        courseId: project.courseId,
        moduleId: project.moduleId,
        title: project.title,
      },
    });

    const inferredType = (() => {
      if (project.submissions.some((s) => s.githubUrl)) return "GITHUB";
      if (project.submissions.some((s) => s.fileUrl)) return "FILE";
      if (project.submissions.some((s) => s.liveUrl)) return "LINK";
      if (project.submissions.some((s) => s.content)) return "TEXT";
      return "TEXT";
    })();

    const task =
      existingTask ??
      (await db.task.create({
        data: {
          title: project.title,
          description: project.description,
          requirements: project.requirements,
          points: project.points,
          dueDate: project.dueDate,
          isActive: project.isActive,
          submissionType: inferredType,
          courseId: project.courseId,
          moduleId: project.moduleId,
          resources:
            project.resources.length > 0
              ? {
                  createMany: {
                    data: project.resources.map((resource) => ({
                      title: resource.title,
                      description: resource.description,
                      url: resource.url,
                      type: resource.type,
                      fileSize: resource.fileSize,
                      mimeType: resource.mimeType,
                      isPublic: resource.isPublic,
                    })),
                  },
                }
              : undefined,
        },
      }));

    if (project.submissions.length > 0) {
      for (const submission of project.submissions) {
        await db.taskSubmission.upsert({
          where: {
            userId_taskId: { userId: submission.userId, taskId: task.id },
          },
          create: {
            content: submission.content,
            fileUrl: submission.fileUrl,
            githubUrl: submission.githubUrl,
            liveUrl: submission.liveUrl,
            notes: submission.notes,
            status: submission.status,
            score: submission.score,
            feedback: submission.feedback,
            gradedAt: submission.gradedAt,
            userId: submission.userId,
            taskId: task.id,
          },
          update: {},
        });
      }
    }

    if (project.scope !== "MODULE") {
      await db.project.update({
        where: { id: project.id },
        data: { scope: "MODULE" },
      });
    }
  }
};

run()
  .then(async () => {
  await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
