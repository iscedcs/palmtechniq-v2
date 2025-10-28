"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  CalendarIcon,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";

interface MentorshipStatsProps {
  stats: {
    totalSessions: number;
    completedSessions: number;
    totalHours: number;
    averageRating: number;
  };
}

export function MentorshipStats({ stats }: MentorshipStatsProps) {
  const statCards = [
    {
      icon: CalendarIcon,
      value: stats.totalSessions,
      label: "Total Sessions",
      gradient: "from-neon-blue to-cyan-400",
    },
    {
      icon: CheckCircle,
      value: stats.completedSessions,
      label: "Completed",
      gradient: "from-neon-green to-emerald-400",
    },
    {
      icon: Clock,
      value: stats.totalHours,
      label: "Hours Mentored",
      gradient: "from-neon-orange to-yellow-400",
    },
    {
      icon: Star,
      value: stats.averageRating.toFixed(1),
      label: "Avg Rating",
      gradient: "from-neon-purple to-pink-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="glass-card border-white/10 hover-glow">
            <CardContent className="p-6 text-center">
              <div
                className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-full flex items-center justify-center mx-auto mb-3`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}