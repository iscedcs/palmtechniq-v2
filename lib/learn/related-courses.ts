import "server-only";

import { getPublicCourses } from "@/data/course";
import { coursePath } from "@/lib/site";
import type { RelatedCourse } from "@/components/pages/learn/learn-ui";

/**
 * Resolve the course paths named in a guide to live courses.
 *
 * The guides name courses by path, which would rot: a course gets unpublished
 * or re-slugged and the hub keeps linking to a 404 — the exact failure we just
 * spent a week undoing across the sitemap. Resolving against the published
 * catalogue means a missing course drops out of the list quietly instead, and
 * the titles shown are always the real ones.
 */
export async function resolveRelatedCourses(
  paths: string[] | undefined,
): Promise<RelatedCourse[]> {
  if (!paths?.length) return [];

  const courses = await getPublicCourses().catch((error) => {
    // A hub that cannot reach the database should still serve its content.
    console.error("Failed to resolve related courses:", error);
    return [];
  });

  const byPath = new Map(
    courses.map((course: CourseItem) => [
      coursePath(course),
      {
        title: course.title,
        path: coursePath(course),
        level: course.level,
      } satisfies RelatedCourse,
    ]),
  );

  // Ordered by the guide, not by the catalogue: the first course named is the
  // one the author judged most relevant to what was just read.
  return paths
    .map((path) => byPath.get(path))
    .filter((course): course is RelatedCourse => Boolean(course));
}
