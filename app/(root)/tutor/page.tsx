import { TutorDashboardActivity } from "@/components/pages/tutor/dashboard/tutor-dashboard-activity";
import { TutorDashboardCourses } from "@/components/pages/tutor/dashboard/tutor-dashboard-courses";
import { TutorDashboardEarnings } from "@/components/pages/tutor/dashboard/tutor-dashboard-earnings";
import { TutorDashboardHeader } from "@/components/pages/tutor/dashboard/tutor-dashboard-header";
import { TutorDashboardMentorships } from "@/components/pages/tutor/dashboard/tutor-dashboard-mentorships";
import { TutorDashboardPerformance } from "@/components/pages/tutor/dashboard/tutor-dashboard-performance";
import { TutorDashboardProjects } from "@/components/pages/tutor/dashboard/tutor-dashboard-projects";
import { TutorDashboardStatsGrid } from "@/components/pages/tutor/dashboard/tutor-dashboard-stats-grid";
import { getTutorDashboardData } from "@/data/tutor-dashboard";

export default async function TutorDashboardPage() {
  const dashboardData = await getTutorDashboardData();

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Failed to load dashboard data.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 sm:pt-24 pb-16">
      {/* Hero */}
      <TutorDashboardHeader />
      <section className="py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Stats */}
          <TutorDashboardStatsGrid stats={dashboardData.stats} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* LEFT (Main Content) */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              <TutorDashboardEarnings
                monthlyEarnings={dashboardData.stats.monthlyEarnings}
                earningsHistory={dashboardData.stats.earningsHistory}
              />
              <TutorDashboardCourses courses={dashboardData.courses} />
              <TutorDashboardProjects
                projects={dashboardData.pendingProjects}
              />
            </div>

            {/* RIGHT (Sidebar) */}
            <div className="space-y-6 sm:space-y-8">
              <TutorDashboardMentorships
                mentorships={dashboardData.upcomingMentorships}
              />
              <TutorDashboardActivity
                activities={dashboardData.recentActivity}
              />
              {/* <TutorDashboardPerformance /> */}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
