
import StudentProgressClient from "@/components/pages/student/progress/progress-comp"
import { getStudentProgressData } from "@/data/studentprog"

export default async function StudentProgressPage() {
  const progressData = await getStudentProgressData()
  
  return <StudentProgressClient {...progressData} />
}