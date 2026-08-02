"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDurationMinutes } from "@/lib/utils";
import { Star, Users, Clock, Compass } from "lucide-react";

export default function CourseHero({
  title,
  subtitle,
  tutor,
  averageRating,
  totalStudents,
  duration,
}: {
  title: string;
  subtitle?: string;
  tutor: { user: { name: string; image?: string } };
  averageRating?: number;
  totalStudents?: number;
  duration?: number | string;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      {subtitle && <p className="text-gray-400">{subtitle}</p>}

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center text-yellow-400">
          <Star className="w-4 h-4 mr-1" />
          {(averageRating || 0).toFixed(1)} rating
        </div>
        <div className="flex items-center text-gray-400">
          <Users className="w-4 h-4 mr-1" />
          {totalStudents || 0} students
        </div>
        <div className="flex items-center text-gray-400">
          <Clock className="w-4 h-4 mr-1" />
          {duration ? `${duration}` : "Self-paced"}
        </div>
        <div className="flex items-center text-gray-400">
          <Compass className="w-4 h-4 mr-1" />
          Self-paced
        </div>
      </div>

      <div className="flex items-center">
        <Avatar className="w-10 h-10 mr-3">
          <AvatarImage src={tutor.user.image} />
          <AvatarFallback>{tutor.user.name?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
        <span className="text-gray-300">Instructor: {tutor.user.name}</span>
      </div>
    </div>
  );
}
