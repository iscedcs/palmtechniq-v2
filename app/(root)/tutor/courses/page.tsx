export const dynamic = "force-dynamic";
import { TutorCoursesClient } from "@/components/pages/tutor/tutor-course-client";
import { getTutorCourses } from "@/data/tutor";

export default async function TutorCoursesPage() {
  const courses = await getTutorCourses();

  return <TutorCoursesClient courses={courses} />;
}
