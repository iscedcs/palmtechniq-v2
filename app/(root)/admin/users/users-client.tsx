"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  MoreVertical,
  Edit,
  Eye,
  Users,
  UserCheck,
  UserX,
  Shield,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { generateRandomAvatar } from "@/lib/utils";
import {
  getAdminUsersPageData,
  updateUserRole,
  updateUserStatus,
} from "@/actions/admin-dashboard";

type UserStats = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  admins: number;
  tutors: number;
  students: number;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  status: string;
  joinDate: string;
  courses: number;
  enrollments: number;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
};

type Props = {
  initialStats: UserStats;
  initialUsers: UserRow[];
  initialPagination: Pagination;
};

export default function AdminUsersClient({
  initialStats,
  initialUsers,
  initialPagination,
}: Props) {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("NONE");
  const [page, setPage] = useState(initialPagination.page);
  const [pageSize] = useState(initialPagination.pageSize);
  const [totalPages, setTotalPages] = useState(initialPagination.totalPages);
  const [totalCount, setTotalCount] = useState(initialPagination.totalCount);

  const fetchUsers = async ({
    nextPage = page,
    nextSearch = searchTerm,
    nextRole = roleFilter,
  }: {
    nextPage?: number;
    nextSearch?: string;
    nextRole?: string;
  } = {}) => {
    setLoading(true);
    const res = await getAdminUsersPageData({
      page: nextPage,
      pageSize,
      search: nextSearch,
      role: nextRole,
    });
    if ("users" in res) {
      setUsers(res.users || []);
      setStats(res.stats || initialStats);
      if (res.pagination) {
        setPage(res.pagination.page);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.totalCount);
      }
    }
    setLoading(false);
  };

  const refreshUsers = async () => {
    await fetchUsers();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "border-red-500 text-red-400 bg-red-500/10";
      case "TUTOR":
        return "border-purple-500 text-purple-400 bg-purple-500/10";
      case "STUDENT":
        return "border-blue-500 text-blue-400 bg-blue-500/10";
      default:
        return "border-gray-500 text-gray-400 bg-gray-500/10";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "border-green-500 text-green-400 bg-green-500/10";
      case "suspended":
        return "border-red-500 text-red-400 bg-red-500/10";
      default:
        return "border-gray-500 text-gray-400 bg-gray-500/10";
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      setSelectedIds(new Set());
      fetchUsers({ nextPage: 1, nextSearch: searchTerm, nextRole: roleFilter });
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm, roleFilter]);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(users.map((user) => user.id)));
      return;
    }
    setSelectedIds(new Set());
  };

  const toggleSelectOne = (userId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  const handleBulkAction = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one user");
      return;
    }
    if (bulkAction === "NONE") {
      toast.error("Choose a bulk action");
      return;
    }

    const actionLabel =
      bulkAction === "ACTIVATE"
        ? "activate"
        : bulkAction === "SUSPEND"
        ? "suspend"
        : bulkAction.replace("ROLE_", "set role to ").toLowerCase();

    const confirmed = window.confirm(
      `Apply "${actionLabel}" to ${selectedIds.size} user(s)?`
    );
    if (!confirmed) return;

    setBulkLoading(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const userId of selectedIds) {
      if (bulkAction === "ACTIVATE" || bulkAction === "SUSPEND") {
        const res = await updateUserStatus({
          userId,
          isActive: bulkAction === "ACTIVATE",
        });
        if ("error" in res) {
          errors.push(res.error ?? "Action failed");
        } else {
          successCount += 1;
        }
        continue;
      }

      const role = bulkAction.replace("ROLE_", "");
      const res = await updateUserRole({
        userId,
        role: role as "USER" | "STUDENT" | "TUTOR" | "ADMIN",
      });
      if ("error" in res) {
        errors.push(res.error ?? "Action failed");
      } else {
        successCount += 1;
      }
    }

    if (successCount > 0) {
      toast.success(`Updated ${successCount} user(s)`);
    }
    if (errors.length > 0) {
      toast.error(errors[0]);
    }

    setSelectedIds(new Set());
    setBulkAction("NONE");
    await fetchUsers({ nextPage: page });
    setBulkLoading(false);
  };

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString("en-NG"),
      icon: Users,
    },
    {
      label: "Active Users",
      value: stats.activeUsers.toLocaleString("en-NG"),
      icon: UserCheck,
    },
    {
      label: "Suspended Users",
      value: stats.suspendedUsers.toLocaleString("en-NG"),
      icon: UserX,
    },
    {
      label: "Admins",
      value: stats.admins.toLocaleString("en-NG"),
      icon: Shield,
    },
    {
      label: "Tutors",
      value: stats.tutors.toLocaleString("en-NG"),
      icon: BookOpen,
    },
    {
      label: "Students",
      value: stats.students.toLocaleString("en-NG"),
      icon: GraduationCap,
    },
  ];

  const selectedCount = selectedIds.size;
  const checkboxState =
    users.length === 0
      ? false
      : selectedCount === users.length
      ? true
      : selectedCount > 0
      ? "indeterminate"
      : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Users</h1>
            <p className="text-gray-400">
              Manage platform users, roles, and status.
            </p>
          </div>
          <Button
            onClick={refreshUsers}
            disabled={loading}
            variant="outline"
            className="border-neon-blue/50 bg-transparent">
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className="glass-card border-white/10">
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
              <CardTitle className="text-white">User Management</CardTitle>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 glass-card border-white/20 w-64"
                  />
                </div>
                <Select
                  value={roleFilter}
                  onValueChange={(value) => setRoleFilter(value)}>
                  <SelectTrigger className="glass-card border-white/20 w-44">
                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    <SelectItem value="ALL">All roles</SelectItem>
                    <SelectItem value="ADMIN">Admins</SelectItem>
                    <SelectItem value="TUTOR">Tutors</SelectItem>
                    <SelectItem value="STUDENT">Students</SelectItem>
                    <SelectItem value="USER">Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <p className="text-sm text-gray-400">
                {selectedCount > 0
                  ? `${selectedCount} selected`
                  : "Select users for bulk actions"}
              </p>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="glass-card border-white/20 w-52">
                    <SelectValue placeholder="Bulk action" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    <SelectItem value="NONE">Choose action</SelectItem>
                    <SelectItem value="ACTIVATE">Activate users</SelectItem>
                    <SelectItem value="SUSPEND">Suspend users</SelectItem>
                    <SelectItem value="ROLE_USER">Make USER</SelectItem>
                    <SelectItem value="ROLE_STUDENT">Make STUDENT</SelectItem>
                    <SelectItem value="ROLE_TUTOR">Make TUTOR</SelectItem>
                    <SelectItem value="ROLE_ADMIN">Make ADMIN</SelectItem>
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
                        aria-label="Select all users"
                      />
                    </TableHead>
                    <TableHead className="text-gray-400">User</TableHead>
                    <TableHead className="text-gray-400">Role</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Joined</TableHead>
                    <TableHead className="text-gray-400">Courses</TableHead>
                    <TableHead className="text-gray-400">
                      Enrollments
                    </TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell className="text-gray-400 text-sm" colSpan={8}>
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow
                        key={user.id}
                        className="border-white/10 hover:bg-white/5">
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(user.id)}
                            onCheckedChange={(checked) =>
                              toggleSelectOne(user.id, Boolean(checked))
                            }
                            aria-label={`Select ${user.name}`}
                          />
                        </TableCell>
                        <TableCell className="text-white">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarImage
                                src={user.avatar || generateRandomAvatar()}
                                alt={user.name}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-xs text-gray-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {user.joinDate}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {user.courses.toLocaleString("en-NG")}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {user.enrollments.toLocaleString("en-NG")}
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
                                onClick={() =>
                                  router.push(`/admin/users/${user.id}`)
                                }>
                                <Eye className="w-4 h-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={updatingId === user.id}
                                onClick={async () => {
                                  const action =
                                    user.status === "active"
                                      ? "suspend"
                                      : "activate";
                                  const confirmed = window.confirm(
                                    `Are you sure you want to ${action} ${user.name}?`
                                  );
                                  if (!confirmed) return;
                                  setUpdatingId(user.id);
                                  const res = await updateUserStatus({
                                    userId: user.id,
                                    isActive: user.status !== "active",
                                  });
                                  if ("error" in res) {
                                    toast.error(res.error);
                                    setUpdatingId(null);
                                    return;
                                  }
                                  toast.success("User status updated");
                                  await refreshUsers();
                                  setUpdatingId(null);
                                }}>
                                <Edit className="w-4 h-4 mr-2" />
                                {user.status === "active"
                                  ? "Suspend User"
                                  : "Activate User"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={updatingId === user.id}
                                onClick={async () => {
                                  const confirmed = window.confirm(
                                    `Set ${user.name} as USER?`
                                  );
                                  if (!confirmed) return;
                                  setUpdatingId(user.id);
                                  const res = await updateUserRole({
                                    userId: user.id,
                                    role: "USER",
                                  });
                                  if ("error" in res) {
                                    toast.error(res.error);
                                    setUpdatingId(null);
                                    return;
                                  }
                                  toast.success("Role updated");
                                  await refreshUsers();
                                  setUpdatingId(null);
                                }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Make USER
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={updatingId === user.id}
                                onClick={async () => {
                                  const confirmed = window.confirm(
                                    `Promote ${user.name} to STUDENT?`
                                  );
                                  if (!confirmed) return;
                                  setUpdatingId(user.id);
                                  const res = await updateUserRole({
                                    userId: user.id,
                                    role: "STUDENT",
                                  });
                                  if ("error" in res) {
                                    toast.error(res.error);
                                    setUpdatingId(null);
                                    return;
                                  }
                                  toast.success("Role updated");
                                  await refreshUsers();
                                  setUpdatingId(null);
                                }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Make STUDENT
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={updatingId === user.id}
                                onClick={async () => {
                                  const confirmed = window.confirm(
                                    `Promote ${user.name} to TUTOR?`
                                  );
                                  if (!confirmed) return;
                                  setUpdatingId(user.id);
                                  const res = await updateUserRole({
                                    userId: user.id,
                                    role: "TUTOR",
                                  });
                                  if ("error" in res) {
                                    toast.error(res.error);
                                    setUpdatingId(null);
                                    return;
                                  }
                                  toast.success("Role updated");
                                  await refreshUsers();
                                  setUpdatingId(null);
                                }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Make TUTOR
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={updatingId === user.id}
                                onClick={async () => {
                                  const confirmed = window.confirm(
                                    `Promote ${user.name} to ADMIN?`
                                  );
                                  if (!confirmed) return;
                                  setUpdatingId(user.id);
                                  const res = await updateUserRole({
                                    userId: user.id,
                                    role: "ADMIN",
                                  });
                                  if ("error" in res) {
                                    toast.error(res.error);
                                    setUpdatingId(null);
                                    return;
                                  }
                                  toast.success("Role updated");
                                  await refreshUsers();
                                  setUpdatingId(null);
                                }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Make ADMIN
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
                Showing {users.length.toLocaleString("en-NG")} of{" "}
                {totalCount.toLocaleString("en-NG")} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-white/10 bg-transparent"
                  disabled={loading || page <= 1}
                  onClick={async () => {
                    setSelectedIds(new Set());
                    await fetchUsers({ nextPage: page - 1 });
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
                    await fetchUsers({ nextPage: page + 1 });
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
