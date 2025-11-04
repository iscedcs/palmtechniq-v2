import { redirect } from "next/navigation";
import { getCourseWithModules } from "@/data/course";
import CourseNotFoundSkeleton from "@/components/shared/skeleton/course-not-found-skeleton";

export default async function RedirectToFirstLesson({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseWithModules(courseId);
  if (!course) {
    return <CourseNotFoundSkeleton />;
  }

  const firstLesson = course.modules[0]?.lessons[0];
  if (!firstLesson) return <div>No lessons available</div>;

  redirect(`/courses/${courseId}/learn/${firstLesson.id}`);
}
