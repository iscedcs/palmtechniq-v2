import type { PrismaClient } from "@prisma/client";

type PrismaLike = Pick<PrismaClient, "course" | "courseModule"> & {
  courseModule: PrismaClient["courseModule"];
};

export async function recomputeCourseDurations(
  client: PrismaLike,
  courseId: string
) {
  const modules = await client.courseModule.findMany({
    where: { courseId },
    include: { lessons: true },
  });

  let totalDuration = 0;
  let totalLessons = 0;

  await Promise.all(
    modules.map(async (module) => {
      const moduleDuration = module.lessons.reduce(
        (sum, lesson) => sum + (lesson.duration || 0),
        0
      );

      totalDuration += moduleDuration;
      totalLessons += module.lessons.length;

      if (module.duration !== moduleDuration) {
        await client.courseModule.update({
          where: { id: module.id },
          data: { duration: moduleDuration },
        });
      }
    })
  );

  await client.course.update({
    where: { id: courseId },
    data: { duration: totalDuration, totalLessons },
  });

  return { totalDuration, totalLessons };
}
