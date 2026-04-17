"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  MousePointerClick,
  ShoppingCart,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  ArrowRight,
  RefreshCw,
  Activity,
} from "lucide-react";
import { NairaSign } from "@/components/shared/naira-sign-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  getAnalyticsOverview,
  getConversionFunnel,
  getRevenueAnalytics,
  getActivityTimeline,
  getTopCourses,
  getSignupAnalytics,
  type DateRange,
} from "@/actions/analytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
];

const CATEGORY_COLORS: Record<string, string> = {
  auth: "#6366f1",
  course: "#3b82f6",
  cart: "#f59e0b",
  checkout: "#10b981",
  enrollment: "#ec4899",
  application: "#8b5cf6",
  engagement: "#14b8a6",
  mentorship: "#f97316",
  program: "#ef4444",
  promotion: "#06b6d4",
  content: "#64748b",
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  desktop: <Monitor className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  tablet: <Tablet className="h-4 w-4" />,
  unknown: <Globe className="h-4 w-4" />,
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG").format(amount);
}

function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AnalyticsDashboard() {
  const [range, setRange] = useState<DateRange>("30d");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Awaited<
    ReturnType<typeof getAnalyticsOverview>
  > | null>(null);
  const [funnel, setFunnel] = useState<Awaited<
    ReturnType<typeof getConversionFunnel>
  > | null>(null);
  const [revenue, setRevenue] = useState<Awaited<
    ReturnType<typeof getRevenueAnalytics>
  > | null>(null);
  const [timeline, setTimeline] = useState<Awaited<
    ReturnType<typeof getActivityTimeline>
  > | null>(null);
  const [topCourses, setTopCourses] = useState<Awaited<
    ReturnType<typeof getTopCourses>
  > | null>(null);
  const [signups, setSignups] = useState<Awaited<
    ReturnType<typeof getSignupAnalytics>
  > | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [o, f, r, t, tc, s] = await Promise.all([
        getAnalyticsOverview(range),
        getConversionFunnel(range),
        getRevenueAnalytics(range),
        getActivityTimeline(range),
        getTopCourses(range),
        getSignupAnalytics(range),
      ]);
      setOverview(o);
      setFunnel(f);
      setRevenue(r);
      setTimeline(t);
      setTopCourses(tc);
      setSignups(s);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="ontainer mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Platform Analytics
            </h1>
            <p className="text-foreground">
              Track user activity, conversions, and revenue across the platform.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={range}
              onValueChange={(v) => setRange(v as DateRange)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={loadData}
              disabled={loading}>
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Activity className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-foreground">Total Events</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(overview?.totalEvents || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-foreground">Active Users</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(overview?.uniqueUsers || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-foreground">Revenue</p>
                  <p className="text-2xl font-bold flex items-center">
                    <NairaSign className="h-5 w-5 mr-0.5" />
                    {formatCurrency(revenue?.totalRevenue || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <MousePointerClick className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-foreground">Signups</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(signups?.totalSignups || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="courses">Top Courses</TabsTrigger>
            <TabsTrigger value="activity">Live Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Timeline Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {timeline && timeline.timeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={timeline.timeline}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d) =>
                            new Date(d).toLocaleDateString("en-NG", {
                              month: "short",
                              day: "numeric",
                            })
                          }
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip
                          labelFormatter={(d) =>
                            new Date(d).toLocaleDateString("en-NG", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.1}
                          name="Total Events"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-foreground">
                      No activity data yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Event Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {overview && overview.categoryBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={overview.categoryBreakdown}
                          dataKey="count"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }: any) =>
                            `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                          }>
                          {overview.categoryBreakdown.map(
                            (entry: any, i: any) => (
                              <Cell
                                key={entry.category}
                                fill={
                                  CATEGORY_COLORS[entry.category] ||
                                  COLORS[i % COLORS.length]
                                }
                              />
                            ),
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-foreground">
                      No category data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Events */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Top Events</CardTitle>
                </CardHeader>
                <CardContent>
                  {overview && overview.topEvents.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart
                        data={overview.topEvents}
                        layout="vertical"
                        margin={{ left: 100 }}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="event"
                          width={120}
                          className="text-xs"
                          tickFormatter={(v) => v.replace(/_/g, " ")}
                        />
                        <Tooltip
                          formatter={(v: any) => [formatNumber(Number(v)), "Count"]}
                        />
                        <Bar
                          dataKey="count"
                          fill="#6366f1"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-foreground">
                      No events tracked yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Device & Browser */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Devices</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {overview?.deviceBreakdown.map((d: any) => {
                      const total = overview.deviceBreakdown.reduce(
                        (s: any, x: any) => s + x.count,
                        0,
                      );
                      const pct = total > 0 ? (d.count / total) * 100 : 0;
                      return (
                        <div key={d.device} className="flex items-center gap-3">
                          {DEVICE_ICONS[d.device] || DEVICE_ICONS.unknown}
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="capitalize">{d.device}</span>
                              <span className="text-foreground">
                                {d.count} ({pct.toFixed(0)}%)
                              </span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>
                        </div>
                      );
                    })}
                    {(!overview || overview.deviceBreakdown.length === 0) && (
                      <p className="text-sm text-foreground text-center py-4">
                        No device data
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Browsers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {overview?.browserBreakdown.map((b: any) => {
                      const total = overview.browserBreakdown.reduce(
                        (s: any, x: any) => s + x.count,
                        0,
                      );
                      const pct = total > 0 ? (b.count / total) * 100 : 0;
                      return (
                        <div
                          key={b.browser}
                          className="flex items-center justify-between text-sm">
                          <span>{b.browser}</span>
                          <Badge variant="secondary">{pct.toFixed(0)}%</Badge>
                        </div>
                      );
                    })}
                    {(!overview || overview.browserBreakdown.length === 0) && (
                      <p className="text-sm text-foreground text-center py-4">
                        No browser data
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Conversion Funnel Tab */}
          <TabsContent value="funnel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Sales Conversion Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {funnel && funnel.steps.some((s) => s.count > 0) ? (
                  <div className="space-y-4">
                    {funnel.steps.map((step, i) => {
                      const maxCount = Math.max(
                        ...funnel.steps.map((s) => s.count),
                        1,
                      );
                      const pct = (step.count / maxCount) * 100;
                      const prevCount =
                        i > 0 ? funnel.steps[i - 1]!.count : step.count;
                      const dropoff =
                        prevCount > 0
                          ? ((1 - step.count / prevCount) * 100).toFixed(1)
                          : "0";

                      return (
                        <div key={step.name}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {step.name}
                              </span>
                              {i > 0 && Number(dropoff) > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs">
                                  -{dropoff}%
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-foreground font-mono">
                              {formatNumber(step.count)}
                            </span>
                          </div>
                          <div className="relative">
                            <div className="h-8 bg-muted rounded-md overflow-hidden">
                              <div
                                className="h-full rounded-md transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: COLORS[i % COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                          {i < funnel.steps.length - 1 && (
                            <div className="flex justify-center py-1">
                              <ArrowRight className="h-4 w-4 text-foreground rotate-90" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-foreground">
                    No funnel data yet. Events will appear as users interact
                    with the platform.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold flex items-center">
                    <NairaSign className="h-5 w-5 mr-0.5" />
                    {formatCurrency(revenue?.totalRevenue || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-foreground">Course Revenue</p>
                  <p className="text-2xl font-bold flex items-center">
                    <NairaSign className="h-5 w-5 mr-0.5" />
                    {formatCurrency(revenue?.courseRevenue || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-foreground">Program Revenue</p>
                  <p className="text-2xl font-bold flex items-center">
                    <NairaSign className="h-5 w-5 mr-0.5" />
                    {formatCurrency(revenue?.programRevenue || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {revenue && revenue.dailyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={revenue.dailyRevenue}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) =>
                          new Date(d).toLocaleDateString("en-NG", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                        className="text-xs"
                      />
                      <YAxis
                        className="text-xs"
                        tickFormatter={(v) => `₦${formatNumber(v)}`}
                      />
                      <Tooltip
                        labelFormatter={(d) =>
                          new Date(d).toLocaleDateString("en-NG", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })
                        }
                        formatter={(v: any) => [
                          `₦${formatCurrency(Number(v))}`,
                          "Revenue",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-foreground">
                    No revenue data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Most Interacted Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topCourses && topCourses.courses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Cart Adds</TableHead>
                        <TableHead className="text-right">Purchases</TableHead>
                        <TableHead className="text-right">Reviews</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCourses.courses.map((course: any) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {course.thumbnail && (
                                <img
                                  src={course.thumbnail}
                                  alt=""
                                  className="h-10 w-16 rounded object-cover"
                                />
                              )}
                              <span className="font-medium text-sm max-w-[200px] truncate">
                                {course.title}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {course.breakdown.course_viewed || 0}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {course.breakdown.added_to_cart || 0}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {course.breakdown.checkout_completed || 0}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {course.breakdown.review_submitted || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">
                              {course.totalInteractions}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-foreground">
                    No course interaction data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Activity Feed Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Recent Platform Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overview && overview.recentEvents.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {overview.recentEvents.map((event: any) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              CATEGORY_COLORS[event.category] || "#64748b",
                          }}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={event.user?.avatar || ""} />
                          <AvatarFallback className="text-xs">
                            {event.user?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">
                              {event.user?.name || "Anonymous"}
                            </span>{" "}
                            <span className="text-foreground">
                              {event.action}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 text-xs text-foreground mt-0.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0">
                              {event.category}
                            </Badge>
                            {event.device && (
                              <span className="capitalize">{event.device}</span>
                            )}
                            {event.path && (
                              <span className="truncate max-w-[200px]">
                                {event.path}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-xs text-foreground">
                            {timeAgo(event.createdAt)}
                          </span>
                          {event.value != null && event.value > 0 && (
                            <span className="text-xs font-medium text-emerald-600 flex items-center">
                              <NairaSign className="h-3 w-3" />
                              {formatCurrency(event.value)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-foreground">
                    No activity recorded yet. Events will appear as users
                    interact with the platform.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
