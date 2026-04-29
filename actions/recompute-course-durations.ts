// import { db } from "@/lib/db";
// import { recomputeCourseDurations } from "@/lib/course-duration";

// export async function recomputeCourseDuration() {
//   try {
//     const courses = await db.course.findMany({
//       select: { id: true, title: true },
//     });

//     for (const course of courses) {
//       const { totalDuration, totalLessons } = await recomputeCourseDurations(
//         db,
//         course.id
//       );
//       console.log(
//         `✅ ${course.title}: ${totalDuration} min (${totalLessons} lessons)`
//       );
//     }
//   } catch (error) {
//     console.error("Failed to recompute course durations:", error);
//     process.exitCode = 1;
//   } finally {
//     await db.$disconnect();
//   }
// }

