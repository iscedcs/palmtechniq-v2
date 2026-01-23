"use client";

import { motion } from "framer-motion";
import { Plus, Calendar, Award, BarChart3 } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export function TutorDashboardHeader() {
  const session = useSession();
  const user = session.data?.user;
  return (
    <div className="container mx-auto px-6 relative z-10">
      {/* Welcome text */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          <span className="text-white">Welcome back,</span>{" "}
          <span className="text-gradient"> {user?.name}</span>
        </h1>
        <p className="text-xl text-gray-300">
          {`Your teaching empire is thriving! Here’s what’s happening today.`}
        </p>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex flex-wrap justify-center gap-4 mb-12">
        {[
          {
            icon: Plus,
            label: "Create Course",
            color: "from-neon-blue to-cyan-400",
            url: "/tutor/courses/create",
          },
          {
            icon: Calendar,
            label: "Schedule Mentorship",
            color: "from-neon-purple to-pink-400",
            url: "/tutor/mentorships/schedule",
          },
          {
            icon: Award,
            label: "Create Project",
            color: "from-neon-green to-emerald-400",
            url: "/tutor/projects",
          },
          {
            icon: BarChart3,
            label: "View Analytics",
            color: "from-neon-orange to-yellow-400",
            url: "/tutor/analytics",
          },
        ].map((action, index) => (
          <Link key={action.label} href={action.url}>
            <motion.button
              className={`flex items-center px-6 py-3 rounded-2xl bg-gradient-to-r ${action.color} text-white font-semibold hover-glow group`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}>
              <action.icon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              {action.label}
            </motion.button>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
