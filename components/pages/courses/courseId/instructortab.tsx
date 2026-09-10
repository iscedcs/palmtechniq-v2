"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Star,
  Users,
  BookOpen,
  Award,
  Clock,
  ShieldCheck,
  Calendar,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NairaSign } from "@/components/shared/naira-sign-icon";

export interface OtherCourseItem {
  id: string;
  title: string;
  slug?: string | null;
  thumbnail?: string | null;
  price?: number | null;
  salePrice?: number | null;
  currentPrice?: number | null;
  level?: string | null;
}

export interface InstructorTabProps {
  tutor: {
    id?: string;
    userId?: string;
    user: {
      name: string;
      image?: string | null;
    };
    rating?: number;
    students?: number;
    courses?: number;
    bio?: string;
    title?: string;
    expertise?: string[];
    hourlyRate?: number;
    experience?: number;
    otherCourses?: OtherCourseItem[];
  };
}

export default function InstructorTab({ tutor }: InstructorTabProps) {
  const {
    id: tutorId,
    user,
    rating,
    students,
    courses,
    bio,
    title,
    expertise = [],
    hourlyRate,
    experience,
    otherCourses = [],
  } = tutor;

  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const fullBio =
    bio ||
    `${user.name} is an experienced instructor dedicated to helping students master real-world tech skills on PalmTechnIQ.`;

  const isBioLong = fullBio.length > 280;
  const displayedBio = isBioExpanded || !isBioLong ? fullBio : `${fullBio.slice(0, 280)}...`;

  const profileUrl = tutorId ? `/tutors/${encodeURIComponent(tutorId)}` : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6">
      <Card className="glass-card border-white/10 overflow-hidden bg-gradient-to-br from-white/[0.03] via-background to-neon-purple/[0.05]">
        <CardContent className="p-5 sm:p-8 space-y-6">
          {/* Main Info Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 sm:gap-6">
            {/* Avatar with Verified Status */}
            <div className="relative shrink-0">
              {profileUrl ? (
                <Link href={profileUrl} className="block group">
                  <Avatar className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-neon-blue/20 group-hover:ring-neon-blue transition-all shadow-xl shadow-neon-blue/10 bg-[#0d121f]">
                    <AvatarImage src={user.image || "/placeholder.svg"} className="object-cover" />
                    <AvatarFallback className="text-3xl font-semibold bg-gradient-to-br from-neon-blue to-neon-purple text-white">
                      {user.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-neon-blue/20 shadow-xl shadow-neon-blue/10 bg-[#0d121f]">
                  <AvatarImage src={user.image || "/placeholder.svg"} className="object-cover" />
                  <AvatarFallback className="text-3xl font-semibold bg-gradient-to-br from-neon-blue to-neon-purple text-white">
                    {user.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1 rounded-full shadow-lg"
                title="Verified PalmTechnIQ Instructor">
                <ShieldCheck className="w-4 h-4 text-black" />
              </div>
            </div>

            {/* Instructor Name & Title */}
            <div className="flex-1 min-w-0 w-full space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  {profileUrl ? (
                    <Link
                      href={profileUrl}
                      className="text-2xl sm:text-3xl font-bold text-white tracking-tight hover:text-neon-blue transition-colors inline-block">
                      {user.name}
                    </Link>
                  ) : (
                    <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {user.name}
                    </h3>
                  )}
                  <p className="text-sm font-medium text-neon-blue mt-0.5">
                    {title || "Senior Instructor & Mentor"}
                  </p>
                </div>

                {profileUrl && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-gray-200 hover:text-white hover:bg-white/10 text-xs h-8 self-center sm:self-auto shrink-0">
                    <Link href={profileUrl}>
                      View Profile & Catalog
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-neon-blue" />
                    </Link>
                  </Button>
                )}
              </div>

              {/* 4 Responsive Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-3 w-full">
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center backdrop-blur-sm transition-colors hover:bg-white/[0.08]">
                  <div className="flex items-center text-amber-400 mb-0.5">
                    <Star className="w-4 h-4 fill-amber-400 mr-1 shrink-0" />
                    <span className="text-base sm:text-lg font-bold text-white">
                      {rating && rating > 0 ? rating.toFixed(1) : "5.0"}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">Rating</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center backdrop-blur-sm transition-colors hover:bg-white/[0.08]">
                  <div className="flex items-center text-neon-blue mb-0.5">
                    <Users className="w-4 h-4 mr-1 shrink-0" />
                    <span className="text-base sm:text-lg font-bold text-white">
                      {students?.toLocaleString() ?? 0}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">Students</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center backdrop-blur-sm transition-colors hover:bg-white/[0.08]">
                  <div className="flex items-center text-neon-purple mb-0.5">
                    <BookOpen className="w-4 h-4 mr-1 shrink-0" />
                    <span className="text-base sm:text-lg font-bold text-white">
                      {courses ?? 1}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">Courses</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center backdrop-blur-sm transition-colors hover:bg-white/[0.08]">
                  <div className="flex items-center text-emerald-400 mb-0.5">
                    <Clock className="w-4 h-4 mr-1 shrink-0" />
                    <span className="text-base sm:text-lg font-bold text-white">
                      {experience ? `${experience} Yrs` : "Pro"}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">Experience</span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructor Bio */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-400">
              Instructor Biography
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed text-left whitespace-pre-wrap">
              {displayedBio}
            </p>
            {isBioLong && (
              <button
                type="button"
                onClick={() => setIsBioExpanded(!isBioExpanded)}
                className="text-xs font-semibold text-neon-blue hover:underline inline-flex items-center gap-1 mt-1">
                {isBioExpanded ? (
                  <>
                    Show less <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Skills & Expertise */}
          {expertise && expertise.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                Skills & Technologies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {expertise.map((skill, idx) => (
                  <Badge
                    key={idx}
                    className="bg-neon-blue/10 border-neon-blue/30 text-neon-blue text-xs font-medium px-2.5 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* PalmTechnIQ Exclusive: 1-on-1 Mentorship CTA */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-transparent border border-neon-blue/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neon-blue" />
                <h4 className="text-sm font-bold text-white">
                  Want 1-on-1 Mentorship with {user.name}?
                </h4>
              </div>
              <p className="text-xs text-gray-300">
                Get personalized code reviews, project debugging, or career guidance directly from this instructor.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              {hourlyRate ? (
                <div className="text-right hidden sm:block">
                  <span className="text-[11px] text-gray-400 block">Rate</span>
                  <span className="text-sm font-bold text-white flex items-center gap-0.5">
                    <NairaSign className="w-3 h-3 text-neon-blue" />
                    {hourlyRate.toLocaleString()}
                    <span className="text-[10px] text-gray-400 font-normal">/hr</span>
                  </span>
                </div>
              ) : null}

              {profileUrl ? (
                <Button
                  asChild
                  className="w-full sm:w-auto bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white text-xs h-9 px-4 shadow-lg shadow-neon-blue/20">
                  <Link href={profileUrl}>
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    Book 1-on-1 Session
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  className="w-full sm:w-auto bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white text-xs h-9 px-4">
                  <Link href="/mentorship">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    Explore Mentorship
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* More Courses by this Instructor */}
          {otherCourses.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-neon-purple" />
                  More Courses by {user.name} ({otherCourses.length})
                </h4>
                {profileUrl && (
                  <Link
                    href={profileUrl}
                    className="text-xs text-neon-blue hover:underline font-medium inline-flex items-center gap-1">
                    See all <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {otherCourses.slice(0, 3).map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug || course.id}`}
                    className="group block p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/10 hover:border-neon-blue/30 transition-all">
                    {course.thumbnail && (
                      <div className="h-28 w-full rounded-lg overflow-hidden bg-white/5 mb-2.5">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <h5 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-neon-blue transition-colors">
                      {course.title}
                    </h5>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs">
                      {course.level && (
                        <span className="text-[10px] text-gray-400 uppercase font-medium">
                          {course.level}
                        </span>
                      )}
                      <span className="font-bold text-white flex items-center gap-0.5">
                        <NairaSign className="w-3 h-3 text-neon-blue" />
                        {course.currentPrice ?? course.salePrice ?? course.price
                          ? (
                              course.currentPrice ??
                              course.salePrice ??
                              course.price
                            )?.toLocaleString()
                          : "Free"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
