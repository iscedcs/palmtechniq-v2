"use client";

import { Users } from "lucide-react";
import { StudentCard } from "./student-card";

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

interface StudentListProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
}

export function StudentList({ students, onSelectStudent }: StudentListProps) {
  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No students found</p>
        <p className="text-gray-500 text-sm">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {students.map((student, index) => (
        <StudentCard
          key={student.id}
          student={student}
          index={index}
          onSelect={onSelectStudent}
        />
      ))}
    </div>
  );
}
