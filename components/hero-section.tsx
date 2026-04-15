"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Target, Zap } from "lucide-react";
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
              className="mb-8">
              <Badge className="bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 text-white px-6 py-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2" />
                The Future of Learning is Here
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              <span className="text-gradient">Learn.</span>{" "}
              <span className="text-white">Create.</span>{" "}
              <span className="text-gradient">Dominate.</span>
            </motion.h1>

            {/* <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
              The most comprehensive platform for aspiring and seasoned
              professionals
            </motion.p> */}

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
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Button
                size="lg"
                variant="outline"
                onClick={scrollToDemo}
                className="border-2 border-neon-blue/50 hover:border-neon-blue text-white hover:bg-neon-blue/10 px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 group">
                <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: Zap,
                  title: "AI Interview Coach",
                  description:
                    "Practice with adaptive AI simulating real interview scenarios",
                },
                {
                  icon: Target,
                  title: "Industry Mentorship",
                  description:
                    "Learn from leaders & get personalized career guidance",
                },
                {
                  icon: Target,
                  title: "Hybrid Learning",
                  description:
                    "Choose between virtual classrooms or physical locations",
                },
                {
                  icon: Sparkles,
                  title: "Real Projects",
                  description:
                    "Build portfolio with hands-on industry projects",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 + index * 0.2 }}
                  className="glass-card p-6 hover:shadow-lg hover:shadow-neon-blue/20 group cursor-pointer border border-white/10 hover:border-neon-blue/30 transition-all">
                  <feature.icon className="w-12 h-12 text-neon-blue mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                  <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-neon-blue transition-colors">
                    {feature.title}
                  </h2>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
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
