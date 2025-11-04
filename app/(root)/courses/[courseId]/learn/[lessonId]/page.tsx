import CourseLearningPageClient from "@/components/pages/courses/courseId/learn/course-learning-page";
import CourseNotFoundSkeleton from "@/components/shared/skeleton/course-not-found-skeleton";
import { getCourseWithModules } from "@/data/course";

export default async function CourseLearningPageServer(props: {
  params: Promise<{ courseId: string; lessonId?: string }>;
}) {
  const { courseId, lessonId } = await props.params;

  const courseData = await getCourseWithModules(courseId);

  if (!courseData) {
    return <CourseNotFoundSkeleton />;
  }

  return (
    <CourseLearningPageClient
      courseData={courseData}
      initialLessonId={lessonId}
    />
  );
}
