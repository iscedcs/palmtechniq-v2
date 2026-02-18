"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  BookOpen,
  TrendingUp,
  Activity,
  UserCheck,
  AlertTriangle,
  Star,
  BarChart3,
  Settings,
  Shield,
  Bell,
  Download,
  Filter,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Plus,
  FileText,
  Lock,
  Unlock,
  X,
  Copy,
  Clock,
  Globe,
} from "lucide-react";
import { NairaSign } from "@/components/shared/naira-sign-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { generateRandomAvatar } from "@/lib/utils";
import { getAdminDashboardData } from "@/actions/admin-dashboard";
import {
  updateCourseStatus,
  createUserByAdmin,
  updateUserRole,
  updateUserStatus,
} from "@/actions/admin-dashboard";
import {
  getSecurityDashboardSummary,
  getBlockedIPs,
  getLockedAccounts,
  manuallyBlockIP,
  manuallyUnblockIP,
  unlockUserAccount,
  getSuspiciousActivityReport,
  getLoginAttempts,
} from "@/actions/security-admin";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StatCard = {
  title: string;
  value: string;
  change?: string;
  trend?: string;
  icon: string;
  color: string;
  bgColor: string;
};

type RecentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  joinDate: string;
  status: string;
  courses: number;
};

type TopCourse = {
  id: string;
  title: string;
  instructor: string;
  students: number;
  revenue: string;
  rating: number;
  completion: number;
};

type SystemAlert = {
  id: string;
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  timestamp: string;
};

type AnalyticsStat = {
  label: string;
  value: string;
};

type UserTableRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  status: string;
  joinDate: string;
};

type CourseTableRow = {
  id: string;
  title: string;
  status: string;
  price: number;
  revenue: number;
  enrollments: number;
  tutor: string;
  createdAt: string;
};

const STAT_ICON_MAP = {
  Users,
  BookOpen,
  NairaSign,
  TrendingUp,
};

