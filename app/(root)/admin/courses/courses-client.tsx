"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  MoreVertical,
  Edit,
  Eye,
  BookOpen,
  Globe,
  Archive,
  Ban,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  getAdminCoursesPageData,
  updateCourseStatus,
} from "@/actions/admin-dashboard";

type CourseStats = {
  totalCourses: number;
  draft: number;
  published: number;
  archived: number;
  suspended: number;
};

type CourseRow = {
  id: string;
  title: string;
  status: string;
  price: number;
  revenue: number;
  enrollments: number;
  tutor: string;
  createdAt: string;
  slug: string | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
};

type Props = {
  initialStats: CourseStats;
  initialCourses: CourseRow[];
  initialPagination: Pagination;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

export default function AdminCoursesClient({
  initialStats,
  initialCourses,
  initialPagination,
}: Props) {
  const router = useRouter();
  const [stats, setStats] = useState<CourseStats>(initialStats);
  const [courses, setCourses] = useState<CourseRow[]>(initialCourses);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("NONE");
  const [page, setPage] = useState(initialPagination.page);
  const [pageSize] = useState(initialPagination.pageSize);
  const [totalPages, setTotalPages] = useState(initialPagination.totalPages);
  const [totalCount, setTotalCount] = useState(initialPagination.totalCount);

  const fetchCourses = async ({
    nextPage = page,
    nextSearch = searchTerm,
    nextStatus = statusFilter,
  }: {
    nextPage?: number;
    nextSearch?: string;
    nextStatus?: string;
  } = {}) => {
    setLoading(true);
    const res = await getAdminCoursesPageData({
      page: nextPage,
      pageSize,
      search: nextSearch,
      status: nextStatus,
    });
    if ("courses" in res) {
      setCourses(res.courses || []);
      setStats(res.stats || initialStats);
      if (res.pagination) {
        setPage(res.pagination.page);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.totalCount);
      }
    }
    setLoading(false);
  };

  const refreshCourses = async () => {
    await fetchCourses();
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      setSelectedIds(new Set());
      fetchCourses({ nextPage: 1, nextSearch: searchTerm, nextStatus: statusFilter });
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "border-green-500 text-green-400 bg-green-500/10";
      case "DRAFT":
        return "border-gray-500 text-gray-400 bg-gray-500/10";
      case "ARCHIVED":
        return "border-yellow-500 text-yellow-400 bg-yellow-500/10";
      case "SUSPENDED":
        return "border-red-500 text-red-400 bg-red-500/10";
      default:
        return "border-gray-500 text-gray-400 bg-gray-500/10";
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(courses.map((course) => course.id)));
      return;
    }
    setSelectedIds(new Set());
  };

  const toggleSelectOne = (courseId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(courseId);
      } else {
        next.delete(courseId);
      }
      return next;
    });
  };

  const handleBulkAction = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one course");
      return;
    }
    if (bulkAction === "NONE") {
      toast.error("Choose a bulk action");
      return;
    }

    const actionLabel =
      bulkAction === "PUBLISH"
        ? "publish"
        : bulkAction === "ARCHIVE"
        ? "archive"
        : "suspend";

    const confirmed = window.confirm(
      `Apply "${actionLabel}" to ${selectedIds.size} course(s)?`
    );
    if (!confirmed) return;

    setBulkLoading(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const courseId of selectedIds) {
      const status =
        bulkAction === "PUBLISH"
          ? "PUBLISHED"
          : bulkAction === "ARCHIVE"
          ? "ARCHIVED"
          : "SUSPENDED";
      const res = await updateCourseStatus({ courseId, status });
      if ("error" in res) {
        errors.push(res.error ?? "Action failed");
      } else {
        successCount += 1;
      }
    }

    if (successCount > 0) {
      toast.success(`Updated ${successCount} course(s)`);
    }
    if (errors.length > 0) {
      toast.error(errors[0]);
    }

    setSelectedIds(new Set());
    setBulkAction("NONE");
    await fetchCourses({ nextPage: page });
    setBulkLoading(false);
  };

  const statCards = [
    {
      label: "Total Courses",
      value: stats.totalCourses.toLocaleString("en-NG"),
      icon: BookOpen,
    },
    {
      label: "Published",
      value: stats.published.toLocaleString("en-NG"),
      icon: Globe,
    },
    {
      label: "Drafts",
      value: stats.draft.toLocaleString("en-NG"),
      icon: Layers,
    },
    {
      label: "Archived",
      value: stats.archived.toLocaleString("en-NG"),
      icon: Archive,
    },
    {
      label: "Suspended",
      value: stats.suspended.toLocaleString("en-NG"),
      icon: Ban,
    },
  ];

  const selectedCount = selectedIds.size;
  const checkboxState =
    courses.length === 0
      ? false
      : selectedCount === courses.length
      ? true
      : selectedCount > 0
      ? "indeterminate"
      : false;
  const tabValue = statusFilter === "DRAFT" ? "pending" : "all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Courses</h1>
            <p className="text-gray-400">
              Manage course status, performance, and visibility.
            </p>
          </div>
          <Button
            onClick={refreshCourses}
            disabled={loading}
            variant="outline"
            className="border-neon-blue/50 bg-transparent">
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.label} className="glass-card border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-gray-400">
                  {stat.label}
                </CardTitle>
                <stat.icon className="w-4 h-4 text-neon-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card border-white/10">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-white">Course Management</CardTitle>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 glass-card border-white/20 w-64"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}>
                  <SelectTrigger className="glass-card border-white/20 w-48">
                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    <SelectItem value="ALL">All statuses</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                className={
                  tabValue === "all"
                    ? "border-neon-blue/50 bg-neon-blue/10"
                    : "border-white/10 bg-transparent"
                }
                onClick={() => setStatusFilter("ALL")}>
                All Courses
              </Button>
              <Button
                variant="outline"
                className={
                  tabValue === "pending"
                    ? "border-neon-blue/50 bg-neon-blue/10"
                    : "border-white/10 bg-transparent"
                }
                onClick={() => setStatusFilter("DRAFT")}>
                Pending Approval
              </Button>
            </div>
            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <p className="text-sm text-gray-400">
                {selectedCount > 0
                  ? `${selectedCount} selected`
                  : "Select courses for bulk actions"}
              </p>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="glass-card border-white/20 w-52">
                    <SelectValue placeholder="Bulk action" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    <SelectItem value="NONE">Choose action</SelectItem>
                    <SelectItem value="PUBLISH">Publish courses</SelectItem>
                    <SelectItem value="ARCHIVE">Archive courses</SelectItem>
                    <SelectItem value="SUSPEND">Suspend courses</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleBulkAction}
                  disabled={
                    bulkLoading ||
                    selectedCount === 0 ||
                    bulkAction === "NONE"
                  }
                  variant="outline"
                  className="border-neon-blue/50 bg-transparent">
                  {bulkLoading ? "Applying..." : "Apply"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-400 w-10">
                      <Checkbox
                        checked={checkboxState}
                        onCheckedChange={(checked) =>
                          toggleSelectAll(Boolean(checked))
                        }
                        aria-label="Select all courses"
                      />
                    </TableHead>
                    <TableHead className="text-gray-400">Course</TableHead>
                    <TableHead className="text-gray-400">Tutor</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Price</TableHead>
                    <TableHead className="text-gray-400">
                      Enrollments
                    </TableHead>
                    <TableHead className="text-gray-400">Revenue</TableHead>
                    <TableHead className="text-gray-400">Created</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell className="text-gray-400 text-sm" colSpan={9}>
                        No courses found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    courses.map((course) => (
                      <TableRow
                        key={course.id}
                        className="border-white/10 hover:bg-white/5">
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(course.id)}
                            onCheckedChange={(checked) =>
                              toggleSelectOne(course.id, Boolean(checked))
                            }
                            aria-label={`Select ${course.title}`}
                          />
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {course.title}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {course.tutor}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(course.status)}>
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatCurrency(course.price)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {course.enrollments.toLocaleString("en-NG")}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatCurrency(course.revenue)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {course.createdAt}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="glass-card border-white/10">
                              <DropdownMenuItem
                                onClick={() => {
                                  router.push(`/courses/${course.id}`);
                                }}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Course
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={updatingId === course.id}
                                onClick={async () => {
                                  const action =
                                    course.status === "PUBLISHED"
                                      ? "archive"
                                      : "publish";
                                  const confirmed = window.confirm(
                                    `Are you sure you want to ${action} "${course.title}"?`
                                  );
                                  if (!confirmed) return;
                                  setUpdatingId(course.id);
                                  const res = await updateCourseStatus({
                                    courseId: course.id,
                                    status:
                                      course.status === "PUBLISHED"
                                        ? "ARCHIVED"
                                        : "PUBLISHED",
                                  });
                                  if ("error" in res) {
                                    toast.error(res.error);
                                    setUpdatingId(null);
                                    return;
                                  }
                                  toast.success("Course status updated");
                                  await fetchCourses({ nextPage: page });
                                  setUpdatingId(null);
                                }}>
                                <Edit className="w-4 h-4 mr-2" />
                                {course.status === "PUBLISHED"
                                  ? "Archive"
                                  : "Publish"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={
                                  updatingId === course.id ||
                                  course.status === "SUSPENDED"
                                }
                                onClick={async () => {
                                  const confirmed = window.confirm(
                                    `Suspend "${course.title}"?`
                                  );
                                  if (!confirmed) return;
                                  setUpdatingId(course.id);
                                  const res = await updateCourseStatus({
                                    courseId: course.id,
                                    status: "SUSPENDED",
                                  });
                                  if ("error" in res) {
                                    toast.error(res.error);
                                    setUpdatingId(null);
                                    return;
                                  }
                                  toast.success("Course suspended");
                                  await fetchCourses({ nextPage: page });
                                  setUpdatingId(null);
                                }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm text-gray-400">
              <div>
                Showing {courses.length.toLocaleString("en-NG")} of{" "}
                {totalCount.toLocaleString("en-NG")} courses
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-white/10 bg-transparent"
                  disabled={loading || page <= 1}
                  onClick={async () => {
                    setSelectedIds(new Set());
                    await fetchCourses({ nextPage: page - 1 });
                  }}>
                  Previous
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  className="border-white/10 bg-transparent"
                  disabled={loading || page >= totalPages}
                  onClick={async () => {
                    setSelectedIds(new Set());
                    await fetchCourses({ nextPage: page + 1 });
                  }}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
