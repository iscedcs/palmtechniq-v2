
import CourseLearningPageClient from "@/components/pages/courses/courseId/learn/course-learning-page";
import { getCourseWithModules } from "@/data/course";

export default async function CourseLearningPageServer(props: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await props.params;

  const courseData = await getCourseWithModules(courseId);

  if (!courseData) {
    return <div>Course not found</div>;
  }

  return <CourseLearningPageClient courseData={courseData} />;
}
