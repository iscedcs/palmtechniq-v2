"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StudentStats {
  totalStudents: number;
  activeNow: number;
  completedCourses: number;
  averageProgress: number;
}

interface StatsSectionProps {
  stats: StudentStats;
}

export function StatsSection({ stats }: StatsSectionProps) {
  const StatCard = ({ icon: Icon, title, value, color }: any) => (
    <motion.div whileHover={{ scale: 1.05 }} className="group">
      <Card className="glass-card hover-glow border-white/10 overflow-hidden relative">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">{title}</p>
              <p className="text-3xl font-bold text-white mt-2">{value}</p>
            </div>
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${color} p-4 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-full h-full text-white" />
            </div>
          </div>
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}
          />
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        icon={Users}
        title="Total Students"
        value={stats.totalStudents}
        color="from-neon-blue to-cyan-400"
      />
      <StatCard
        icon={TrendingUp}
        title="Active Now"
        value={stats.activeNow}
        color="from-neon-green to-emerald-400"
      />
      <StatCard
        icon={CheckCircle}
        title="Completed"
        value={stats.completedCourses}
        color="from-neon-purple to-pink-400"
      />
      <StatCard
        icon={TrendingUp}
        title="Avg Progress"
        value={`${stats.averageProgress}%`}
        color="from-neon-orange to-yellow-400"
      />
    </motion.div>
  );
}
