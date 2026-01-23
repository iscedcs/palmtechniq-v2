"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Clock,
  Upload,
  CheckCircle,
  AlertCircle,
  Star,
  Code,
  Github,
  ExternalLink,
  Play,
  Eye,
  Loader2,
} from "lucide-react";
import { generateRandomAvatar } from "@/lib/utils";
import { getStudentTasks, submitTaskSubmission } from "@/actions/assignment";
import { toast } from "sonner";

export default function StudentAssignments() {
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [forms, setForms] = useState<
    Record<
      string,
      {
        githubUrl?: string;
        liveUrl?: string;
        content?: string;
        notes?: string;
        fileUrl?: string;
      }
    >
  >({});

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setLoadingError(null);
    try {
      const result = await getStudentTasks();
      if ("error" in result) {
        setLoadingError(result.error);
        return;
      }
      setActiveAssignments(result.activeTasks);
      setCompletedAssignments(result.completedTasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      setLoadingError("Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const updateForm = (
    taskId: string,
    field: "githubUrl" | "liveUrl" | "content" | "notes" | "fileUrl",
    value: string
  ) => {
    setForms((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], [field]: value },
    }));
  };

  const handleFileUpload = async (taskId: string, file: File) => {
    setUploading((prev) => ({ ...prev, [taskId]: true }));
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: "project-submissions",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Upload failed.");
        return;
      }

      const formData = new FormData();
      Object.entries(data.fields).forEach(([key, value]) =>
        formData.append(key, value as string)
      );
      formData.append("file", file);

      const uploadResponse = await fetch(data.url, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        toast.error("Failed to upload file.");
        return;
      }

      const fileUrl = `${data.url}${data.fields.key}`;
      updateForm(taskId, "fileUrl", fileUrl);
      toast.success("File uploaded.");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file.");
    } finally {
      setUploading((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const handleSubmit = async (assignment: any) => {
    setSubmitting((prev) => ({ ...prev, [assignment.id]: true }));
    try {
      const form = forms[assignment.id] || {};
      const result = await submitTaskSubmission({
        taskId: assignment.id,
        content: form.content,
        fileUrl: form.fileUrl,
        githubUrl: form.githubUrl,
        liveUrl: form.liveUrl,
        notes: form.notes,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Assignment submitted.");
      await loadTasks();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit assignment.");
    } finally {
      setSubmitting((prev) => ({ ...prev, [assignment.id]: false }));
    }
  };

  const getGradeLabel = (score?: number | null) => {
    if (score === null || score === undefined) return "N/A";
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  const AssignmentCard = ({
    assignment,
    type,
  }: {
    assignment: any;
    type: "active" | "completed";
  }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className="group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>
      <Card className="glass-card hover-glow border-white/10 overflow-hidden h-full">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-white mb-2 group-hover:text-gradient transition-colors">
                {assignment.title}
              </CardTitle>
              <p className="text-gray-300 text-sm mb-2">{assignment.course}</p>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage
                    src={assignment.instructorAvatar || generateRandomAvatar()}
                  />
                  <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white text-xs">
                    {assignment.instructor
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-gray-400 text-sm">
                  {assignment.instructor}
                </span>
              </div>
            </div>
            <div className="text-right">
              {type === "active" ? (
                <p className="text-white font-bold">{assignment.points} pts</p>
              ) : (
                <>
                  <Badge className="mb-2 bg-green-500/20 text-green-400 border-green-500/30">
                    {getGradeLabel(assignment.score)}
                  </Badge>
                  <p className="text-white font-bold">
                    {assignment.score ?? 0}/100
                  </p>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-300 text-sm">{assignment.description}</p>

          {type === "active" && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Module</p>
                  <p className="text-white">{assignment.module}</p>
                </div>
                <div>
                  <p className="text-gray-400">Due Date</p>
                  <p className="text-white">
                    {assignment.dueDate
                      ? new Date(assignment.dueDate).toLocaleDateString()
                      : "No due date"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {assignment.status}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    {assignment.dueDate
                      ? `${Math.ceil(
                          (new Date(assignment.dueDate).getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )} days left`
                      : "No deadline"}
                  </span>
                </div>
              </div>
            </>
          )}

          {type === "completed" && (
            <>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">Instructor Feedback:</p>
                <p className="text-gray-300 text-sm bg-white/5 p-3 rounded-lg">
                  {assignment.feedback || "No feedback yet."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Submitted</p>
                  <p className="text-white">
                    {assignment.submittedAt
                      ? new Date(assignment.submittedAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Points Earned</p>
                  <p className="text-white">
                    {assignment.score ?? 0} pts
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2">
            {type === "active" && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex-1 bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-white/20 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">
                        {assignment.title}
                      </DialogTitle>
                      <DialogDescription className="text-gray-400">
                        {assignment.course} •{" "}
                        {assignment.dueDate
                          ? `Due ${new Date(
                              assignment.dueDate
                            ).toLocaleDateString()}`
                          : "No due date"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Description
                        </h4>
                        <p className="text-gray-300">
                          {assignment.description}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Requirements
                        </h4>
                        <ul className="space-y-1">
                          {assignment.requirements.map(
                            (req: string, index: number) => (
                              <li
                                key={index}
                                className="flex items-center gap-2 text-gray-300">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                {req}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Resources
                        </h4>
                        <div className="space-y-2">
                          {assignment.resources.map(
                            (resource: any, index: number) => (
                              <a
                                key={index}
                                href={resource.url}
                                className="flex items-center gap-2 text-neon-blue hover:text-neon-purple transition-colors">
                                <ExternalLink className="w-4 h-4" />
                                {resource.title}
                              </a>
                            )
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Submit Assignment
                        </h4>
                        <div className="space-y-4">
                          {assignment.submissionType === "QUIZ" ? (
                            <div className="text-sm text-gray-400">
                              Complete the module quiz to finish this task.
                            </div>
                          ) : (
                            <>
                              {assignment.submissionType === "FILE" && (
                                <div>
                                  <label className="text-sm font-medium text-white mb-2 block">
                                    Upload File
                                  </label>
                                  <Input
                                    type="file"
                                    accept="*"
                                    disabled={uploading[assignment.id]}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileUpload(assignment.id, file);
                                      }
                                    }}
                                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                                  />
                                </div>
                              )}
                              {(assignment.submissionType === "GITHUB" ||
                                assignment.submissionType === "LINK") && (
                                <div>
                                  <label className="text-sm font-medium text-white mb-2 block">
                                    Submission URL
                                  </label>
                                  <Input
                                    placeholder="https://github.com/username/repository"
                                    value={forms[assignment.id]?.githubUrl || ""}
                                    onChange={(e) =>
                                      updateForm(
                                        assignment.id,
                                        "githubUrl",
                                        e.target.value
                                      )
                                    }
                                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                                  />
                                </div>
                              )}
                              {assignment.submissionType === "TEXT" && (
                                <div>
                                  <label className="text-sm font-medium text-white mb-2 block">
                                    Response
                                  </label>
                                  <Textarea
                                    placeholder="Share your response..."
                                    rows={4}
                                    value={forms[assignment.id]?.content || ""}
                                    onChange={(e) =>
                                      updateForm(
                                        assignment.id,
                                        "content",
                                        e.target.value
                                      )
                                    }
                                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                                  />
                                </div>
                              )}
                              <div>
                                <label className="text-sm font-medium text-white mb-2 block">
                                  Additional Notes
                                </label>
                                <Textarea
                                  placeholder="Any additional information about your submission..."
                                  rows={3}
                                  value={forms[assignment.id]?.notes || ""}
                                  onChange={(e) =>
                                    updateForm(
                                      assignment.id,
                                      "notes",
                                      e.target.value
                                    )
                                  }
                                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                                />
                              </div>
                              <Button
                                disabled={submitting[assignment.id]}
                                onClick={() => handleSubmit(assignment)}
                                className="w-full bg-gradient-to-r from-neon-green to-emerald-400 text-white">
                                {submitting[assignment.id] ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <Upload className="w-4 h-4 mr-2" />
                                )}
                                Submit Assignment
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                  <Code className="w-4 h-4 mr-2" />
                  Start
                </Button>
              </>
            )}
            {type === "completed" && (
              <>
                {assignment.liveUrl && (
                  <Button
                    className="flex-1 bg-gradient-to-r from-neon-purple to-pink-400 text-white"
                    onClick={() => window.open(assignment.liveUrl, "_blank")}>
                    <Play className="w-4 h-4 mr-2" />
                    View Live
                  </Button>
                )}
                {assignment.githubUrl && (
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                    onClick={() => window.open(assignment.githubUrl, "_blank")}>
                    <Github className="w-4 h-4 mr-2" />
                    Code
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const avgScore =
    completedAssignments.length > 0
      ? (
          completedAssignments.reduce(
            (sum, assignment) => sum + (assignment.score ?? 0),
            0
          ) / completedAssignments.length
        ).toFixed(1)
      : "0.0";

  const dueSoon = activeAssignments.filter((assignment) => {
    if (!assignment.dueDate) return false;
    const daysLeft =
      (new Date(assignment.dueDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24);
    return daysLeft <= 7 && daysLeft >= 0;
  }).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-32 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-neon-orange/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-white">My</span>{" "}
              <span className="text-gradient">Assignments</span>
            </h1>
            <p className="text-xl text-gray-300">
              Track your progress and submit your work
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {loading ? "-" : activeAssignments.length}
                </p>
                <p className="text-gray-400 text-sm">Active</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-neon-green to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {loading ? "-" : completedAssignments.length}
                </p>
                <p className="text-gray-400 text-sm">Completed</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-neon-orange to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {loading ? "-" : avgScore}
                </p>
                <p className="text-gray-400 text-sm">Avg Score</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-neon-purple to-pink-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {loading ? "-" : dueSoon}
                </p>
                <p className="text-gray-400 text-sm">Due Soon</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Assignment Tabs */}
      <section className="pb-16">
        <div className="container mx-auto px-6">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20 mb-8">
              <TabsTrigger
                value="active"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-blue data-[state=active]:to-neon-purple data-[state=active]:text-white">
                Active Assignments ({activeAssignments.length})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-green data-[state=active]:to-emerald-400 data-[state=active]:text-white">
                Completed ({completedAssignments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-8">
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="glass-card border-white/10">
                      <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : loadingError ? (
                <div className="text-center text-red-400">{loadingError}</div>
              ) : activeAssignments.length === 0 ? (
                <div className="text-center text-gray-400">
                  No active assignments found.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {activeAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      type="active"
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-8">
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <Card key={index} className="glass-card border-white/10">
                      <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : loadingError ? (
                <div className="text-center text-red-400">{loadingError}</div>
              ) : completedAssignments.length === 0 ? (
                <div className="text-center text-gray-400">
                  No completed assignments yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {completedAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      type="completed"
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
