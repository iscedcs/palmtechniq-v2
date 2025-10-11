import StudentCoursesClient from "@/components/pages/student/studentcous"
import { getEnrolledCourses, getAvailableCourses, getCompletedCourses } from "@/data/studentcourse"


export default async function StudentCoursesPage() {
  const [enrolledCourses, availableCourses, completedCourses] = await Promise.all([
    getEnrolledCourses(),
    getAvailableCourses(),
    getCompletedCourses(),
  ])

  return (
    <StudentCoursesClient
      enrolledCourses={enrolledCourses}
      availableCourses={availableCourses}
      completedCourses={completedCourses}
    />
  )
}
