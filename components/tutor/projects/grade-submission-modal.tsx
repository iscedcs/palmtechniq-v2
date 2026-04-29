"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gradeSubmissionSchema, type GradeSubmissionFormData } from "@/schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, FileText, Code, Globe } from "lucide-react";
import { gradeSubmission } from "@/actions/project";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateRandomAvatar } from "@/lib/utils";

interface Submission {
  id: string;
  title: string;
  student: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  course: string;
  submittedAt: string;
  dueDate: string | null;
  difficulty: string;
  points: number;
  description: string;
  requirements: string[];
  githubUrl?: string | null;
  liveUrl?: string | null;
  fileUrl?: string | null;
  notes?: string | null;
  content?: string | null;
  isOverdue: boolean;
}

interface GradeSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission | null;
  onSuccess?: () => void;
}

export function GradeSubmissionModal({
  open,
  onOpenChange,
  submission,
  onSuccess,
}: GradeSubmissionModalProps) {
  const [isPending, startTransition] = useTransition();
  const [score, setScore] = useState(0);

  const form = useForm<GradeSubmissionFormData>({
    resolver: zodResolver(gradeSubmissionSchema),
    defaultValues: {
      submissionId: "",
      score: 0,
      feedback: "",
    },
  });

  // Update form when submission changes
  useEffect(() => {
    if (submission) {
      form.setValue("submissionId", submission.id);
      form.setValue("score", 0);
      form.setValue("feedback", "");
      setScore(0);
    }
  }, [submission, form]);

  const onSubmit = (data: GradeSubmissionFormData) => {
    if (!submission) return;

    startTransition(async () => {
      const result = await gradeSubmission(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Submission graded successfully!");
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      }
    });
  };

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

  const getGradeFromScore = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  const getGradeColor = (grade: string) => {
    if (grade === "A") return "text-green-400";
    if (grade === "B") return "text-blue-400";
    if (grade === "C") return "text-yellow-400";
    if (grade === "D") return "text-orange-400";
    return "text-red-400";
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Grade Submission
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Review and grade the student's submission
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission Info */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage
                  src={submission.student.avatar || generateRandomAvatar()}
                />
                <AvatarFallback>
                  {submission.student.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-1">
                  {submission.title}
                </h3>
                <p className="text-gray-400 text-sm mb-2">
                  by {submission.student.name} ({submission.student.email})
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">
                    {submission.course}
                  </Badge>
                  <Badge className={getDifficultyColor(submission.difficulty)}>
                    {submission.difficulty}
                  </Badge>
                  {submission.isOverdue && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {submission.description && (
              <div className="mt-4">
                <h4 className="text-white font-semibold mb-2 text-sm">
                  Submission Notes:
                </h4>
                <p className="text-gray-300 text-sm">
                  {submission.description}
                </p>
              </div>
            )}

            {/* Submission Links */}
            <div className="mt-4 flex flex-wrap gap-2">
              {submission.githubUrl && (
                <a
                  href={submission.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-white text-sm transition-colors">
                  <Code className="w-4 h-4" />
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {submission.liveUrl && (
                <a
                  href={submission.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-white text-sm transition-colors">
                  <Globe className="w-4 h-4" />
                  Live Demo
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {submission.fileUrl && (
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-white text-sm transition-colors">
                  <FileText className="w-4 h-4" />
                  Download File
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Requirements */}
            {submission.requirements.length > 0 && (
              <div className="mt-4">
                <h4 className="text-white font-semibold mb-2 text-sm">
                  Requirements:
                </h4>
                <ul className="space-y-1">
                  {submission.requirements.map((req, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-gray-300 text-sm">
                      <span className="text-neon-green mt-0.5">✓</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Grading Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="submissionId"
                render={({ field }) => <input type="hidden" {...field} />}
              />

              {/* Score */}
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Score (0-100)</FormLabel>
                    <div className="space-y-2">
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          max={100}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            field.onChange(value);
                            setScore(value);
                          }}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </FormControl>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={field.value}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(value);
                            setScore(value);
                          }}
                          className="flex-1"
                        />
                        <div className="text-right min-w-[100px]">
                          <div
                            className={`text-2xl font-bold ${getGradeColor(
                              getGradeFromScore(score)
                            )}`}>
                            {getGradeFromScore(score)}
                          </div>
                          <div className="text-gray-400 text-sm">{score}%</div>
                        </div>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Feedback */}
              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Provide detailed feedback on the submission..."
                        rows={6}
                        className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-white/20 text-white hover:bg-white/10">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-gradient-to-r from-neon-green to-emerald-400 text-white">
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Grading...
                    </>
                  ) : (
                    "Submit Grade"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
