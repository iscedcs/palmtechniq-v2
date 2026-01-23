"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, BarChart3 } from "lucide-react";
import { getProjectAnalytics } from "@/actions/project";

interface ProjectAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
}

export function ProjectAnalyticsModal({
  open,
  onOpenChange,
  projectId,
}: ProjectAnalyticsModalProps) {
  const [loading, setLoading] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [analytics, setAnalytics] = useState<{
    totalSubmissions: number;
    gradedSubmissions: number;
    pendingSubmissions: number;
    averageScore: number;
    completionRate: number;
  } | null>(null);

  useEffect(() => {
    if (!open || !projectId) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const result = await getProjectAnalytics(projectId);
        if (result.project) {
          setProjectTitle(result.project.title);
        }
        if (result.analytics) {
          setAnalytics(result.analytics);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [open, projectId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Project Analytics
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {projectTitle ? `Analytics for ${projectTitle}` : "Loading..."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 text-neon-blue mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {analytics.totalSubmissions}
                </div>
                <div className="text-gray-400 text-sm">Total Submissions</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-white">
                  {analytics.gradedSubmissions}
                </div>
                <div className="text-gray-400 text-sm">Graded</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-white">
                  {analytics.pendingSubmissions}
                </div>
                <div className="text-gray-400 text-sm">Pending</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-white">
                  {analytics.averageScore}%
                </div>
                <div className="text-gray-400 text-sm">Average Score</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-white/10 md:col-span-2">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-white">
                  {analytics.completionRate}%
                </div>
                <div className="text-gray-400 text-sm">Completion Rate</div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            No analytics available.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
