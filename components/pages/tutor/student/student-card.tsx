"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  Calendar,
  MoreVertical,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mail, Phone, Award } from "lucide-react";

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

interface StudentCardProps {
  student: Student;
  index: number;
  onSelect: (student: Student) => void;
}

export function StudentCard({ student, index, onSelect }: StudentCardProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group cursor-pointer"
      onClick={() => onSelect(student)}>
      <div className="flex items-center justify-between gap-4">
        {/* Left Section - Student Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Avatar className="w-12 h-12 ring-2 ring-neon-blue/50">
            <AvatarImage
              src={student.avatar || "/placeholder.svg"}
              alt={student.name}
            />
            <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
              {student.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold group-hover:text-gradient transition-colors">
                {student.name}
              </h3>
              <Badge className={getStatusColor(student.status)}>
                {student.status === "active" && (
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                )}
                {student.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-gray-400 text-sm truncate">{student.email}</p>
            <p className="text-gray-500 text-xs mt-1">
              Joined {new Date(student.joinDate).toLocaleDateString()}
            </p>

            <p className="text-gray-500 text-xs mt-1">
              Last active: {student.lastActive}
            </p>
          </div>
        </div>

        {/* Middle Section - Courses & Progress */}
        <div className="hidden md:flex items-center gap-8">
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Courses</p>
            <p className="text-white font-semibold">
              {student.coursesEnrolled.length}
            </p>
          </div>
          <div className="w-32">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-xs">Progress</span>
              <span className="text-white text-xs font-semibold">
                {student.totalProgress}%
              </span>
            </div>
            <Progress value={student.totalProgress} className="h-2" />
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Assignments</p>
            <p className="text-white font-semibold">
              {student.assignmentsSubmitted}
              <span className="text-gray-500 text-xs ml-1">
                /{student.assignmentsSubmitted + student.assignmentsPending}
              </span>
            </p>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* <Button
            size="icon"
            variant="ghost"
            className="hover:bg-neon-blue/20 hover:text-neon-blue"
            title="Send Message"
            onClick={(e) => e.stopPropagation()}>
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="hover:bg-neon-purple/20 hover:text-neon-purple"
            title="Schedule Meeting"
            onClick={(e) => e.stopPropagation()}>
            <Calendar className="w-4 h-4" />
          </Button> */}
          <Button
            size="icon"
            variant="ghost"
            className="hover:bg-neon-purple/20 hover:text-neon-purple"
            title="Schedule Meeting"
            onClick={(e) => e.stopPropagation()}>
                <Award className="w-4 h-4 mr-2" />
                   </Button> 
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="hover:bg-white/10">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="glass-card border-white/10">
              {/* <DropdownMenuItem>
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </DropdownMenuItem> */}
              {/* <DropdownMenuItem>
                <Phone className="w-4 h-4 mr-2" />
                Call
              </DropdownMenuItem> */}
              <DropdownMenuItem>
                <Award className="w-4 h-4 mr-2" />
                View Certificate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-neon-blue transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
