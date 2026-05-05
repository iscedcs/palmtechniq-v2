"use client";

import { motion } from "framer-motion";
import {
  Code,
  Palette,
  TrendingUp,
  Camera,
  Music,
  Briefcase,
  Cpu,
  PenTool,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const categories = [
  {
    icon: Code,
    title: "Programming",
    courses: 450,
    color: "from-blue-500 to-cyan-400",
    bgImage:
      "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)",
  },
  {
    icon: Palette,
    title: "Design",
    courses: 320,
    color: "from-purple-500 to-pink-400",
    bgImage:
      "linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(244, 114, 182, 0.1) 100%)",
  },
  {
    icon: TrendingUp,
    title: "Business",
    courses: 280,
    color: "from-green-500 to-emerald-400",
    bgImage:
      "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)",
  },
  {
    icon: Camera,
    title: "Photography",
    courses: 180,
    color: "from-orange-500 to-yellow-400",
    bgImage:
      "linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)",
  },
  {
    icon: Music,
    title: "Music",
    courses: 150,
    color: "from-red-500 to-pink-400",
    bgImage:
      "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(244, 114, 182, 0.1) 100%)",
  },
  {
    icon: Briefcase,
    title: "Marketing",
    courses: 220,
    color: "from-indigo-500 to-purple-400",
    bgImage:
      "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
  },
  {
    icon: Cpu,
    title: "AI & ML",
    courses: 95,
    color: "from-cyan-500 to-blue-400",
    bgImage:
      "linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
  },
  {
    icon: PenTool,
    title: "Writing",
    courses: 130,
    color: "from-teal-500 to-green-400",
    bgImage:
      "linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(34, 197, 94, 0.1) 100%)",
  },
];

export function CourseCategoriesSection() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-neon-pink/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-white">Explore</span>{" "}
            <span className="text-gradient">Categories</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover courses across diverse fields, from cutting-edge technology
            to creative arts
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, rotateY: 10 }}
              className="group cursor-pointer">
              <Card className="glass-card hover-glow h-full border-white/10 overflow-hidden relative">
                <div
                  className="absolute inset-0 opacity-50"
                  style={{ background: category.bgImage }}
                />
                <CardContent className="p-8 relative z-10">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${category.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <category.icon className="w-full h-full text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-gradient transition-all duration-300">
                    {category.title}
                  </h3>

                  {/* <Badge className="bg-white/10 text-white border-white/20">
                    {category.courses} courses
                  </Badge> */}

                  {/* Hover Gradient */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
