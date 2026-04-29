import StudentDashboardClient from "@/components/pages/student/studentdash"
import { getStudentDashboardData } from "@/data/studentdata"

export default async function StudentDashboardPage() {
  const dashboardData = await getStudentDashboardData()

  if ("error" in dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-2">Error Loading Dashboard</h1>
        <p className="text-gray-600">{dashboardData.error}</p>
      </div>
    )
  }

  return <StudentDashboardClient {...dashboardData} />
}
