"use client";

import { motion } from "framer-motion";
import {
  Mic,
  UserCircle,
  Globe,
  GraduationCap,
  Layers,
  Activity,
  ChartNoAxesColumn,
  Shuffle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Mic,
    title: "AI Interview Coach",
    description:
      "Practice with our advanced AI interviewer that adapts to your industry and skill level",
    badge: "AI Powered",
  },
  {
    icon: UserCircle,
    title: "LinkedIn Profile Builder",
    description:
      "AI-generated professional profiles that get you noticed by top recruiters",
    badge: "Career Boost",
  },
  {
    icon: Shuffle,
    title: "Hybrid Learning",
    description: "Choose virtual classrooms or physical locations in your city",
    badge: "Flexible",
  },
  {
    icon: Mic,
    title: "Live Mentorship",
    description:
      "1-on-1 sessions with industry experts and personalized guidance",
    badge: "Expert Led",
  },
  {
    icon: Layers,
    title: "Project-Based Learning",
    description:
      "Build real-world projects that showcase your skills to employers",
    badge: "Hands-On",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Progress Analytics",
    description:
      "Advanced tracking with personalized insights and recommendations",
    badge: "Data Driven",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-28 md:py-36 relative overflow-hidden cyber-grid border-t border-b border-white/5">
      {/* Subtle ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
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
            Beyond Traditional
            <br />
            Learning
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Experience cutting-edge technology that transforms how you learn,
            practice, and succeed in your career
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group h-full">
              <Card className="glass-card hover-glow h-full border border-white/10 hover:border-primary/40 overflow-hidden relative transition-all duration-300">
                <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
                  <div>
                    {/* Top Row: Icon and Badge */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-primary group-hover:scale-105 group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-300">
                        <feature.icon className="w-7 h-7" />
                      </div>
                      <Badge className="bg-white/5 text-gray-300 border border-white/10 text-xs font-normal px-3 py-1">
                        {feature.badge}
                      </Badge>
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors leading-snug">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed group-hover:text-gray-300 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>

                {/* Plain Subtle Hover Accent */}
                <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
