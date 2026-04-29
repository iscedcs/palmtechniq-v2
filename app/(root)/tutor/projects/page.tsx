"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateRandomAvatar } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Code,
  Download,
  Edit,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  getProjectStats,
  getPendingSubmissions,
  getGradedSubmissions,
  getTutorProjects,
  duplicateProject,
  toggleProjectActive,
} from "@/actions/project";
import { CreateProjectModal } from "@/components/tutor/projects/create-project-modal";
import { GradeSubmissionModal } from "@/components/tutor/projects/grade-submission-modal";
import { EditProjectModal } from "@/components/tutor/projects/edit-project-modal";
import { ProjectSubmissionsModal } from "@/components/tutor/projects/project-submissions-modal";
import { DeleteProjectModal } from "@/components/tutor/projects/delete-project-modal";
import { ProjectAnalyticsModal } from "@/components/tutor/projects/project-analytics-modal";
import { tutorProjectFeatures } from "@/lib/feature-settings-config";
import { toast } from "sonner";

export default function TutorProjectsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Data states
  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    pendingSubmissions: 0,
    gradedSubmissions: 0,
    averageScore: 0,
    completionRate: 0,
  });
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [gradedSubmissions, setGradedSubmissions] = useState<any[]>([]);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsResult, pendingResult, gradedResult, projectsResult] =
          await Promise.all([
            getProjectStats(),
            getPendingSubmissions(),
            getGradedSubmissions(),
            getTutorProjects(),
          ]);

        if (statsResult.stats) {
          setProjectStats(statsResult.stats);
        }
        if (pendingResult.submissions) {
          setPendingSubmissions(pendingResult.submissions);
        }
        if (gradedResult.submissions) {
          setGradedSubmissions(gradedResult.submissions);
        }
        if (projectsResult.projects) {
          setMyProjects(projectsResult.projects);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRefresh = () => {
    const fetchData = async () => {
      try {
        const [statsResult, pendingResult, gradedResult, projectsResult] =
          await Promise.all([
            getProjectStats(),
            getPendingSubmissions(),
            getGradedSubmissions(),
            getTutorProjects(),
          ]);

        if (statsResult.stats) {
          setProjectStats(statsResult.stats);
        }
        if (pendingResult.submissions) {
          setPendingSubmissions(pendingResult.submissions);
        }
        if (gradedResult.submissions) {
          setGradedSubmissions(gradedResult.submissions);
        }
        if (projectsResult.projects) {
          setMyProjects(projectsResult.projects);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  };

  const handleGradeClick = (submission: any) => {
    setSelectedSubmission(submission);
    setGradeModalOpen(true);
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setEditModalOpen(true);
  };

  const handleViewProjectSubmissions = (project: any) => {
    setSelectedProject(project);
    setSubmissionsModalOpen(true);
  };

  const handleDeleteProject = (project: any) => {
    setSelectedProject(project);
    setDeleteModalOpen(true);
  };

  const handleDuplicateProject = async (project: any) => {
    const result = await duplicateProject(project.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Project duplicated");
      handleRefresh();
    }
  };

  const handleToggleProjectActive = async (project: any) => {
    const result = await toggleProjectActive(project.id, !project.isActive);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        project.isActive ? "Project deactivated" : "Project activated"
      );
      handleRefresh();
    }
  };

  const handleAnalyticsProject = (project: any) => {
    setSelectedProject(project);
    setAnalyticsModalOpen(true);
  };

  // Filter submissions based on search and status
  const filteredPendingSubmissions = pendingSubmissions.filter((sub) => {
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.course.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredGradedSubmissions = gradedSubmissions.filter((sub) => {
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || sub.grade.startsWith(statusFilter);
    return matchesSearch && matchesStatus;
  });

  // Mock data for reference (will be removed)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "INTERMEDIATE":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "ADVANCED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-400";
    if (grade.startsWith("B")) return "text-blue-400";
    if (grade.startsWith("C")) return "text-yellow-400";
    if (grade.startsWith("D")) return "text-orange-400";
    return "text-red-400";
  };

  const StatsSkeleton = () => (
    <Card className="glass-card border-white/10">
      <CardContent className="p-6 text-center">
        <Skeleton className="h-8 w-8 rounded-full mx-auto mb-2" />
        <Skeleton className="h-6 w-16 mx-auto mb-1" />
        <Skeleton className="h-3 w-24 mx-auto" />
      </CardContent>
    </Card>
  );

  const SubmissionSkeleton = () => (
    <Card className="glass-card border-white/10">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center space-x-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-14" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );

  const ProjectSkeleton = () => (
    <Card className="glass-card border-white/10">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="flex items-center space-x-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <Skeleton className="h-5 w-10 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-5 w-10 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-5 w-10 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SubmissionCard = ({
    submission,
    type,
  }: {
    submission: any;
    type: "pending" | "graded";
  }) => (
    <Card
      className={`glass-card border-white/10 hover-glow group ${
        submission.isOverdue ? "border-red-500/30" : ""
      }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={submission.student.avatar || generateRandomAvatar()}
              />
              <AvatarFallback>
                {submission.student.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-1 group-hover:text-gradient transition-colors">
                {submission.title}
              </h4>
              <p className="text-gray-400 text-sm mb-2">
                by {submission.student.name}
              </p>
              <div className="flex items-center space-x-3 mb-2">
                <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30 text-xs">
                  {submission.course}
                </Badge>
                <Badge className={getDifficultyColor(submission.difficulty)}>
                  {submission.difficulty.charAt(0) +
                    submission.difficulty.slice(1).toLowerCase()}
                </Badge>
                <div className="flex items-center space-x-1 text-neon-orange">
                  <Trophy className="w-3 h-3" />
                  <span className="text-xs font-semibold">
                    {submission.points} pts
                  </span>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-3">
                {submission.description}
              </p>
            </div>
          </div>
          <div className="text-right">
            {type === "graded" && (
              <div className="mb-2">
                <div
                  className={`text-2xl font-bold ${getGradeColor(
                    submission.grade
                  )}`}>
                  {submission.grade}
                </div>
                <div className="text-gray-400 text-sm">{submission.score}%</div>
              </div>
            )}
            {submission.isOverdue && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-2">
                Overdue
              </Badge>
            )}
          </div>
        </div>

        {type === "pending" && submission.requirements && (
          <div className="mb-4">
            <h5 className="text-white font-semibold mb-2 text-sm">
              Requirements:
            </h5>
            <ul className="space-y-1">
              {submission.requirements
                .slice(0, 2)
                .map((req: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start space-x-2 text-gray-300 text-xs">
                    <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              {submission.requirements.length > 2 && (
                <li className="text-gray-400 text-xs">
                  +{submission.requirements.length - 2} more requirements
                </li>
              )}
            </ul>
          </div>
        )}

        {type === "graded" && submission.feedback && (
          <div className="mb-4 p-3 bg-white/5 rounded-lg">
            <h5 className="text-white font-semibold mb-2 text-sm">
              Your Feedback:
            </h5>
            <p className="text-gray-300 text-sm">{submission.feedback}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>
                {type === "pending"
                  ? `Submitted ${submission.submittedAt}`
                  : `Graded ${submission.gradedAt}`}
              </span>
            </div>
            {type === "pending" && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {submission.dueDate
                    ? `Due ${submission.dueDate}`
                    : "No due date"}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {type === "pending" ? (
              <Button
                size="sm"
                onClick={() => handleGradeClick(submission)}
                className="bg-gradient-to-r from-neon-green to-emerald-400 text-white">
                <Award className="w-4 h-4 mr-2" />
                Grade
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/10">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-black/90 backdrop-blur-sm border-white/10">
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Grade
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProjectCard = ({ project }: { project: any }) => (
    <Card className="glass-card border-white/10 hover-glow group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-2 group-hover:text-gradient transition-colors">
              {project.title}
            </h4>
            <p className="text-gray-300 text-sm mb-3">{project.description}</p>
            <div className="flex items-center space-x-3 mb-3">
              <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30 text-xs">
                {project.course}
              </Badge>
              <Badge className={getDifficultyColor(project.difficulty)}>
                {project.difficulty.charAt(0) +
                  project.difficulty.slice(1).toLowerCase()}
              </Badge>
              <div className="flex items-center space-x-1 text-neon-orange">
                <Trophy className="w-3 h-3" />
                <span className="text-xs font-semibold">
                  {project.points} pts
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge
              className={
                project.isActive
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-gray-500/20 text-gray-400 border-gray-500/30"
              }>
              {project.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {project.submissions}
            </div>
            <div className="text-gray-400 text-xs">Submissions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">
              {project.averageScore}%
            </div>
            <div className="text-gray-400 text-xs">Avg Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {project.completionRate}%
            </div>
            <div className="text-gray-400 text-xs">Completion</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Completion Rate</span>
            <span className="text-white font-semibold">
              {project.completionRate}%
            </span>
          </div>
          <Progress value={project.completionRate} className="h-2" />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-sm text-gray-400">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2">
            {tutorProjectFeatures.analytics && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAnalyticsProject(project)}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-black/90 backdrop-blur-sm border-white/10">
                <DropdownMenuItem
                  className="text-white hover:bg-white/10"
                  onClick={() => handleEditProject(project)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-white hover:bg-white/10"
                  onClick={() => handleViewProjectSubmissions(project)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Submissions
                </DropdownMenuItem>
                {tutorProjectFeatures.duplicate && (
                  <DropdownMenuItem
                    className="text-white hover:bg-white/10"
                    onClick={() => handleDuplicateProject(project)}>
                    <Code className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {tutorProjectFeatures.deactivate && (
                  <DropdownMenuItem
                    className="text-white hover:bg-white/10"
                    onClick={() => handleToggleProjectActive(project)}>
                    {project.isActive ? (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-red-400 hover:bg-red-500/10"
                  onClick={() => handleDeleteProject(project)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20">
        {/* Header */}
        <section className="py-12 relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-10" />
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Projects & Assignments
                </h1>
                <p className="text-xl text-gray-300">
                  Create, manage, and grade student projects
                </p>
              </div>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-gradient-to-r from-neon-green to-emerald-400 text-white text-lg px-8 py-3">
                <Plus className="w-5 h-5 mr-2" />
                Create Project
              </Button>
            </motion.div>

            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
              {loading ? (
                <>
                  <StatsSkeleton />
                  <StatsSkeleton />
                  <StatsSkeleton />
                  <StatsSkeleton />
                  <StatsSkeleton />
                  <StatsSkeleton />
                </>
              ) : (
                <>
                  <Card className="glass-card border-white/10">
                    <CardContent className="p-6 text-center">
                      <Award className="w-8 h-8 text-neon-green mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {projectStats.totalProjects}
                      </div>
                      <div className="text-gray-400 text-sm">Total Projects</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-white/10">
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="w-8 h-8 text-neon-blue mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {projectStats.activeProjects}
                      </div>
                      <div className="text-gray-400 text-sm">Active</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-white/10">
                    <CardContent className="p-6 text-center">
                      <AlertCircle className="w-8 h-8 text-neon-orange mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {projectStats.pendingSubmissions}
                      </div>
                      <div className="text-gray-400 text-sm">Pending</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-white/10">
                    <CardContent className="p-6 text-center">
                      <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {projectStats.gradedSubmissions}
                      </div>
                      <div className="text-gray-400 text-sm">Graded</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-white/10">
                    <CardContent className="p-6 text-center">
                      <Trophy className="w-8 h-8 text-neon-purple mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {projectStats.averageScore}%
                      </div>
                      <div className="text-gray-400 text-sm">Avg Score</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-white/10">
                    <CardContent className="p-6 text-center">
                      <Target className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {projectStats.completionRate}%
                      </div>
                      <div className="text-gray-400 text-sm">Completion</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </motion.div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/5 backdrop-blur-sm mb-8">
                <TabsTrigger value="pending">
                  Pending Review ({pendingSubmissions.length})
                </TabsTrigger>
                <TabsTrigger value="graded">Graded Submissions</TabsTrigger>
                <TabsTrigger value="projects">My Projects</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">
                      Submissions Awaiting Review
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search submissions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-80 bg-white/5 border-white/10 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {loading ? (
                      <>
                        <SubmissionSkeleton />
                        <SubmissionSkeleton />
                        <SubmissionSkeleton />
                      </>
                    ) : filteredPendingSubmissions.length === 0 ? (
                      <Card className="glass-card border-white/10">
                        <CardContent className="p-12 text-center">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-400 text-lg">
                            No pending submissions found
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredPendingSubmissions.map((submission) => (
                        <SubmissionCard
                          key={submission.id}
                          submission={submission}
                          type="pending"
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="graded">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">
                      Graded Submissions
                    </h3>
                    <div className="flex items-center space-x-4">
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 backdrop-blur-sm border-white/10">
                          <SelectItem
                            value="all"
                            className="text-white hover:bg-white/10">
                            All Grades
                          </SelectItem>
                          <SelectItem
                            value="A"
                            className="text-white hover:bg-white/10">
                            A Grade
                          </SelectItem>
                          <SelectItem
                            value="B"
                            className="text-white hover:bg-white/10">
                            B Grade
                          </SelectItem>
                          <SelectItem
                            value="C"
                            className="text-white hover:bg-white/10">
                            C Grade
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search submissions..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-80 bg-white/5 border-white/10 text-white placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {loading ? (
                      <>
                        <SubmissionSkeleton />
                        <SubmissionSkeleton />
                        <SubmissionSkeleton />
                      </>
                    ) : filteredGradedSubmissions.length === 0 ? (
                      <Card className="glass-card border-white/10">
                        <CardContent className="p-12 text-center">
                          <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-400 text-lg">
                            No graded submissions found
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredGradedSubmissions.map((submission) => (
                        <SubmissionCard
                          key={submission.id}
                          submission={submission}
                          type="graded"
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="projects">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">
                      My Projects ({myProjects.length})
                    </h3>
                    <Button
                      onClick={() => setCreateModalOpen(true)}
                      className="bg-gradient-to-r from-neon-green to-emerald-400 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Project
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading ? (
                      <>
                        <ProjectSkeleton />
                        <ProjectSkeleton />
                      </>
                    ) : myProjects.length === 0 ? (
                      <div className="col-span-2">
                        <Card className="glass-card border-white/10">
                          <CardContent className="p-12 text-center">
                            <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg mb-4">
                              No projects found
                            </p>
                            <Button
                              onClick={() => setCreateModalOpen(true)}
                              className="bg-gradient-to-r from-neon-green to-emerald-400 text-white">
                              <Plus className="w-4 h-4 mr-2" />
                              Create Your First Project
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      myProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                      ))
                    )}
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>

      {/* Modals */}
      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleRefresh}
      />
      <GradeSubmissionModal
        open={gradeModalOpen}
        onOpenChange={setGradeModalOpen}
        submission={selectedSubmission}
        onSuccess={handleRefresh}
      />
      <EditProjectModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        project={selectedProject}
        onSuccess={handleRefresh}
      />
      <ProjectSubmissionsModal
        open={submissionsModalOpen}
        onOpenChange={setSubmissionsModalOpen}
        projectId={selectedProject?.id || null}
      />
      <DeleteProjectModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        project={selectedProject}
        onSuccess={handleRefresh}
      />
      <ProjectAnalyticsModal
        open={analyticsModalOpen}
        onOpenChange={setAnalyticsModalOpen}
        projectId={selectedProject?.id || null}
      />
    </div>
  );
}
