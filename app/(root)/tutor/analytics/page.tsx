export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TutorDashboardEarnings } from "@/components/pages/tutor/dashboard/tutor-dashboard-earnings";
import { getTutorAnalyticsData } from "@/data/tutor-analytics";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

export default async function TutorAnalyticsPage() {
  const analyticsData = await getTutorAnalyticsData();

  if (!analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Failed to load analytics data.
      </div>
    );
  }

  const { stats, earningsHistory, coursesTable } = analyticsData;

  return (
    <div className="min-h-screen bg-background pt-24">
      <section className="py-8">
        <div className="container mx-auto px-6 space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Tutor Analytics
            </h1>
            <p className="text-gray-400 mt-2">
              Revenue breakdown, completion performance, and course insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">
                  Completed Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-white">
                  {formatCurrency(stats.totalCompletedRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.earningsChange >= 0 ? "+" : ""}
                  {stats.earningsChange}% vs last month
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">
                  Pending Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-white">
                  {formatCurrency(stats.totalPendingRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Waiting for payments to complete
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">
                  Monthly Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-white">
                  {formatCurrency(stats.monthlyCompleted)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  This month only
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-white">
                  {stats.completionRateOverall}%
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Across all courses
                </p>
              </CardContent>
            </Card>
          </div>

          <TutorDashboardEarnings
            monthlyEarnings={stats.monthlyCompleted}
            earningsHistory={earningsHistory}
          />

          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">
                Course Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-400">Course</TableHead>
                      <TableHead className="text-gray-400">
                        Completed Revenue
                      </TableHead>
                      <TableHead className="text-gray-400">
                        Pending Revenue
                      </TableHead>
                      <TableHead className="text-gray-400">
                        Enrollments
                      </TableHead>
                      <TableHead className="text-gray-400">
                        Completion
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coursesTable.length === 0 ? (
                      <TableRow className="border-white/10">
                        <TableCell
                          className="text-gray-400 text-sm"
                          colSpan={5}>
                          No analytics data yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      coursesTable.map((course) => (
                        <TableRow
                          key={course.id}
                          className="border-white/10">
                          <TableCell className="text-white font-medium">
                            {course.title}
                          </TableCell>
                          <TableCell className="text-green-400">
                            {formatCurrency(course.completedRevenue)}
                          </TableCell>
                          <TableCell className="text-yellow-400">
                            {formatCurrency(course.pendingRevenue)}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {course.enrollments.toLocaleString("en-NG")}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {course.completionRate}%
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
