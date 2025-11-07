"use client";

import { motion } from "framer-motion";
import { Users, Star, DollarSign, TrendingUp } from "lucide-react";
import CountUp from "react-countup";
import { Card, CardContent } from "@/components/ui/card";
import { NairaSign } from "@/components/icon";
import { NairaIcon } from "@/components/shared/nairaicon";

export default function TutorCoursesStats({
  courses,
}: {
  courses: {
    studentsCount: number;
    avgRating: number;
    earnings: number;
    growth: number;
  }[];
}) {
  if (!courses || courses.length === 0) return null;

  // --- Aggregate metrics across all courses ---
  const totalStudents = courses.reduce(
    (sum, c) => sum + (c.studentsCount || 0),
    0
  );
  const totalEarnings = courses.reduce((sum, c) => sum + (c.earnings || 0), 0);
  const avgRating =
    courses.length > 0
      ? (
          courses.reduce((sum, c) => sum + (c.avgRating || 0), 0) /
          courses.length
        ).toFixed(1)
      : 0;
  const avgGrowth =
    courses.length > 0
      ? Math.round(
          courses.reduce((sum, c) => sum + (c.growth || 0), 0) / courses.length
        )
      : 0;

  const stats = [
    {
      title: "Total Students",
      icon: Users,
      color: "text-blue-400",
      value: totalStudents,
      suffix: "",
    },
    {
      title: "Average Rating",
      icon: Star,
      color: "text-yellow-400",
      value: avgRating,
      suffix: "/5",
    },
    {
      title: "Total Earnings",
      icon: NairaIcon,
      color: "text-green-400",
      value: totalEarnings,
      prefix: "₦",
    },
    {
      title: "Growth",
      icon: TrendingUp,
      color: avgGrowth >= 0 ? "text-purple-400" : "text-red-400",
      value: Math.abs(avgGrowth),
      suffix: "%",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-10">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}>
            <Card className="glass-card border-white/10 hover-glow">
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <Icon className={`w-6 h-6 ${stat.color}`} />
                <div className="text-2xl font-bold text-white">
                  {stat.prefix && stat.prefix}
                  <CountUp
                    start={0}
                    end={Number(stat.value)}
                    duration={1.8}
                    separator=","
                    decimals={stat.title === "Average Rating" ? 1 : 0}
                  />
                  {stat.suffix && (
                    <span className="text-gray-400 text-sm">{stat.suffix}</span>
                  )}
                </div>
                <p className="text-sm text-gray-400">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
