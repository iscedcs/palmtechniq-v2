"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Users,
  MapPin,
  Video,
  Trophy,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Brain,
    title: "AI Interview Coach",
    description:
      "Practice with our advanced AI interviewer that adapts to your industry and skill level",
    color: "from-neon-blue to-cyan-400",
    badge: "AI Powered",
  },
  {
    icon: Users,
    title: "LinkedIn Profile Builder",
    description:
      "AI-generated professional profiles that get you noticed by top recruiters",
    color: "from-neon-purple to-pink-400",
    badge: "Career Boost",
  },
  {
    icon: MapPin,
    title: "Hybrid Learning",
    description: "Choose virtual classrooms or physical locations in your city",
    color: "from-neon-green to-emerald-400",
    badge: "Flexible",
  },
  {
    icon: Video,
    title: "Live Mentorship",
    description:
      "1-on-1 sessions with industry experts and personalized guidance",
    color: "from-neon-orange to-yellow-400",
    badge: "Expert Led",
  },
  {
    icon: Trophy,
    title: "Project-Based Learning",
    description:
      "Build real-world projects that showcase your skills to employers",
    color: "from-red-400 to-pink-400",
    badge: "Hands-On",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description:
      "Advanced tracking with personalized insights and recommendations",
    color: "from-indigo-400 to-purple-400",
    badge: "Data Driven",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20">
          <Badge className="bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 text-brand-white px-6 py-2 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Comprehensive Features
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-gradient">Beyond Traditional</span>
            <br />
            <span className="text-white">Learning</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience cutting-edge technology that transforms how you learn,
            practice, and succeed in your career
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="group">
              <Card className="glass-card hover-glow h-full border-white/10 overflow-hidden relative">
                <CardContent className="p-8">
                  {/* Badge */}
                  <Badge className="absolute top-4 right-4 bg-white/10 text-white border-white/20 text-xs">
                    {feature.badge}
                  </Badge>

                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-full h-full text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-gradient transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover Effect */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}
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
