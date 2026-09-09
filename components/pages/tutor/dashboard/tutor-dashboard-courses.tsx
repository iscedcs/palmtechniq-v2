"use client";

import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Star, Plus } from "lucide-react";
import Link from "next/link";
import { NairaSign } from "@/components/shared/naira-sign-icon";

interface Course {
  id: string | number;
  title: string;
  students: number;
  rating: number;
  earnings: number;
  status: string;
  thumbnail?: string | null;
  lastUpdated: string;
}

const getStatusBadgeStyle = (status: string) => {
  const s = status.toLowerCase();
  if (s === "active" || s === "published") {
    return "bg-green-500/20 text-green-400 border-green-500/30";
  }
  if (s === "draft") {
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  }
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
};

export function TutorDashboardCourses({ courses }: { courses: Course[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}>
      <Card className="glass-card border-white/10">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl sm:text-2xl font-bold text-white">My Courses</h3>
            <Link href="/tutor/courses/create">
              <Button size="sm" className="bg-gradient-to-r from-neon-blue to-neon-purple text-white text-xs sm:text-sm px-3 sm:px-4 sm:h-10">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Add Course
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
          {courses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No courses created yet.</p>
              <Link href="/tutor/courses/create" className="inline-block mt-3">
                <Button size="sm" variant="outline" className="text-xs border-white/10 text-white hover:bg-white/5">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Create your first course
                </Button>
              </Link>
            </div>
          ) : (
            courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}>
                <Link
                  href={`/tutor/courses/${course.id}/edit`}
                  className="block p-3 sm:p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <CourseThumbnail
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-16 h-14 sm:w-20 sm:h-14 shrink-0 object-cover rounded-lg"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Mobile header: Title + Status Badge */}
                      <div className="flex items-start justify-between gap-2 sm:hidden mb-1">
                        <h4 className="text-white font-semibold text-sm group-hover:text-gradient transition-colors line-clamp-2 leading-tight">
                          {course.title}
                        </h4>
                        <Badge
                          className={`shrink-0 capitalize text-[10px] px-1.5 py-0.5 leading-none ${getStatusBadgeStyle(
                            course.status,
                          )}`}>
                          {course.status}
                        </Badge>
                      </div>

                      {/* Desktop Title */}
                      <h4 className="hidden sm:block text-white font-semibold group-hover:text-gradient transition-colors truncate">
                        {course.title}
                      </h4>

                      {/* Stats row */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-400 mt-1">
                        <div className="flex items-center">
                          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-gray-400 shrink-0" />
                          <span>{course.students.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-yellow-400 fill-yellow-400/20 shrink-0" />
                          <span>{course.rating}</span>
                        </div>
                        <div className="flex items-center text-emerald-400 font-medium">
                          <NairaSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 shrink-0" />
                          <span>{course.earnings.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop right column: Badge & Updated date */}
                    <div className="hidden sm:block shrink-0 text-right">
                      <Badge className={`capitalize ${getStatusBadgeStyle(course.status)}`}>
                        {course.status}
                      </Badge>
                      <p className="text-gray-400 text-xs mt-1">
                        Updated {course.lastUpdated}
                      </p>
                    </div>
                  </div>

                  {/* Mobile footer: Updated date */}
                  <div className="sm:hidden flex items-center justify-end mt-2 pt-2 border-t border-white/5 text-[11px] text-gray-400">
                    <span>Updated {course.lastUpdated}</span>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
