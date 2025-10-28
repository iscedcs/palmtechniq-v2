"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MentorshipSession } from "@/data/studentmentorship";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Star,
  Plus,
} from "lucide-react";


interface PastSessionsProps {
  sessions: MentorshipSession[];
  userId: string;
}

export function PastSessions({ sessions, userId }: PastSessionsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          No Past Sessions
        </h3>
        <p className="text-gray-400">
          Completed sessions will appear here.
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
                <AvatarImage
                  src={session.tutor.avatar || "/placeholder.svg"}
                />
                <AvatarFallback className="bg-gradient-to-r from-neon-green to-emerald-400 text-white">
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
                <p className="text-gray-300">
                  {session.tutor.title || "Mentor"}
                </p>
                <p className="text-gray-400 text-sm">
                  {session.tutor.company || "Independent"}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
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
              <CheckCircle className="w-3 h-3 mr-1" />
              {session.status.replace("_", " ")}
            </Badge>
          </div>

          <div className="mb-4">
            <h4 className="text-white font-semibold mb-2">
              {session.title}
            </h4>
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
              <span>
                {new Date(session.scheduledAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <span>{session.duration} minutes</span>
              <span>•</span>
              <span>${session.price}</span>
            </div>
            
            {session.rating && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-400">
                  Your Rating:
                </span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (session.rating || 0)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-400 mb-2">Session Feedback</p>
            <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg">
              {session.feedback || "No feedback provided."}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-sm text-gray-400">
              Session completed on {session.endedAt ? new Date(session.endedAt).toLocaleDateString() : "Unknown date"}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book Again
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}