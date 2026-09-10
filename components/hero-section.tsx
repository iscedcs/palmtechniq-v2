"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Building2,
  UserCheck,
  Briefcase,
  MessageSquare,
  Search,
} from "lucide-react";
import Link from "next/link";
import { LiveChatWidget } from "./conversion-features";

export function HeroSection() {
  const scrollToDemo = () => {
    const demoSection = document.getElementById("demo-section");
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <LiveChatWidget />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden cyber-grid">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-20 w-72 h-72 bg-neon-blue/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            />

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              <span className="text-gradient">Learn.</span>{" "}
              <span className="text-white">Create.</span>{" "}
              <span className="text-gradient">Dominate.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              AI-powered interviews, expert mentorship, real-world projects, and
              hybrid learning environments designed for the industry.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
              <Link href="/courses">
                <Button
                  size="lg"
                  type="button"
                  className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white px-8 py-4 text-lg font-semibold rounded-2xl hover-glow group">
                  Start Learning Now
                </Button>
              </Link>

              <Button
                size="lg"
                variant="outline"
                onClick={scrollToDemo}
                className="border-2 border-neon-blue/50 hover:border-neon-blue text-white hover:bg-neon-blue/10 px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 group">
                Watch Demo
              </Button>
            </motion.div>

            {/* Feature Highlights Bento Grid */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="max-w-7xl mx-auto text-left">
              
              {/* Row 1: The Foundation (3 columns) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {[
                  {
                    icon: Building2,
                    title: "Learn from your room, or from Lagos",
                    description:
                      "Join fully online, or sit in-person at our Lagos location. Same curriculum, same mentors, either way.",
                  },
                  {
                    icon: UserCheck,
                    title: "A real person reviews your code",
                    description:
                      "Weekly 1-on-1 sessions with mentors currently working in the field — not automated grading.",
                  },
                  {
                    icon: Briefcase,
                    title: "Leave with proof, not just a PDF",
                    description:
                      "Every track ends in a real project for your portfolio, built to show an employer — not a multiple-choice quiz.",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                    className="glass-card p-8 border border-white/10 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group flex flex-col justify-start">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-primary mb-6 group-hover:scale-105 group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-300">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-primary transition-colors leading-snug">
                      {feature.title}
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed group-hover:text-gray-300 transition-colors">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Row 2: The Breakthrough (2 columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: MessageSquare,
                    title: "Fail the interview here first, not in front of a recruiter",
                    description:
                      "Practice with an AI coach that adjusts to your track, then get scored feedback right after — not a week later.",
                  },
                  {
                    icon: Search,
                    title: "Recruiters find profiles, not certificates",
                    description:
                      "Our profile builder turns your finished projects into a LinkedIn presence that actually gets noticed.",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                    className="glass-card p-8 border border-white/10 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group flex flex-col justify-start">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-primary mb-6 group-hover:scale-105 group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-300">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 group-hover:text-primary transition-colors leading-snug">
                      {feature.title}
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed group-hover:text-gray-300 transition-colors">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating Elements */}
        <motion.div
          className="absolute top-1/4 left-10 w-4 h-4 bg-neon-pink rounded-full"
          animate={{
            y: [0, -20, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/3 right-16 w-6 h-6 bg-neon-blue rounded-full"
          animate={{
            y: [0, 15, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </section>
    </div>
  );
}
