"use client";

import { Users, Star, TrendingUp } from "lucide-react";

export function TutorCourseStatsRow({
  students,
  rating,
  earnings,
  growth,
}: {
  students: number;
  rating: number | null;
  earnings: number;
  growth: number;
}) {
  return (
    <div className="flex items-center justify-between text-sm mt-4">
      <div className="flex items-center gap-1 text-blue-400">
        <Users className="w-4 h-4" /> {students.toLocaleString()}
      </div>
      <div className="flex items-center gap-1 text-yellow-400">
        <Star className="w-4 h-4" /> {rating?.toFixed(1) ?? "N/A"}
      </div>
      <div className="flex items-center gap-1 text-green-400">
        ₦{earnings.toLocaleString()}
      </div>
      <div className="flex items-center gap-1 text-purple-400">
        <TrendingUp className="w-4 h-4" /> {growth}%
      </div>
    </div>
  );
}
