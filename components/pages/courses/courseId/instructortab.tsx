"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, Users, BookOpen, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InstructorTab({
  tutor,
}: {
  tutor: {
    user: {
      name: string;
      image?: string | null;
    };
    rating?: number;
    students?: number;
    courses?: number;
    bio?: string;
    title?: string;
  };
}) {
  const { user, rating, students, courses, bio, title } = tutor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>
      <Card className="glass-card border-white/10 overflow-hidden">
        <CardContent className="p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 sm:gap-6">
            {/* Avatar with Ring */}
            <div className="relative shrink-0">
              <Avatar className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-emerald-500/20 shadow-xl shadow-emerald-500/5">
                <AvatarImage src={user.image || "/placeholder.svg"} className="object-cover" />
                <AvatarFallback className="text-3xl font-semibold bg-gradient-to-br from-emerald-600 to-teal-800 text-white">
                  {user.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Instructor Main Info */}
            <div className="flex-1 min-w-0 w-full">
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {user.name}
              </h3>

              {title && (
                <div className="mt-1.5 mb-4 flex justify-center sm:justify-start">
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 text-xs sm:text-sm font-medium rounded-full">
                    <Award className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    {title}
                  </Badge>
                </div>
              )}

              {/* Responsive Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 my-5 w-full">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center backdrop-blur-sm transition-colors hover:bg-white/[0.08]">
                  <div className="flex items-center text-amber-400 mb-1">
                    <Star className="w-4 h-4 fill-amber-400 mr-1 shrink-0" />
                    <span className="text-base sm:text-xl font-bold text-white">
                      {rating && rating > 0 ? rating.toFixed(1) : "N/A"}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs text-gray-400 font-medium">Rating</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center backdrop-blur-sm transition-colors hover:bg-white/[0.08]">
                  <div className="flex items-center text-cyan-400 mb-1">
                    <Users className="w-4 h-4 mr-1 shrink-0" />
                    <span className="text-base sm:text-xl font-bold text-white">
                      {students?.toLocaleString() ?? 0}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs text-gray-400 font-medium">Students</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center backdrop-blur-sm transition-colors hover:bg-white/[0.08]">
                  <div className="flex items-center text-purple-400 mb-1">
                    <BookOpen className="w-4 h-4 mr-1 shrink-0" />
                    <span className="text-base sm:text-xl font-bold text-white">
                      {courses ?? 0}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs text-gray-400 font-medium">Courses</span>
                </div>
              </div>

              {/* Instructor Bio */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed text-left">
                  {bio ||
                    `${user.name} is an experienced instructor dedicated to helping students master new skills.`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
