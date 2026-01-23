"use client";

import { getStudentProjectsOverview } from "@/actions/student-projects";
import StudentProjectsListSkeleton from "@/components/shared/skeleton/student-projectslist-skeleton";
import { SubmitProjectModal } from "@/components/student/projects/submit-project-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { studentProjectFeatures } from "@/lib/feature-settings-config";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  Clock,
  Code,
  ExternalLink,
  FolderOpen,
  Github,
  Globe,
  Loader2,
  MessageSquare,
  Star,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function StudentProjectsPage() {
  const [activeTab, setActiveTab] = useState("active");
  const [loading, setLoading] = useState(true);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [completedProjects, setCompletedProjects] = useState<any[]>([]);
  const [upcomingProjects, setUpcomingProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completed: 0,
    inProgress: 0,
    avgGrade: 0,
  });
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const result = await getStudentProjectsOverview();
      if (result.activeProjects) setActiveProjects(result.activeProjects);
      if (result.completedProjects)
        setCompletedProjects(result.completedProjects);
      if (result.upcomingProjects) setUpcomingProjects(result.upcomingProjects);
      if (result.stats) setStats(result.stats);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmitWork = (project: any) => {
    setSelectedProject(project);
    setSubmitModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in-progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "overdue":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "INTERMEDIATE":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "ADVANCED":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "EXPERT":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatCalendarDate = (date: Date) =>
    date.toISOString().slice(0, 10).replaceAll("-", "");

  const getCalendarUrl = (project: any) => {
    const startDate = project.startDate
      ? new Date(project.startDate)
      : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    const dates = `${formatCalendarDate(startDate)}/${formatCalendarDate(
      endDate
    )}`;
    const text = `Project: ${project.title}`;
    const details = [
      `Course: ${project.course}`,
      `Instructor: ${project.instructor}`,
      project.description,
    ]
      .filter(Boolean)
      .join("\n");

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text,
      dates,
      details,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">My</span>{" "}
              <span className="text-gradient">Projects</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Build real-world projects and showcase your skills to potential
              employers
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}>
              <Card className="glass-card border-white/10 hover-glow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FolderOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {stats.totalProjects}
                  </h3>
                  <p className="text-gray-400 text-sm">Total Projects</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}>
              <Card className="glass-card border-white/10 hover-glow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-neon-green to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {stats.completed}
                  </h3>
                  <p className="text-gray-400 text-sm">Completed</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}>
              <Card className="glass-card border-white/10 hover-glow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-neon-orange to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {stats.inProgress}
                  </h3>
                  <p className="text-gray-400 text-sm">In Progress</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}>
              <Card className="glass-card border-white/10 hover-glow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-neon-purple to-pink-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {stats.avgGrade.toFixed(1)}
                  </h3>
                  <p className="text-gray-400 text-sm">Avg Grade</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Projects Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}>
            <Card className="glass-card border-white/10">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 bg-white/5 border-b border-white/10">
                    <TabsTrigger value="active">
                      Active Projects ({activeProjects.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                      Completed ({completedProjects.length})
                    </TabsTrigger>
                    <TabsTrigger value="upcoming">
                      Upcoming ({upcomingProjects.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Active Projects */}
                  <TabsContent value="active" className="p-6">
                    <div className="space-y-6">
                      {loading ? (
                        <div className="grid md:grid-cols-2 gap-6 items-center justify-center py-12">
                          <StudentProjectsListSkeleton />
                        </div>
                      ) : activeProjects.length === 0 ? (
                        <Card className="glass-card border-white/10">
                          <CardContent className="p-12 text-center">
                            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">
                              No active projects found
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        activeProjects.map((project, index) => (
                          <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-xl font-bold text-white">
                                    {project.title}
                                  </h3>
                                  <Badge
                                    className={getStatusColor(project.status)}>
                                    {project.status.replace("-", " ")}
                                  </Badge>
                                  <Badge
                                    className={getDifficultyColor(
                                      project.difficulty
                                    )}>
                                    {project.difficulty.charAt(0) +
                                      project.difficulty.slice(1).toLowerCase()}
                                  </Badge>
                                </div>
                                <p className="text-gray-300 mb-3">
                                  {project.description}
                                </p>
                                {typeof project.requiredLessons ===
                                  "number" && (
                                  <p className="text-sm text-gray-400 mb-3">
                                    Complete {project.completedLessons} of{" "}
                                    {project.requiredLessons} lessons to unlock
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                                  <span>Course: {project.course}</span>
                                  <span>•</span>
                                  <span>Instructor: {project.instructor}</span>
                                  <span>•</span>
                                  <span>Access: Open</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <div className="mb-4">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">
                                      Progress
                                    </span>
                                    <span className="text-white">
                                      {project.progress}%
                                    </span>
                                  </div>
                                  <Progress
                                    value={project.progress}
                                    className="h-2"
                                  />
                                </div>

                                <div className="mb-4">
                                  <p className="text-sm text-gray-400 mb-2">
                                    Technologies
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {project.technologies.length > 0 ? (
                                      project.technologies.map(
                                        (tech: string, techIndex: number) => (
                                          <Badge
                                            key={`${project.id}-${tech}-${techIndex}`}
                                            className="bg-neon-blue/20 text-neon-blue border-neon-blue/30 text-xs">
                                            {tech}
                                          </Badge>
                                        )
                                      )
                                    ) : (
                                      <span className="text-gray-400 text-sm">
                                        Not specified
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="mb-4">
                                  <p className="text-sm text-gray-400 mb-2">
                                    Submissions
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white">
                                      {project.submissions} /{" "}
                                      {project.maxSubmissions}
                                    </span>
                                    <Progress
                                      value={
                                        (project.submissions /
                                          project.maxSubmissions) *
                                        100
                                      }
                                      className="h-2 flex-1"
                                    />
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <p className="text-sm text-gray-400 mb-2">
                                    Latest Feedback
                                  </p>
                                  <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg">
                                    {project.feedback}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                              <span className="text-sm text-gray-400">
                                Last updated: {project.lastUpdated}
                              </span>
                              <div className="flex gap-2">
                                {studentProjectFeatures.askQuestion ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                                    <Link
                                      href={`/courses/${project.courseId}#discussions`}>
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Ask Question
                                    </Link>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Ask Question
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSubmitWork(project)}
                                  className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                                  <Upload className="w-4 h-4 mr-2" />
                                  Submit Work
                                </Button>
                                <Button
                                  asChild
                                  className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                                  <Link href={`/courses/${project.courseId}`}>
                                    <Code className="w-4 h-4 mr-2" />
                                    Continue Working
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Completed Projects */}
                  <TabsContent value="completed" className="p-6">
                    <div className="space-y-6">
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
                        </div>
                      ) : completedProjects.length === 0 ? (
                        <Card className="glass-card border-white/10">
                          <CardContent className="p-12 text-center">
                            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">
                              No completed projects yet
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        completedProjects.map((project, index) => (
                          <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="p-6 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-xl font-bold text-white">
                                    {project.title}
                                  </h3>
                                  <Badge
                                    className={getStatusColor(project.status)}>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    Grade: {project.grade}
                                  </Badge>
                                </div>
                                <p className="text-gray-300 mb-3">
                                  {project.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                                  <span>Course: {project.course}</span>
                                  <span>•</span>
                                  <span>Instructor: {project.instructor}</span>
                                  <span>•</span>
                                  <span>
                                    Completed:{" "}
                                    {project.completedDate
                                      ? new Date(
                                          project.completedDate
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <div className="mb-4">
                                  <p className="text-sm text-gray-400 mb-2">
                                    Technologies Used
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {project.technologies.length > 0 ? (
                                      project.technologies.map(
                                        (tech: string) => (
                                          <Badge
                                            key={tech}
                                            className="bg-neon-green/20 text-neon-green border-neon-green/30 text-xs">
                                            {tech}
                                          </Badge>
                                        )
                                      )
                                    ) : (
                                      <span className="text-gray-400 text-sm">
                                        Not specified
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <p className="text-sm text-gray-400 mb-2">
                                    Instructor Feedback
                                  </p>
                                  <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg">
                                    {project.feedback}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <div className="mb-4">
                                  <p className="text-sm text-gray-400 mb-2">
                                    Project Links
                                  </p>
                                  <div className="space-y-2">
                                    {project.liveUrl && (
                                      <a
                                        href={project.liveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-neon-blue hover:text-neon-blue/80 transition-colors">
                                        <Globe className="w-4 h-4" />
                                        <span className="text-sm">
                                          Live Demo
                                        </span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                    {project.githubUrl && (
                                      <a
                                        href={project.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                                        <Github className="w-4 h-4" />
                                        <span className="text-sm">
                                          Source Code
                                        </span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Upcoming Projects */}
                  <TabsContent value="upcoming" className="p-6">
                    <div className="space-y-6">
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
                        </div>
                      ) : upcomingProjects.length === 0 ? (
                        <Card className="glass-card border-white/10">
                          <CardContent className="p-12 text-center">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">
                              No upcoming projects
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        upcomingProjects.map((project, index) => (
                          <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="p-6 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-xl font-bold text-white">
                                    {project.title}
                                  </h3>
                                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Upcoming
                                  </Badge>
                                  <Badge
                                    className={getDifficultyColor(
                                      project.difficulty
                                    )}>
                                    {project.difficulty.charAt(0) +
                                      project.difficulty.slice(1).toLowerCase()}
                                  </Badge>
                                </div>
                                <p className="text-gray-300 mb-3">
                                  {project.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                                  <span>Course: {project.course}</span>
                                  <span>•</span>
                                  <span>Instructor: {project.instructor}</span>
                                  <span>•</span>
                                  <span>
                                    Starts:{" "}
                                    {project.startDate
                                      ? new Date(
                                          project.startDate
                                        ).toLocaleDateString()
                                      : "TBD"}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Duration: {project.estimatedDuration}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mb-4">
                              <p className="text-sm text-gray-400 mb-2">
                                Technologies You'll Use
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {project.technologies.length > 0 ? (
                                  project.technologies.map((tech: string) => (
                                    <Badge
                                      key={tech}
                                      className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                                      {tech}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-gray-400 text-sm">
                                    Not specified
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                              <span className="text-sm text-gray-400">
                                {project.eligibilityType === "MODULE"
                                  ? `Unlock by completing ${project.remainingLessons} more lessons in this module`
                                  : project.eligibilityType === "COURSE"
                                  ? `Unlock by completing ${project.remainingModules} more modules (${project.remainingLessons} lessons left)`
                                  : "Available soon"}
                              </span>
                              {studentProjectFeatures.setReminder && (
                                <Button
                                  variant="outline"
                                  className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                                  <a
                                    href={getCalendarUrl(project)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Set Reminder
                                  </a>
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <SubmitProjectModal
        open={submitModalOpen}
        onOpenChange={setSubmitModalOpen}
        project={selectedProject}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
