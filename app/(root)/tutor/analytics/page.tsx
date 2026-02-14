export const dynamic = "force-dynamic";

import { TutorDashboardActivity } from "@/components/pages/tutor/dashboard/tutor-dashboard-activity";
import { TutorDashboardCourses } from "@/components/pages/tutor/dashboard/tutor-dashboard-courses";
import { TutorDashboardEarnings } from "@/components/pages/tutor/dashboard/tutor-dashboard-earnings";
import { TutorDashboardPerformance } from "@/components/pages/tutor/dashboard/tutor-dashboard-performance";
import { TutorDashboardStatsGrid } from "@/components/pages/tutor/dashboard/tutor-dashboard-stats-grid";
import { getTutorDashboardData } from "@/data/tutor-dashboard";

export default async function TutorAnalyticsPage() {
  const dashboardData = await getTutorDashboardData();

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Failed to load analytics data.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <section className="py-8">
        <div className="container mx-auto px-6">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Tutor Analytics
            </h1>
            <p className="text-gray-400 mt-2">
              Track earnings, course performance, and recent activity.
            </p>
          </div>

          <TutorDashboardStatsGrid stats={dashboardData.stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <TutorDashboardEarnings
                monthlyEarnings={dashboardData.stats.monthlyEarnings}
                earningsHistory={dashboardData.stats.earningsHistory}
              />
              <TutorDashboardCourses courses={dashboardData.courses} />
            </div>
            <div className="space-y-8">
              <TutorDashboardPerformance />
              <TutorDashboardActivity
                activities={dashboardData.recentActivity}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
