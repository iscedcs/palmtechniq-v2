"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardHeader, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  coursesEnrolled: {
    id: string;
    title: string;
    progress: number;
    status: "in-progress" | "completed" | "not-started";
  }[];
  totalProgress: number;
  assignmentsSubmitted: number;
  assignmentsPending: number;
  messagesCount: number;
  lastActive: string;
  status: "active" | "inactive";
  country?: string;
  phone?: string;
}

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
}

export function StudentDetailModal({
  student,
  onClose,
}: StudentDetailModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "border-green-500 text-green-400 bg-green-500/10";
      case "inactive":
        return "border-gray-500 text-gray-400 bg-gray-500/10";
      default:
        return "border-gray-500 text-gray-400 bg-gray-500/10";
    }
  };

  if (!student) return null;

  return (
    <AnimatePresence>
      {student && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onClose}>
            <motion.div
              className="glass-card border-white/10 rounded-2xl w-full max-w-2xl max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 ring-2 ring-neon-blue/50">
                      <AvatarImage
                        src={student.avatar || "/placeholder.svg"}
                        alt={student.name}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white text-lg">
                        {student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {student.name}
                      </h2>
                      <p className="text-gray-400">{student.email}</p>
                      <Badge
                        className={`mt-2 ${getStatusColor(student.status)}`}>
                        {student.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="hover:bg-white/10">
                    ✕
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Country</p>
                    <p className="text-white font-semibold">
                      {student.country || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Phone</p>
                    <p className="text-white font-semibold">
                      {student.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Join Date</p>
                    <p className="text-white font-semibold">
                      {new Date(student.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Last Active</p>
                    <p className="text-white font-semibold">
                      {student.lastActive}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <p className="text-gray-400 text-sm mb-3">Overall Progress</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white">
                        {student.totalProgress}%
                      </span>
                    </div>
                    <Progress value={student.totalProgress} className="h-3" />
                  </div>
                </div>

                {/* Enrolled Courses */}
                <div>
                  <p className="text-gray-400 text-sm mb-3">Enrolled Courses</p>
                  <div className="space-y-2">
                    {student.coursesEnrolled.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white/5 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-semibold">
                            {course.title}
                          </span>
                          <Badge
                            className={`${
                              course.status === "completed"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            }`}>
                            {course.status === "completed"
                              ? "Completed"
                              : "In Progress"}
                          </Badge>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                        <p className="text-gray-400 text-xs mt-1">
                          {course.progress}% Complete
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assignments */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-400 text-sm">Submitted</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {student.assignmentsSubmitted}
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-400 text-sm">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {student.assignmentsPending}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 bg-gradient-to-r from-neon-blue to-cyan-400 text-white">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-neon-purple to-pink-400 text-white">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Call
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
