"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ExternalLink, FileText, Code, Globe } from "lucide-react";
import { getProjectSubmissions } from "@/actions/project";
import { generateRandomAvatar } from "@/lib/utils";

interface ProjectSubmissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
}

export function ProjectSubmissionsModal({
  open,
  onOpenChange,
  projectId,
}: ProjectSubmissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !projectId) return;

    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const result = await getProjectSubmissions(projectId);
        if (result.project) {
          setProjectTitle(result.project.title);
        }
        if (result.submissions) {
          setSubmissions(result.submissions);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [open, projectId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "GRADED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "SUBMITTED":
        return "bg-neon-blue/20 text-neon-blue border-neon-blue/30";
      case "PENDING":
        return "bg-neon-orange/20 text-neon-orange border-neon-orange/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Project Submissions
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {projectTitle ? `Submissions for ${projectTitle}` : "Loading..."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No submissions yet.
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={
                          submission.student.avatar || generateRandomAvatar()
                        }
                      />
                      <AvatarFallback>
                        {submission.student.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-white font-medium">
                        {submission.student.name}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {submission.student.email}
                      </div>
                      <div className="text-gray-400 text-xs mt-1">
                        Submitted {submission.submittedAt}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status}
                    </Badge>
                    {submission.score !== null && (
                      <div className="text-white font-semibold mt-2">
                        {Math.round(submission.score)}%
                      </div>
                    )}
                  </div>
                </div>

                {(submission.githubUrl ||
                  submission.liveUrl ||
                  submission.fileUrl) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {submission.githubUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                        <a
                          href={submission.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer">
                          <Code className="w-4 h-4 mr-2" />
                          GitHub
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </a>
                      </Button>
                    )}
                    {submission.liveUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                        <a
                          href={submission.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer">
                          <Globe className="w-4 h-4 mr-2" />
                          Live Demo
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </a>
                      </Button>
                    )}
                    {submission.fileUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer">
                          <FileText className="w-4 h-4 mr-2" />
                          Download
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {submission.feedback && (
                  <div className="text-gray-300 text-sm bg-white/5 p-3 rounded-lg">
                    <div className="text-white font-medium mb-1">Feedback</div>
                    {submission.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
