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
import Link from "next/link";

const categories = [
  {
    icon: Code,
    title: "Programming",
    courses: 450,
    slug: "programming",
  },
  {
    icon: Palette,
    title: "Design",
    courses: 320,
    slug: "design",
  },
  {
    icon: TrendingUp,
    title: "Business",
    courses: 280,
    slug: "business",
  },
  {
    icon: Camera,
    title: "Photography",
    courses: 180,
    slug: "photography",
  },
  {
    icon: Music,
    title: "Music",
    courses: 150,
    slug: "music",
  },
  {
    icon: Briefcase,
    title: "Marketing",
    courses: 220,
    slug: "marketing",
  },
  {
    icon: Cpu,
    title: "AI & ML",
    courses: 95,
    slug: "ai-ml",
  },
  {
    icon: PenTool,
    title: "Writing",
    courses: 130,
    slug: "writing",
  },
];

export function CourseCategoriesSection() {
  return (
    <section className="py-28 md:py-36 relative overflow-hidden cyber-grid border-t border-b border-white/5">
      {/* Subtle ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight leading-tight">
            Explore Categories
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Discover courses across diverse fields, from cutting-edge technology
            to creative arts
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              viewport={{ once: true }}
              className="group cursor-pointer h-full">
              <Link href={`/courses?category=${category.slug}`}>
                <Card className="glass-card hover-glow h-full border border-white/10 hover:border-primary/40 overflow-hidden relative transition-all duration-300">
                  <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full">
                    <div>
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-primary mb-6 group-hover:scale-105 group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-300">
                        <category.icon className="w-7 h-7" />
                      </div>

                      {/* Content */}
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors leading-snug">
                        {category.title}
                      </h3>
                    </div>
                  </CardContent>

                  {/* Plain Subtle Hover Tint */}
                  <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
