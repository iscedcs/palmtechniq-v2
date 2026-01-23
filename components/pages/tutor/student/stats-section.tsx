"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import {
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Gauge,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";

interface StudentStats {
  totalStudents: number;
  activeNow: number;
  completedCourses: number;
  averageProgress: number;
}

interface Trends {
  totalStudents: number;
  activeNow: number;
  completedCourses: number;
  averageProgress: number;
}

interface StatsSectionProps {
  stats: StudentStats;
  trends: Trends;
}

export function StatsSection({ stats, trends }: StatsSectionProps) {
  const StatCard = ({
    icon: Icon,
    title,
    value,
    change,
    color,
  }: {
    icon: any;
    title: string;
    value: number | string;
    change: number;
    color: string;
  }) => {
    // Animated counter
    const count = useSpring(0, { stiffness: 60, damping: 15 });
    const display = useTransform(count, (latest) =>
      Math.floor(latest).toLocaleString()
    );

    useEffect(() => {
      count.set(typeof value === "number" ? value : parseFloat(value));
    }, [value]);

    const isUp = change > 0;
    const isDown = change < 0;
    const changeColor = isUp
      ? "text-green-400"
      : isDown
      ? "text-red-400"
      : "text-gray-400";

    const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Gauge;

    return (
      <motion.div whileHover={{ scale: 1.05 }} className="group">
        <Card className="glass-card hover-glow border-white/10 overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <motion.p className="text-3xl font-bold text-white mt-2">
                  {typeof value === "number" ? (
                    <motion.span>{display}</motion.span>
                  ) : (
                    value
                  )}
                </motion.p>

                <div
                  className={`flex items-center mt-2 text-sm ${changeColor}`}>
                  <TrendIcon className="w-4 h-4 mr-1" />
                  {isUp && "+"}
                  {change}%
                  <span className="ml-1 text-gray-400">from last month</span>
                </div>
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
  };

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
        change={trends.totalStudents}
        color="from-neon-blue to-cyan-400"
      />
      <StatCard
        icon={TrendingUp}
        title="Active Now"
        value={stats.activeNow}
        change={trends.activeNow}
        color="from-neon-green to-emerald-400"
      />
      <StatCard
        icon={CheckCircle}
        title="Completed"
        value={stats.completedCourses}
        change={trends.completedCourses}
        color="from-neon-purple to-pink-400"
      />
      <StatCard
        icon={Gauge}
        title="Avg Progress"
        value={`${stats.averageProgress}%`}
        change={trends.averageProgress}
        color="from-neon-orange to-yellow-400"
      />
    </motion.div>
  );
}
