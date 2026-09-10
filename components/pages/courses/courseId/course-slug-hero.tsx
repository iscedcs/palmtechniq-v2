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
  tutor: { id?: string; user: { name: string; image?: string } };
  averageRating?: number;
  totalStudents?: number;
  duration?: number | string;
}) {
  const tutorHref = tutor.id ? `/tutors/${encodeURIComponent(tutor.id)}` : undefined;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      {subtitle && <p className="text-gray-400">{subtitle}</p>}

      <div className="flex flex-wrap items-center gap-x-3.5 sm:gap-x-5 gap-y-2 text-xs sm:text-sm">
        <div className="flex items-center text-amber-400 font-medium whitespace-nowrap">
          <Star className="w-4 h-4 fill-amber-400 mr-1.5 shrink-0" />
          <span>{(averageRating || 0).toFixed(1)} rating</span>
        </div>

        <span className="text-white/20 select-none hidden sm:inline">•</span>

        <div className="flex items-center text-gray-300 font-medium whitespace-nowrap">
          <Users className="w-4 h-4 text-neon-blue mr-1.5 shrink-0" />
          <span>{(totalStudents || 0).toLocaleString()} students</span>
        </div>

        <span className="text-white/20 select-none hidden sm:inline">•</span>

        <div className="flex items-center text-gray-300 font-medium whitespace-nowrap">
          <Clock className="w-4 h-4 text-neon-purple mr-1.5 shrink-0" />
          <span>{duration ? `${duration}` : "Self-paced"}</span>
        </div>

        <span className="text-white/20 select-none hidden sm:inline">•</span>

        <div className="flex items-center text-gray-300 font-medium whitespace-nowrap">
          <Compass className="w-4 h-4 text-emerald-400 mr-1.5 shrink-0" />
          <span>Self-paced</span>
        </div>
      </div>

      <div className="flex items-center">
        {tutorHref ? (
          <a
            href={tutorHref}
            className="group flex items-center hover:opacity-95 transition-opacity">
            <Avatar className="w-10 h-10 mr-3 ring-2 ring-transparent group-hover:ring-neon-blue transition-all">
              <AvatarImage src={tutor.user.image} />
              <AvatarFallback>{tutor.user.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <span className="text-gray-300">
              Instructor:{" "}
              <span className="font-semibold text-white group-hover:text-neon-blue underline underline-offset-4 decoration-neon-blue/40 transition-colors">
                {tutor.user.name}
              </span>
            </span>
          </a>
        ) : (
          <div className="flex items-center">
            <Avatar className="w-10 h-10 mr-3">
              <AvatarImage src={tutor.user.image} />
              <AvatarFallback>{tutor.user.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <span className="text-gray-300">Instructor: {tutor.user.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
