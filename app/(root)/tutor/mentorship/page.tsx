"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getTutorMentorshipSessions,
  getTutorPendingApprovals,
  updateTutorMentorshipSessionStatus,
} from "@/actions/mentorship-revenue";
import { MentorshipPendingApprovals } from "@/components/pages/tutor/mentorship-pending-approvals";

type SessionItem = {
  id: string;
  title: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "PENDING_MENTOR_REVIEW" | "REJECTED";
  scheduledAt: Date;
  duration: number;
  price: number;
  notes: string | null;
  student: { name: string; email: string };
};

type PendingApprovalSession = {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  price: number;
  scheduledAt: Date;
  createdAt: Date;
  student: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    avatar: string | null;
  };
};

export default function TutorMentorshipPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsResult, approvalsResult] = await Promise.all([
        getTutorMentorshipSessions(),
        getTutorPendingApprovals(),
      ]);

      if ("error" in sessionsResult) {
        toast.error(sessionsResult.error);
      } else {
        setSessions((sessionsResult.sessions || []) as SessionItem[]);
      }

      if ("error" in approvalsResult) {
        console.log("No pending approvals");
      } else {
        setPendingApprovals((approvalsResult.sessions || []) as PendingApprovalSession[]);
      }
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pending = useMemo(
    () => sessions.filter((s) => s.status === "SCHEDULED"),
    [sessions]
  );
  const active = useMemo(
    () => sessions.filter((s) => s.status === "IN_PROGRESS"),
    [sessions]
  );
  const completed = useMemo(
    () => sessions.filter((s) => s.status === "COMPLETED"),
    [sessions]
  );
  const totalRevenue = useMemo(
    () => completed.reduce((sum, item) => sum + item.price, 0),
    [completed]
  );

  const updateStatus = async (sessionId: string, status: SessionItem["status"]) => {
    setUpdatingId(sessionId);
    const result = await updateTutorMentorshipSessionStatus({
      mentorshipSessionId: sessionId,
      status,
    });
    if ("error" in result) {
      toast.error(result.error);
      setUpdatingId(null);
      return;
    }
    toast.success(`Session moved to ${status}`);
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, status } : session))
    );
    setUpdatingId(null);
  };

  const SessionRow = ({ session }: { session: SessionItem }) => (
    <Card className="glass-card border-white/10">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white font-semibold">{session.title}</p>
            <p className="text-gray-400 text-sm">
              {session.student.name} ({session.student.email})
            </p>
            <p className="text-gray-400 text-sm">
              {new Date(session.scheduledAt).toLocaleString()} · {session.duration} mins
            </p>
          </div>
          <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">
            {session.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-white">₦{session.price.toLocaleString()}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={updatingId === session.id}
              onClick={() => updateStatus(session.id, "IN_PROGRESS")}
            >
              Start
            </Button>
            <Button
              size="sm"
              disabled={updatingId === session.id}
              onClick={() => updateStatus(session.id, "COMPLETED")}
            >
              Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-400 border-red-500/40"
              disabled={updatingId === session.id}
              onClick={() => updateStatus(session.id, "CANCELLED")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-6 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">Tutor Mentorship Ops</h1>
            <p className="text-gray-300">Manage request-first and paid sessions from one queue.</p>
          </div>
          <Link href="/tutor/mentorship/schedule">
            <Button className="gap-2">
              <Calendar className="h-4 w-4" />
              Create Offering
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="glass-card border-white/10">
            <CardContent className="p-5">
              <p className="text-gray-400 text-sm">Pending Approvals</p>
              <p className="text-2xl text-white">{pendingApprovals.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardContent className="p-5">
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl text-white">{pending.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardContent className="p-5">
              <p className="text-gray-400 text-sm">In Progress</p>
              <p className="text-2xl text-white">{active.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardContent className="p-5">
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl text-white">{completed.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardContent className="p-5">
              <p className="text-gray-400 text-sm">Revenue (gross)</p>
              <p className="text-2xl text-white">₦{totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 border border-white/20">
            <TabsTrigger value="approvals" className="relative">
              Approvals
              {pendingApprovals.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value="approvals" className="space-y-4">
            {loading ? (
              <p className="text-gray-300">Loading approvals...</p>
            ) : (
              <MentorshipPendingApprovals
                initialSessions={pendingApprovals}
                onSessionUpdated={loadData}
              />
            )}
          </TabsContent>
          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              <p className="text-gray-300">Loading sessions...</p>
            ) : pending.length === 0 ? (
              <p className="text-gray-300">No pending mentorship sessions.</p>
            ) : (
              pending.map((session) => <SessionRow key={session.id} session={session} />)
            )}
          </TabsContent>
          <TabsContent value="active" className="space-y-4">
            {active.length === 0 ? (
              <p className="text-gray-300">No active sessions.</p>
            ) : (
              active.map((session) => <SessionRow key={session.id} session={session} />)
            )}
          </TabsContent>
          <TabsContent value="completed" className="space-y-4">
            {completed.length === 0 ? (
              <p className="text-gray-300">No completed sessions yet.</p>
            ) : (
              completed.map((session) => <SessionRow key={session.id} session={session} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
