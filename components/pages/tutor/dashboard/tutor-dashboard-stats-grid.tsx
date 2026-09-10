"use client";

import { NairaSign } from "@/components/shared/naira-sign-icon";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, Star, TrendingDown, TrendingUp, Users } from "lucide-react";

interface Stats {
  totalStudents: number;
  totalEarnings: number;
  averageRating: number;
  coursesSold: number;
  change?: {
    totalStudents?: number;
    totalEarnings?: number;
    averageRating?: number;
    coursesSold?: number;
  };
}

export function TutorDashboardStatsGrid({ stats }: { stats: Stats }) {
  const StatCard = ({
    icon: Icon,
    title,
    value,
    change,
    color,
  }: {
    icon: any;
    title: string;
    value: string | number;
    change?: number;
    color: string;
  }) => (
    <motion.div whileHover={{ scale: 1.02 }} className="group">
      <Card className="glass-card hover-glow border-white/10 overflow-hidden relative">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-gray-400 text-xs sm:text-sm font-medium truncate">{title}</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2 truncate">{value}</p>
              {typeof change === "number" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center flex-wrap mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium ${
                    change > 0
                      ? "text-green-400"
                      : change < 0
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}>
                  {change > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 animate-pulse shrink-0" />
                  ) : change < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 animate-pulse shrink-0" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 opacity-60 shrink-0" />
                  )}
                  <span>{change > 0 ? "+" : ""}{change}%</span>
                  <span className="ml-1 text-gray-400">from last month</span>
                </motion.div>
              )}
            </div>
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r ${color} p-3 sm:p-4 group-hover:scale-110 transition-transform duration-300 shrink-0`}>
              <Icon className="w-full h-full text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
      <StatCard
        icon={Users}
        title="Total Students"
        value={stats.totalStudents.toLocaleString()}
        change={stats.change?.totalStudents}
        color="from-neon-blue to-cyan-400"
      />
      <StatCard
        icon={NairaSign}
        title="Total Earnings"
        value={`₦${stats.totalEarnings.toLocaleString()}`}
        change={stats.change?.totalEarnings}
        color="from-neon-green to-emerald-400"
      />
      <StatCard
        icon={Star}
        title="Average Rating"
        value={stats.averageRating.toFixed(1)}
        change={stats.change?.averageRating}
        color="from-neon-orange to-yellow-400"
      />
      <StatCard
        icon={BookOpen}
        title="Courses Sold"
        value={stats.coursesSold.toLocaleString()}
        change={stats.change?.coursesSold}
        color="from-neon-purple to-pink-400"
      />
    </div>
  );
}