export default function AdminDashboard() {
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("USER");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [statsCards, setStatsCards] = useState<StatCard[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [analyticsStats, setAnalyticsStats] = useState<AnalyticsStat[]>([]);
  const [usersTable, setUsersTable] = useState<UserTableRow[]>([]);
  const [coursesTable, setCoursesTable] = useState<CourseTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Security state
  const [securityDashboard, setSecurityDashboard] = useState<any>(null);
  const [blockedIPs, setBlockedIPs] = useState<any[]>([]);
  const [lockedAccounts, setLockedAccounts] = useState<any[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<any>(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [blockingIP, setBlockingIP] = useState<string | null>(null);
  const [unblockingIP, setUnblockingIP] = useState<string | null>(null);
  const [unblockingUser, setUnblockingUser] = useState<string | null>(null);
  const [newBlockIP, setNewBlockIP] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockIPDialogOpen, setBlockIPDialogOpen] = useState(false);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = normalizedSearch
    ? usersTable.filter((user) =>
        [user.name, user.email, user.role]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch)),
      )
    : usersTable;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);

  const loadSecurityData = async () => {
    try {
      setSecurityLoading(true);
      const [dashboard, blocked, locked, suspicious] = await Promise.all([
        getSecurityDashboardSummary(),
        getBlockedIPs(),
        getLockedAccounts(),
        getSuspiciousActivityReport(),
      ]);

      if (dashboard && "data" in dashboard)
        setSecurityDashboard(dashboard.data);
      if (blocked && "data" in blocked) setBlockedIPs(blocked.data || []);
      if (locked && "data" in locked) setLockedAccounts(locked.data || []);
      if (suspicious && "data" in suspicious)
        setSuspiciousActivity(suspicious.data);
    } catch (error) {
      console.error("Error loading security data:", error);
      toast.error("Failed to load security data");
    } finally {
      setSecurityLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getAdminDashboardData();
        if (!mounted) return;
        if ("statsCards" in res) {
          setStatsCards(res.statsCards || []);
          setRecentUsers(res.recentUsers || []);
          setTopCourses(res.topCourses || []);
          setSystemAlerts(res.systemAlerts || []);
          setAnalyticsStats(res.analyticsStats || []);
          setUsersTable(res.usersTable || []);
          setCoursesTable(res.courses || []);
        }
        // Also load security data
        await loadSecurityData();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshDashboard = async () => {
    const res = await getAdminDashboardData();
    if ("statsCards" in res) {
      setStatsCards(res.statsCards || []);
      setRecentUsers(res.recentUsers || []);
      setTopCourses(res.topCourses || []);
      setSystemAlerts(res.systemAlerts || []);
      setAnalyticsStats(res.analyticsStats || []);
      setUsersTable(res.usersTable || []);
      setCoursesTable(res.courses || []);
    }
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
      case "pending":
        return "border-yellow-500 text-yellow-400 bg-yellow-500/10";
      case "suspended":
        return "border-red-500 text-red-400 bg-red-500/10";
      default:
        return "border-gray-500 text-gray-400 bg-gray-500/10";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "success":
        return <UserCheck className="w-4 h-4 text-green-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleExportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      statsCards,
      analyticsStats,
      usersTable,
      coursesTable,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `admin-export-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setCreatingUser(true);
    const res = await createUserByAdmin({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole as "USER" | "STUDENT" | "MENTOR" | "TUTOR" | "ADMIN",
    });
    if ("error" in res) {
      toast.error(res.error);
      setCreatingUser(false);
      return;
    }
    toast.success("User created and reset email sent");
    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole("USER");
    setAddUserOpen(false);
    await refreshDashboard();
    setCreatingUser(false);
  };

  // Security handlers
  const handleBlockIP = async () => {
    if (!newBlockIP.trim()) {
      toast.error("IP address is required");
      return;
    }
    setBlockingIP(newBlockIP);
    const res = await manuallyBlockIP(newBlockIP, blockReason || "Admin block");
    setBlockingIP(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(`IP ${newBlockIP} has been blocked`);
    setNewBlockIP("");
    setBlockReason("");
    setBlockIPDialogOpen(false);
    await loadSecurityData();
  };

  const handleUnblockIP = async (ip: string) => {
    setUnblockingIP(ip);
    const res = await manuallyUnblockIP(ip);
    setUnblockingIP(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(`IP ${ip} has been unblocked`);
    await loadSecurityData();
  };

  const handleUnlockUser = async (userId: string) => {
    setUnblockingUser(userId);
    const res = await unlockUserAccount(userId);
    setUnblockingUser(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("User account has been unlocked");
    await loadSecurityData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">
              Manage your platform, users, and analytics from one central
              location
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Button
              asChild
              variant="outline"
              className="border-neon-purple/50 hover:bg-neon-purple/10 bg-transparent">
              <Link href="/admin/applications">
                <FileText className="w-4 h-4 mr-2" />
                Applications
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={handleExportData}
              className="border-neon-blue/50 hover:bg-neon-blue/10 bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button
              onClick={() => setAddUserOpen(true)}
              className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </motion.div>
        <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
          <DialogContent className="glass-card border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Add User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new user and send them a password reset email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Full name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="glass-card border-white/20"
              />
              <Input
                placeholder="Email address"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="glass-card border-white/20"
              />
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger className="glass-card border-white/20">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="MENTOR">Mentor</SelectItem>
                  <SelectItem value="TUTOR">Tutor</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-white/10 bg-transparent"
                onClick={() => setAddUserOpen(false)}
                disabled={creatingUser}>
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={creatingUser}
                className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80">
                {creatingUser ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}>
          {statsCards.length === 0 && !loading ? (
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 text-gray-400">
                No stats available yet.
              </CardContent>
            </Card>
          ) : (
            statsCards.map((stat, index) => {
              const Icon =
                STAT_ICON_MAP[stat.icon as keyof typeof STAT_ICON_MAP] || Users;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}>
                  <Card className="glass-card border-white/10 hover-glow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">
                            {stat.title}
                          </p>
                          <p className="text-2xl font-bold text-white mt-1">
                            {stat.value}
                          </p>
                          {stat.change ? (
                            <div className="flex items-center mt-2">
                              <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
                              <span className="text-green-400 text-xs font-medium">
                                {stat.change}
                              </span>
                              <span className="text-gray-500 text-xs ml-1">
                                vs last month
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                          <Icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}>
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="space-y-6">
            <TabsList className="glass-card border-white/10 p-1">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-neon-blue/20">
                <Activity className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-neon-blue/20">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className="data-[state=active]:bg-neon-blue/20">
                <BookOpen className="w-4 h-4 mr-2" />
                Courses
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-neon-blue/20">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-neon-blue/20">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-neon-blue/20">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Users */}
                <div className="lg:col-span-2">
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">
                          Recent Users
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-neon-blue hover:text-neon-blue/80">
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentUsers.length === 0 ? (
                          <p className="text-gray-400 text-sm">
                            No recent users yet.
                          </p>
                        ) : (
                          recentUsers.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage
                                    src={user.avatar || generateRandomAvatar()}
                                    alt={user.name}
                                  />
                                  <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                                    {user.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-white">
                                    {user.name}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getRoleColor(user.role)}>
                                  {user.role}
                                </Badge>
                                <Badge className={getStatusColor(user.status)}>
                                  {user.status}
                                </Badge>
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
                                    <DropdownMenuItem>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-400">
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* System Alerts */}
                <div>
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-neon-blue" />
                        System Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {systemAlerts.length === 0 ? (
                          <p className="text-gray-400 text-sm">
                            No system alerts.
                          </p>
                        ) : (
                          systemAlerts.map((alert) => (
                            <div
                              key={alert.id}
                              className="p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                              <div className="flex items-start gap-3">
                                {getAlertIcon(alert.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-white text-sm">
                                    {alert.title}
                                  </p>
                                  <p className="text-gray-400 text-xs mt-1">
                                    {alert.message}
                                  </p>
                                  <p className="text-gray-500 text-xs mt-2">
                                    {alert.timestamp}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Top Courses */}
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Top Performing Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-gray-400">
                            Course
                          </TableHead>
                          <TableHead className="text-gray-400">
                            Instructor
                          </TableHead>
                          <TableHead className="text-gray-400">
                            Students
                          </TableHead>
                          <TableHead className="text-gray-400">
                            Revenue
                          </TableHead>
                          <TableHead className="text-gray-400">
                            Rating
                          </TableHead>
                          <TableHead className="text-gray-400">
                            Completion
                          </TableHead>
                          <TableHead className="text-gray-400">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topCourses.length === 0 ? (
                          <TableRow className="border-white/10">
                            <TableCell
                              className="text-gray-400 text-sm"
                              colSpan={7}>
                              No course data yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          topCourses.map((course) => (
                            <TableRow
                              key={course.id}
                              className="border-white/10 hover:bg-white/5">
                              <TableCell className="font-medium text-white">
                                {course.title}
                              </TableCell>
                              <TableCell className="text-gray-300">
                                {course.instructor}
                              </TableCell>
                              <TableCell className="text-gray-300">
                                {course.students.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-green-400 font-medium">
                                {course.revenue}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-gray-300">
                                    {course.rating}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={course.completion}
                                    className="w-16 h-2"
                                  />
                                  <span className="text-gray-300 text-sm">
                                    {course.completion}%
                                  </span>
                                </div>
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
                                    <DropdownMenuItem>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-400">
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Archive Course
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-white">
                      User Management
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 glass-card border-white/20 w-64"
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="border-neon-blue/50 bg-transparent">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-gray-400">User</TableHead>
                          <TableHead className="text-gray-400">Role</TableHead>
                          <TableHead className="text-gray-400">
                            Status
                          </TableHead>
                          <TableHead className="text-gray-400">
                            Joined
                          </TableHead>
                          <TableHead className="text-gray-400">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow className="border-white/10">
                            <TableCell
                              className="text-gray-400 text-sm"
                              colSpan={5}>
                              No users found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <TableRow
                              key={user.id}
                              className="border-white/10 hover:bg-white/5">
                              <TableCell className="text-white">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-9 h-9">
                                    <AvatarImage
                                      src={
                                        user.avatar || generateRandomAvatar()
                                      }
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
                                    <DropdownMenuItem>
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
                                          `Are you sure you want to ${action} ${user.name}?`,
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
                                        await refreshDashboard();
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
                                          `Set ${user.name} as USER?`,
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
                                        await refreshDashboard();
                                        setUpdatingId(null);
                                      }}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Make USER
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={updatingId === user.id}
                                      onClick={async () => {
                                        const confirmed = window.confirm(
                                          `Promote ${user.name} to STUDENT?`,
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
                                        await refreshDashboard();
                                        setUpdatingId(null);
                                      }}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Make STUDENT
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={updatingId === user.id}
                                      onClick={async () => {
                                        const confirmed = window.confirm(
                                          `Promote ${user.name} to TUTOR?`,
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
                                        await refreshDashboard();
                                        setUpdatingId(null);
                                      }}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Make TUTOR
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={updatingId === user.id}
                                      onClick={async () => {
                                        const confirmed = window.confirm(
                                          `Promote ${user.name} to ADMIN?`,
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
                                        await refreshDashboard();
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-6">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Course Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-gray-400">
                            Course
                          </TableHead>
                          <TableHead className="text-gray-400">Tutor</TableHead>
                          <TableHead className="text-gray-400">
                            Status
                          </TableHead>
                          <TableHead className="text-gray-400">Price</TableHead>
                          <TableHead className="text-gray-400">
                            Enrollments
                          </TableHead>
                          <TableHead className="text-gray-400">
                            Revenue
                          </TableHead>
                          <TableHead className="text-gray-400">
                            Created
                          </TableHead>
                          <TableHead className="text-gray-400">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coursesTable.length === 0 ? (
                          <TableRow className="border-white/10">
                            <TableCell
                              className="text-gray-400 text-sm"
                              colSpan={7}>
                              No courses available.
                            </TableCell>
                          </TableRow>
                        ) : (
                          coursesTable.map((course) => (
                            <TableRow
                              key={course.id}
                              className="border-white/10 hover:bg-white/5">
                              <TableCell className="text-white font-medium">
                                {course.title}
                              </TableCell>
                              <TableCell className="text-gray-300">
                                {course.tutor}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={getStatusColor(course.status)}>
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
                                      disabled={updatingId === course.id}
                                      onClick={async () => {
                                        const action =
                                          course.status === "PUBLISHED"
                                            ? "archive"
                                            : "publish";
                                        const confirmed = window.confirm(
                                          `Are you sure you want to ${action} "${course.title}"?`,
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
                                        await refreshDashboard();
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
                                          `Suspend "${course.title}"?`,
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
                                        await refreshDashboard();
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Advanced Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analyticsStats.length === 0 ? (
                      <p className="text-gray-400 text-sm">
                        No analytics available yet.
                      </p>
                    ) : (
                      analyticsStats.map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-lg border border-white/10 p-4">
                          <p className="text-sm text-gray-400">{stat.label}</p>
                          <p className="text-2xl text-white font-semibold">
                            {stat.value}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">System Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-white/10 p-4">
                      <p className="text-sm text-gray-400">Payout Mode</p>
                      <p className="text-white font-medium">Manual approval</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Admins approve payouts from /admin/finance
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 p-4">
                      <p className="text-sm text-gray-400">Admin Naming</p>
                      <p className="text-white font-medium">PTQ-ADMIN-XXXXXX</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied automatically on admin login
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              {securityLoading && !securityDashboard ? (
                <Card className="glass-card border-white/10">
                  <CardContent className="p-6 text-gray-400">
                    Loading security data...
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Security Dashboard Summary */}
                  {securityDashboard && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="glass-card border-white/10">
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-400">
                            Failed Login Attempts (24h)
                          </p>
                          <p className="text-2xl font-bold text-red-400">
                            {securityDashboard.last24h?.failedAttempts || 0}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="glass-card border-white/10">
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-400">
                            Unique IP Addresses (24h)
                          </p>
                          <p className="text-2xl font-bold text-orange-400">
                            {securityDashboard.last24h?.uniqueIPAddresses || 0}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="glass-card border-white/10">
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-400">
                            Blocked IPs (Active)
                          </p>
                          <p className="text-2xl font-bold text-yellow-400">
                            {securityDashboard.current?.activelyBlockedIPs || 0}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="glass-card border-white/10">
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-400">
                            Locked Accounts
                          </p>
                          <p className="text-2xl font-bold text-purple-400">
                            {securityDashboard.current?.lockedUserAccounts || 0}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Block IP Dialog */}
                  <Dialog
                    open={blockIPDialogOpen}
                    onOpenChange={setBlockIPDialogOpen}>
                    <DialogContent className="glass-card border-white/10">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          Block IP Address
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Enter the IP address to block temporarily
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="IP Address (e.g., 192.168.1.1)"
                          value={newBlockIP}
                          onChange={(e) => setNewBlockIP(e.target.value)}
                          className="glass-card border-white/20"
                        />
                        <Input
                          placeholder="Reason for blocking (optional)"
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          className="glass-card border-white/20"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          className="border-white/10 bg-transparent"
                          onClick={() => setBlockIPDialogOpen(false)}
                          disabled={blockingIP !== null}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleBlockIP}
                          disabled={blockingIP !== null}
                          className="bg-gradient-to-r from-red-600 to-red-700">
                          {blockingIP ? "Blocking..." : "Block IP"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Blocked IPs Section */}
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="w-5 h-5 text-red-400" />
                          <CardTitle className="text-white">
                            Blocked IP Addresses
                          </CardTitle>
                        </div>
                        <Button
                          onClick={() => setBlockIPDialogOpen(true)}
                          size="sm"
                          className="bg-gradient-to-r from-red-600 to-red-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Block IP
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {blockedIPs.length === 0 ? (
                        <p className="text-gray-400 text-sm">
                          No blocked IPs at this time
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {blockedIPs.map((ip) => (
                            <div
                              key={ip.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-red-500/5">
                              <div className="flex items-center gap-3">
                                <Globe className="w-4 h-4 text-red-400" />
                                <div>
                                  <p className="text-white font-mono text-sm">
                                    {ip.ipAddress}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {ip.reason || "No reason provided"}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                                onClick={() => handleUnblockIP(ip.ipAddress)}
                                disabled={unblockingIP === ip.ipAddress}>
                                <Unlock className="w-4 h-4 mr-1" />
                                {unblockingIP === ip.ipAddress
                                  ? "Unblocking..."
                                  : "Unblock"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Locked Accounts Section */}
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-yellow-400" />
                        <CardTitle className="text-white">
                          Locked User Accounts
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {lockedAccounts.length === 0 ? (
                        <p className="text-gray-400 text-sm">
                          No locked accounts at this time
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {lockedAccounts.map((account) => (
                            <div
                              key={account.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-yellow-500/5">
                              <div className="flex-1">
                                <p className="text-white font-medium">
                                  {account.email}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {account.failedLoginAttempts} failed attempts
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  Unlocks at{" "}
                                  {new Date(
                                    account.accountLockedUntil,
                                  ).toLocaleTimeString()}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                                onClick={() => handleUnlockUser(account.id)}
                                disabled={unblockingUser === account.id}>
                                <Unlock className="w-4 h-4 mr-1" />
                                {unblockingUser === account.id
                                  ? "Unlocking..."
                                  : "Unlock"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Suspicious Activity Report */}
                  {suspiciousActivity && (
                    <Card className="glass-card border-white/10">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-orange-400" />
                          <CardTitle className="text-white">
                            Suspicious Activity Report (Last 7 Days)
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h4 className="text-white font-medium mb-3">
                            Top IPs by Failed Attempts
                          </h4>
                          {suspiciousActivity.topIPsByFailedAttempts &&
                          suspiciousActivity.topIPsByFailedAttempts.length >
                            0 ? (
                            <div className="space-y-2">
                              {suspiciousActivity.topIPsByFailedAttempts
                                .slice(0, 5)
                                .map((item: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 rounded bg-black/20">
                                    <span className="text-sm text-gray-300 font-mono">
                                      {item.ipAddress}
                                    </span>
                                    <Badge variant="destructive">
                                      {item.failedAttempts} attempts
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              No suspicious activity
                            </p>
                          )}
                        </div>

                        {suspiciousActivity.topEmailsByFailedAttempts &&
                          suspiciousActivity.topEmailsByFailedAttempts.length >
                            0 && (
                            <div>
                              <h4 className="text-white font-medium mb-3">
                                Top Targeted Email Accounts
                              </h4>
                              <div className="space-y-2">
                                {suspiciousActivity.topEmailsByFailedAttempts
                                  .slice(0, 5)
                                  .map((item: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-2 rounded bg-black/20">
                                      <span className="text-sm text-gray-300 truncate">
                                        {item.email}
                                      </span>
                                      <Badge variant="destructive">
                                        {item.failedAttempts} attempts
                                      </Badge>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Configuration Info */}
                  {securityDashboard?.config && (
                    <Card className="glass-card border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white">
                          Security Configuration
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-lg border border-white/10 p-4">
                            <p className="text-sm text-gray-400">
                              Max Attempts Per IP
                            </p>
                            <p className="text-white font-medium">
                              {securityDashboard.config.maxAttemptsPerIP}
                            </p>
                          </div>
                          <div className="rounded-lg border border-white/10 p-4">
                            <p className="text-sm text-gray-400">
                              Max Attempts Per Email
                            </p>
                            <p className="text-white font-medium">
                              {securityDashboard.config.maxAttemptsPerEmail}
                            </p>
                          </div>
                          <div className="rounded-lg border border-white/10 p-4">
                            <p className="text-sm text-gray-400">
                              Rate Limit Window
                            </p>
                            <p className="text-white font-medium">
                              {securityDashboard.config.rateLimitWindowMinutes}{" "}
                              minutes
                            </p>
                          </div>
                          <div className="rounded-lg border border-white/10 p-4">
                            <p className="text-sm text-gray-400">
                              IP Block Duration
                            </p>
                            <p className="text-white font-medium">
                              {securityDashboard.config.blockDurationMinutes}{" "}
                              minutes
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
