import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatDateTime = (date: Date) =>
  date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function getStatusClass(status: string) {
  if (status === "NEW") return "border-yellow-500 text-yellow-400 bg-yellow-500/10";
  if (status === "CONTACTED")
    return "border-blue-500 text-blue-400 bg-blue-500/10";
  return "border-green-500 text-green-400 bg-green-500/10";
}

export default async function AdminAdvisorPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/courses");
  }

  const [followUps, followUpStatusCounts, topCourseDemand, topCategoryDemand] =
    await Promise.all([
      db.advisorFollowUp.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: { select: { id: true, name: true, email: true } },
          advisorTurn: {
            select: {
              userMessage: true,
              assistantMessage: true,
            },
          },
        },
      }),
      db.advisorFollowUp.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.advisorRecommendation.groupBy({
        by: ["courseId"],
        where: { courseId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { _all: "desc" } },
        take: 10,
      }),
      db.advisorRecommendation.groupBy({
        by: ["categoryId"],
        where: { categoryId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { _all: "desc" } },
        take: 10,
      }),
    ]);

  const courseIds = topCourseDemand
    .map((entry) => entry.courseId)
    .filter((id): id is string => Boolean(id));
  const categoryIds = topCategoryDemand
    .map((entry) => entry.categoryId)
    .filter((id): id is string => Boolean(id));

  const [courses, categories] = await Promise.all([
    courseIds.length
      ? db.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, title: true, status: true },
        })
      : [],
    categoryIds.length
      ? db.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const courseById = new Map(courses.map((course) => [course.id, course]));
  const categoryById = new Map(
    categories.map((category) => [category.id, category])
  );
  const statusMap = new Map(
    followUpStatusCounts.map((entry) => [entry.status, entry._count._all])
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">
            AI Advisor Leads
          </h1>
          <p className="text-gray-400">
            Track follow-up requests and demand trends from course advisor chats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">
                Total Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-white">
              {followUps.length}
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">New</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-yellow-400">
              {statusMap.get("NEW") ?? 0}
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Contacted</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-blue-400">
              {statusMap.get("CONTACTED") ?? 0}
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Closed</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-green-400">
              {statusMap.get("CLOSED") ?? 0}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Top Requested Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCourseDemand.length === 0 ? (
                  <p className="text-sm text-gray-400">No course demand data yet.</p>
                ) : (
                  topCourseDemand.map((entry) => {
                    const course = entry.courseId
                      ? courseById.get(entry.courseId)
                      : null;
                    return (
                      <div
                        key={entry.courseId || `course-null-${entry._count._all}`}
                        className="flex items-center justify-between border border-white/10 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-white text-sm font-medium">
                            {course?.title || "Unknown course"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {course?.status || "Unavailable"}
                          </p>
                        </div>
                        <Badge className="border-neon-blue/40 text-neon-blue bg-neon-blue/10">
                          {entry._count._all}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Top Requested Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCategoryDemand.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No category demand data yet.
                  </p>
                ) : (
                  topCategoryDemand.map((entry) => {
                    const category = entry.categoryId
                      ? categoryById.get(entry.categoryId)
                      : null;
                    return (
                      <div
                        key={
                          entry.categoryId || `category-null-${entry._count._all}`
                        }
                        className="flex items-center justify-between border border-white/10 rounded-lg px-3 py-2">
                        <p className="text-white text-sm font-medium">
                          {category?.name || "Unknown category"}
                        </p>
                        <Badge className="border-neon-purple/40 text-neon-purple bg-neon-purple/10">
                          {entry._count._all}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Follow-up Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-400">Created</TableHead>
                    <TableHead className="text-gray-400">Lead</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Message Intent</TableHead>
                    <TableHead className="text-gray-400">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followUps.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell colSpan={5} className="text-gray-400 text-sm">
                        No follow-up requests submitted yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    followUps.map((row) => (
                      <TableRow key={row.id} className="border-white/10">
                        <TableCell className="text-gray-300">
                          {formatDateTime(row.createdAt)}
                        </TableCell>
                        <TableCell>
                          <p className="text-white text-sm font-medium">{row.name}</p>
                          <p className="text-gray-400 text-xs">{row.email}</p>
                          {row.user?.name ? (
                            <p className="text-gray-500 text-xs mt-1">
                              User: {row.user.name}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusClass(row.status)}>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm max-w-[320px]">
                          {row.advisorTurn?.userMessage || "N/A"}
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm max-w-[320px]">
                          {row.note || "N/A"}
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
    </div>
  );
}
