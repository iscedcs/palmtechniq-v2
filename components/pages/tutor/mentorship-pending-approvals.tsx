"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  approveMentorshipRequest,
  rejectMentorshipRequest,
} from "@/actions/mentorship-revenue";
import { DateTime } from "luxon";

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  image: string | null;
  avatar: string | null;
}

interface PendingSession {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  price: number;
  scheduledAt: Date;
  createdAt: Date;
  student: StudentInfo;
}

interface MentorshipPendingApprovalsProps {
  initialSessions: PendingSession[];
  onSessionUpdated?: () => void;
}

export function MentorshipPendingApprovals({
  initialSessions,
  onSessionUpdated,
}: MentorshipPendingApprovalsProps) {
  const [sessions, setSessions] = useState<PendingSession[]>(initialSessions);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async (sessionId: string) => {
    setProcessingId(sessionId);
    try {
      const result = await approveMentorshipRequest(sessionId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Session approved! Student will receive payment notification.");
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        onSessionUpdated?.();
      }
    } catch (error) {
      toast.error("Failed to approve session");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (sessionId: string) => {
    setProcessingId(sessionId);
    try {
      const result = await rejectMentorshipRequest(sessionId, rejectReason);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Session rejected. Student has been notified.");
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setShowRejectDialog(null);
        setRejectReason("");
        onSessionUpdated?.();
      }
    } catch (error) {
      toast.error("Failed to reject session");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  if (sessions.length === 0) {
    return (
      <Card className="glass-card border-white/10">
        <CardContent className="p-8 text-center">
          <p className="text-gray-300">No pending mentor approvals. Great work! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const scheduledTime = DateTime.fromJSDate(new Date(session.scheduledAt));
        const isExpired = scheduledTime < DateTime.now();

        return (
          <Card key={session.id} className="glass-card border-white/10">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={session.student.image || session.student.avatar || "/default-avatar.png"}
                      alt={session.student.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h3 className="font-semibold text-white">{session.student.name}</h3>
                      <p className="text-sm text-gray-400">{session.student.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div>
                      <h4 className="font-medium text-white">{session.title}</h4>
                      {session.description && (
                        <p className="text-sm text-gray-300 mt-1">{session.description}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-gray-400">
                        <span className="font-medium text-white">{session.duration}</span> mins
                      </span>
                      <span className="text-gray-400">
                        Scheduled: <span className="font-medium text-white">
                          {scheduledTime.toFormat("MMM d, yyyy h:mm a")}
                        </span>
                      </span>
                      <span className="text-gray-400">
                        Price: <span className="font-medium text-white">₦{session.price.toLocaleString()}</span>
                      </span>
                    </div>

                    {isExpired && (
                      <Badge className="bg-red-900/20 text-red-400 border-red-500/30">
                        Session time has passed
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    onClick={() => handleApprove(session.id)}
                    disabled={processingId === session.id}
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700"
                  >
                    {processingId === session.id ? "Approving..." : "Approve"}
                  </Button>
                  <Button
                    onClick={() => setShowRejectDialog(session.id)}
                    disabled={processingId === session.id}
                    variant="outline"
                    className="flex-1 md:flex-none border-red-500/30 text-red-400 hover:bg-red-900/20"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <AlertDialog open={!!showRejectDialog} onOpenChange={(open) => !open && setShowRejectDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Session</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this mentorship request. The student will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Time slot is not available, topic is outside my expertise..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (showRejectDialog && rejectReason.trim()) {
                  handleReject(showRejectDialog);
                } else {
                  toast.error("Please provide a rejection reason");
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingId ? "Rejecting..." : "Reject"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
