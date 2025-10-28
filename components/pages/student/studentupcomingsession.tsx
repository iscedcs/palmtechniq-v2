"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CalendarIcon, Clock, Video, MessageSquare } from "lucide-react";

import {
  cancelMentorshipSession,
  MentorshipSession,
} from "@/data/studentmentorship";

interface UpcomingSessionsProps {
  sessions: MentorshipSession[];
  userId: string;
}

export function UpcomingSessions({ sessions, userId }: UpcomingSessionsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "IN_PROGRESS":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    if (confirm("Are you sure you want to cancel this session?")) {
      const result = await cancelMentorshipSession(sessionId, userId);
      if (result.success) {
        // Session will be refreshed via revalidatePath
      } else {
        alert("Failed to cancel session: " + result.error);
      }
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          No Upcoming Sessions
        </h3>
        <p className="text-gray-400">
          Book your first session with a mentor to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sessions.map((session, index) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="p-6 bg-white/5 rounded-lg border border-white/10"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={session.tutor.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                  {session.tutor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {session.tutor.name}
                </h3>
                <p className="text-gray-300">{session.tutor.title}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm text-gray-300">
                    {session.tutor.averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-400 text-sm">
                    ({session.tutor.totalReviews} reviews)
                  </span>
                </div>
              </div>
            </div>
            <Badge className={getStatusColor(session.status)}>
              {session.status.replace("_", " ")}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-white font-semibold mb-2">{session.title}</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>
                    {new Date(session.scheduledAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(session.scheduledAt).toLocaleTimeString()} (
                    {session.duration} min)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <span>Video Call</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Session Notes</p>
              <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg">
                {session.notes || "No notes added for this session."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-sm text-gray-400">
              Price: ${session.price}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
              {session.status === "SCHEDULED" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10 bg-transparent"
                  onClick={() => handleCancelSession(session.id)}
                >
                  Cancel
                </Button>
              )}
              <Button
                className="bg-gradient-to-r from-neon-blue to-neon-purple text-white"
                onClick={() => window.open(session.meetingUrl!, "_blank")}
                disabled={!session.meetingUrl}
              >
                <Video className="w-4 h-4 mr-2" />
                {session.meetingUrl ? "Join Session" : "Link Not Ready"}
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
