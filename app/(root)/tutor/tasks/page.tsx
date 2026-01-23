"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, CheckCircle, Plus, Pencil, Trash2 } from "lucide-react";
import {
  createTask,
  deleteTask,
  getTutorCoursesForTasks,
  getTutorTasks,
  getTaskSubmissions,
  gradeTaskSubmission,
  updateTask,
} from "@/actions/assignment";
import { toast } from "sonner";

export default function TutorTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [grading, setGrading] = useState<Record<string, boolean>>({});
  const [grades, setGrades] = useState<Record<string, { score: string; feedback: string }>>({});
  const [creatingTask, setCreatingTask] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPoints, setTaskPoints] = useState("100");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskActive, setTaskActive] = useState(true);
  const [taskSubmissionType, setTaskSubmissionType] = useState("FILE");
  const [taskCourseId, setTaskCourseId] = useState("");
  const [taskModuleId, setTaskModuleId] = useState("");
  const [taskRequirementInput, setTaskRequirementInput] = useState("");
  const [taskRequirements, setTaskRequirements] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPoints, setEditPoints] = useState("100");
  const [editDueDate, setEditDueDate] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editSubmissionType, setEditSubmissionType] = useState("FILE");
  const [editCourseId, setEditCourseId] = useState("");
  const [editModuleId, setEditModuleId] = useState("");
  const [editRequirementInput, setEditRequirementInput] = useState("");
  const [editRequirements, setEditRequirements] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Record<string, boolean>>({});
  const [filterCourseId, setFilterCourseId] = useState("all");
  const [filterModuleId, setFilterModuleId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const result = await getTutorTasks();
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        setTasks(result.tasks);
      } catch (error) {
        console.error("Failed to load tasks:", error);
        toast.error("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };

    const loadCourses = async () => {
      setLoadingCourses(true);
      try {
        const result = await getTutorCoursesForTasks();
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        setCourses(result.courses ?? []);
      } catch (error) {
        console.error("Failed to load courses:", error);
        toast.error("Failed to load courses.");
      } finally {
        setLoadingCourses(false);
      }
    };

    loadTasks();
    loadCourses();
  }, []);

  const courseOptions = useMemo(() => courses ?? [], [courses]);
  const moduleOptions = useMemo(() => {
    const selectedCourse = courseOptions.find((course) => course.id === taskCourseId);
    return selectedCourse?.modules ?? [];
  }, [courseOptions, taskCourseId]);
  const editModuleOptions = useMemo(() => {
    const selectedCourse = courseOptions.find((course) => course.id === editCourseId);
    return selectedCourse?.modules ?? [];
  }, [courseOptions, editCourseId]);
  const filterModuleOptions = useMemo(() => {
    if (filterCourseId === "all") return [];
    const selectedCourse = courseOptions.find((course) => course.id === filterCourseId);
    return selectedCourse?.modules ?? [];
  }, [courseOptions, filterCourseId]);

  const filteredTasks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesCourse =
        filterCourseId === "all" || task.courseId === filterCourseId;
      const matchesModule =
        filterModuleId === "all" || task.moduleId === filterModuleId;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" ? task.isActive : !task.isActive);
      const matchesSearch =
        term.length === 0 ||
        task.title?.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term);
      return matchesCourse && matchesModule && matchesStatus && matchesSearch;
    });
  }, [tasks, filterCourseId, filterModuleId, filterStatus, searchTerm]);

  const refreshTasks = async () => {
    const refreshed = await getTutorTasks();
    if ("error" in refreshed) {
      toast.error(refreshed.error);
      return;
    }
    setTasks(refreshed.tasks);
  };

  const resetCreateForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskPoints("100");
    setTaskDueDate("");
    setTaskActive(true);
    setTaskSubmissionType("FILE");
    setTaskCourseId("");
    setTaskModuleId("");
    setTaskRequirementInput("");
    setTaskRequirements([]);
  };

  const resetEditForm = () => {
    setEditingTask(null);
    setEditTitle("");
    setEditDescription("");
    setEditPoints("100");
    setEditDueDate("");
    setEditActive(true);
    setEditSubmissionType("FILE");
    setEditCourseId("");
    setEditModuleId("");
    setEditRequirementInput("");
    setEditRequirements([]);
  };

  const handleAddRequirement = () => {
    const value = taskRequirementInput.trim();
    if (!value) return;
    setTaskRequirements((prev) => [...prev, value]);
    setTaskRequirementInput("");
  };

  const handleRemoveRequirement = (index: number) => {
    setTaskRequirements((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !taskDescription.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    if (!taskCourseId || !taskModuleId) {
      toast.error("Course and module are required.");
      return;
    }
    if (taskRequirements.length === 0) {
      toast.error("Add at least one requirement.");
      return;
    }

    const points = Number(taskPoints);
    if (!Number.isFinite(points) || points < 1) {
      toast.error("Points must be at least 1.");
      return;
    }

    setCreatingTask(true);
    try {
      const result = await createTask({
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        requirements: taskRequirements,
        points,
        isActive: taskActive,
        courseId: taskCourseId,
        moduleId: taskModuleId,
        dueDate: taskDueDate ? new Date(taskDueDate) : null,
        submissionType: taskSubmissionType as any,
        resources: [],
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Task created.");
      resetCreateForm();
      setCreateOpen(false);
      await refreshTasks();
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task.");
    } finally {
      setCreatingTask(false);
    }
  };

  const openEdit = (task: any) => {
    setEditingTask(task);
    setEditTitle(task.title ?? "");
    setEditDescription(task.description ?? "");
    setEditPoints(String(task.points ?? 100));
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
    setEditActive(Boolean(task.isActive));
    setEditSubmissionType(task.submissionType ?? "FILE");
    setEditCourseId(task.courseId ?? "");
    setEditModuleId(task.moduleId ?? "");
    setEditRequirementInput("");
    setEditRequirements(task.requirements ?? []);
    setEditOpen(true);
  };

  const handleAddEditRequirement = () => {
    const value = editRequirementInput.trim();
    if (!value) return;
    setEditRequirements((prev) => [...prev, value]);
    setEditRequirementInput("");
  };

  const handleRemoveEditRequirement = (index: number) => {
    setEditRequirements((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;
    if (!editTitle.trim() || !editDescription.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    if (!editCourseId || !editModuleId) {
      toast.error("Course and module are required.");
      return;
    }
    if (editRequirements.length === 0) {
      toast.error("Add at least one requirement.");
      return;
    }
    const points = Number(editPoints);
    if (!Number.isFinite(points) || points < 1) {
      toast.error("Points must be at least 1.");
      return;
    }
    setSavingEdit(true);
    try {
      const result = await updateTask(editingTask.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        requirements: editRequirements,
        points,
        isActive: editActive,
        courseId: editCourseId,
        moduleId: editModuleId,
        dueDate: editDueDate ? new Date(editDueDate) : null,
        submissionType: editSubmissionType as any,
        resources: [],
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Task updated.");
      setEditOpen(false);
      resetEditForm();
      await refreshTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setDeletingTask((prev) => ({ ...prev, [taskId]: true }));
    try {
      const result = await deleteTask(taskId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Task deleted.");
      await refreshTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task.");
    } finally {
      setDeletingTask((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const openSubmissions = async (task: any) => {
    setActiveTask(task);
    setLoadingSubmissions(true);
    try {
      const result = await getTaskSubmissions(task.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSubmissions(result.submissions);
    } catch (error) {
      console.error("Failed to load submissions:", error);
      toast.error("Failed to load submissions.");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGrade = async (submissionId: string) => {
    const grade = grades[submissionId];
    if (!grade?.score || !grade?.feedback) {
      toast.error("Score and feedback are required.");
      return;
    }

    setGrading((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const result = await gradeTaskSubmission({
        submissionId,
        score: Number(grade.score),
        feedback: grade.feedback,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Submission graded.");
      await openSubmissions(activeTask);
    } catch (error) {
      console.error("Failed to grade submission:", error);
      toast.error("Failed to grade submission.");
    } finally {
      setGrading((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24">
      <section className="py-8">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Tasks</h1>
              <p className="text-gray-400">
                Manage module-level tasks and grade submissions.
              </p>
            </div>
            <Dialog open={createOpen} onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) resetCreateForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-white/10 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Task title"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Textarea
                    placeholder="Task description"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <div>
                    <label className="text-sm text-gray-400">
                      Requirements
                    </label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add requirement"
                        value={taskRequirementInput}
                        onChange={(e) => setTaskRequirementInput(e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddRequirement}
                        className="border-white/20 text-white hover:bg-white/10">
                        Add
                      </Button>
                    </div>
                    {taskRequirements.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {taskRequirements.map((req, idx) => (
                          <Badge
                            key={`${req}-${idx}`}
                            className="bg-white/10 text-gray-200 border-white/20">
                            {req}
                            <button
                              type="button"
                              onClick={() => handleRemoveRequirement(idx)}
                              className="ml-2 text-xs text-gray-400 hover:text-white">
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Points"
                      value={taskPoints}
                      onChange={(e) => setTaskPoints(e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <Input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      value={taskSubmissionType}
                      onValueChange={setTaskSubmissionType}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Submission type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FILE">File Upload</SelectItem>
                        <SelectItem value="GITHUB">GitHub</SelectItem>
                        <SelectItem value="LINK">Live Link</SelectItem>
                        <SelectItem value="TEXT">Text Response</SelectItem>
                        <SelectItem value="QUIZ">Quiz Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={taskActive ? "active" : "inactive"}
                      onValueChange={(value) =>
                        setTaskActive(value === "active")
                      }>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      value={taskCourseId}
                      onValueChange={(value) => {
                        setTaskCourseId(value);
                        setTaskModuleId("");
                      }}
                      disabled={loadingCourses}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue
                          placeholder={
                            loadingCourses ? "Loading courses..." : "Course"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {courseOptions.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={taskModuleId}
                      onValueChange={setTaskModuleId}
                      disabled={!taskCourseId || moduleOptions.length === 0}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue
                          placeholder={
                            !taskCourseId
                              ? "Select course first"
                              : moduleOptions.length === 0
                              ? "No modules"
                              : "Module"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {moduleOptions.map((module: any) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateOpen(false)}
                      className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateTask}
                      disabled={creatingTask}
                      className="bg-gradient-to-r from-neon-green to-emerald-400 text-white">
                      {creatingTask ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Create Task
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
          <Card className="glass-card border-white/10 mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <Input
                  placeholder="Search tasks"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
                <Select
                  value={filterCourseId}
                  onValueChange={(value) => {
                    setFilterCourseId(value);
                    setFilterModuleId("all");
                  }}
                  disabled={loadingCourses}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courseOptions.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterModuleId}
                  onValueChange={setFilterModuleId}
                  disabled={filterCourseId === "all" || filterModuleOptions.length === 0}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue
                      placeholder={
                        filterCourseId === "all"
                          ? "All modules"
                          : filterModuleOptions.length === 0
                          ? "No modules"
                          : "All modules"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All modules</SelectItem>
                    {filterModuleOptions.map((module: any) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterStatus}
                  onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Card key={`task-skeleton-${idx}`} className="glass-card border-white/10">
                  <CardHeader>
                    <Skeleton className="h-5 w-2/3 bg-white/10" />
                    <Skeleton className="h-4 w-1/2 bg-white/10 mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full bg-white/10" />
                    <Skeleton className="h-4 w-5/6 bg-white/10" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16 bg-white/10" />
                      <Skeleton className="h-4 w-24 bg-white/10" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-40 bg-white/10" />
                      <Skeleton className="h-9 w-24 bg-white/10" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card className="glass-card border-white/10">
              <CardContent className="p-12 text-center text-gray-400">
                No tasks match your filters.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>{task.title}</span>
                      <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">
                        {task.submissionType}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-400">
                      {task.course.title} • {task.module.title}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-300">{task.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{task.points} pts</span>
                      <span>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "No due date"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                            onClick={() => openSubmissions(task)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Submissions ({task.submissions.length})
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black/90 border-white/10 max-w-3xl">
                          <DialogHeader>
                            <DialogTitle className="text-white">
                              {task.title} Submissions
                            </DialogTitle>
                          </DialogHeader>
                        {loadingSubmissions ? (
                          <div className="space-y-3 py-4">
                            {Array.from({ length: 3 }).map((_, idx) => (
                              <Card key={`submission-skeleton-${idx}`} className="glass-card border-white/10">
                                <CardContent className="p-4 space-y-3">
                                  <Skeleton className="h-4 w-1/3 bg-white/10" />
                                  <Skeleton className="h-3 w-1/2 bg-white/10" />
                                  <Skeleton className="h-4 w-full bg-white/10" />
                                  <div className="grid grid-cols-2 gap-3">
                                    <Skeleton className="h-9 w-full bg-white/10" />
                                    <Skeleton className="h-9 w-full bg-white/10" />
                                  </div>
                                  <Skeleton className="h-9 w-40 bg-white/10" />
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          ) : submissions.length === 0 ? (
                            <div className="text-gray-400 text-center py-6">
                              No submissions yet.
                            </div>
                          ) : (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                              {submissions.map((submission) => (
                                <Card
                                  key={submission.id}
                                  className="glass-card border-white/10">
                                  <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-white font-semibold">
                                          {submission.user.name || "Student"}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          {submission.user.email}
                                        </p>
                                      </div>
                                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                        {submission.status}
                                      </Badge>
                                    </div>
                                    {submission.githubUrl && (
                                      <a
                                        href={submission.githubUrl}
                                        className="text-neon-blue text-sm"
                                        target="_blank"
                                        rel="noreferrer">
                                        {submission.githubUrl}
                                      </a>
                                    )}
                                    {submission.liveUrl && (
                                      <a
                                        href={submission.liveUrl}
                                        className="text-neon-blue text-sm"
                                        target="_blank"
                                        rel="noreferrer">
                                        {submission.liveUrl}
                                      </a>
                                    )}
                                    {submission.content && (
                                      <p className="text-sm text-gray-300">
                                        {submission.content}
                                      </p>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                      <Input
                                        placeholder="Score"
                                        value={grades[submission.id]?.score || ""}
                                        onChange={(e) =>
                                          setGrades((prev) => ({
                                            ...prev,
                                            [submission.id]: {
                                              score: e.target.value,
                                              feedback:
                                                prev[submission.id]?.feedback ||
                                                "",
                                            },
                                          }))
                                        }
                                        className="bg-white/10 border-white/20 text-white"
                                      />
                                      <Textarea
                                        placeholder="Feedback"
                                        value={
                                          grades[submission.id]?.feedback || ""
                                        }
                                        onChange={(e) =>
                                          setGrades((prev) => ({
                                            ...prev,
                                            [submission.id]: {
                                              score: prev[submission.id]?.score || "",
                                              feedback: e.target.value,
                                            },
                                          }))
                                        }
                                        className="bg-white/10 border-white/20 text-white"
                                      />
                                    </div>
                                    <Button
                                      onClick={() => handleGrade(submission.id)}
                                      disabled={grading[submission.id]}
                                      className="bg-gradient-to-r from-neon-green to-emerald-400 text-white">
                                      {grading[submission.id] ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                      ) : (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                      )}
                                      Grade
                                    </Button>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                        onClick={() => openEdit(task)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="border-red-500/40 text-red-200 hover:bg-red-500/10 bg-transparent"
                            disabled={deletingTask[task.id]}>
                            {deletingTask[task.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-black/90 border-white/10">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">
                              Delete task?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              This will permanently remove the task and its submissions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTask(task.id)}
                              className="bg-red-500 text-white hover:bg-red-600">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) resetEditForm();
        }}>
        <DialogContent className="bg-black/90 border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Task title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
            <Textarea
              placeholder="Task description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
            <div>
              <label className="text-sm text-gray-400">Requirements</label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add requirement"
                  value={editRequirementInput}
                  onChange={(e) => setEditRequirementInput(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddEditRequirement}
                  className="border-white/20 text-white hover:bg-white/10">
                  Add
                </Button>
              </div>
              {editRequirements.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {editRequirements.map((req, idx) => (
                    <Badge
                      key={`${req}-${idx}`}
                      className="bg-white/10 text-gray-200 border-white/20">
                      {req}
                      <button
                        type="button"
                        onClick={() => handleRemoveEditRequirement(idx)}
                        className="ml-2 text-xs text-gray-400 hover:text-white">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                type="number"
                min={1}
                placeholder="Points"
                value={editPoints}
                onChange={(e) => setEditPoints(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                value={editSubmissionType}
                onValueChange={setEditSubmissionType}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Submission type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FILE">File Upload</SelectItem>
                  <SelectItem value="GITHUB">GitHub</SelectItem>
                  <SelectItem value="LINK">Live Link</SelectItem>
                  <SelectItem value="TEXT">Text Response</SelectItem>
                  <SelectItem value="QUIZ">Quiz Only</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={editActive ? "active" : "inactive"}
                onValueChange={(value) => setEditActive(value === "active")}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                value={editCourseId}
                onValueChange={(value) => {
                  setEditCourseId(value);
                  setEditModuleId("");
                }}
                disabled={loadingCourses}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue
                    placeholder={
                      loadingCourses ? "Loading courses..." : "Course"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={editModuleId}
                onValueChange={setEditModuleId}
                disabled={!editCourseId || editModuleOptions.length === 0}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue
                    placeholder={
                      !editCourseId
                        ? "Select course first"
                        : editModuleOptions.length === 0
                        ? "No modules"
                        : "Module"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {editModuleOptions.map((module: any) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="bg-gradient-to-r from-neon-green to-emerald-400 text-white">
                {savingEdit ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
