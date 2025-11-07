

import StudentDashboardClient from "@/components/pages/student/studentdash"
import { getStudentDashboardData } from "@/data/studentdata"

export default async function StudentDashboardPage() {
  const dashboardData = await getStudentDashboardData()

  return <StudentDashboardClient {...dashboardData} />
}
