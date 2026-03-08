"use client";

import { motion } from "framer-motion";
import { BookOpen, Brain, Users, Trophy, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const steps = [
  {
    number: 1,
    icon: BookOpen,
    title: "Choose Your Path",
    description:
      "Select from our curated AdTech career tracks and learning modules designed for your skill level",
    features: [
      "Structured curriculum",
      "Multiple learning speeds",
      "Flexible scheduling",
    ],
  },
  {
    number: 2,
    icon: Brain,
    title: "Learn with AI & Mentorship",
    description:
      "Master concepts through interactive lessons, AI-powered practice sessions, and live expert guidance",
    features: ["AI Interview Coach", "Live sessions", "Personalized feedback"],
  },
  {
    number: 3,
    icon: Zap,
    title: "Build Real Projects",
    description:
      "Apply your knowledge with real-world AdTech projects, building a portfolio that impresses employers",
    features: ["Industry projects", "Portfolio building", "Code reviews"],
  },
  {
    number: 4,
    icon: Users,
    title: "Get Professional Support",
    description:
      "Receive career guidance, interview prep, resume optimization, and networking opportunities",
    features: ["Career coaching", "Interview prep", "Job placement support"],
  },
  {
    number: 5,
    icon: Trophy,
    title: "Launch Your Career",
    description:
      "Graduate with certifications, a strong portfolio, and direct connections to top AdTech companies",
    features: [
      "Professional certification",
      "Job opportunities",
      "Alumni network",
    ],
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/3 -left-96 w-96 h-96 bg-neon-blue rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-96 w-96 h-96 bg-neon-purple rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-gradient">How It Works</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A proven 5-step methodology to take you from beginner to
            industry-ready AdTech professional
          </p>
        </motion.div>

        {/* Steps Container */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-neon-blue/50 via-neon-purple/50 to-transparent transform -translate-x-1/2" />

          {/* Steps Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 1;

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative ${
                    index === steps.length - 1
                      ? "md:col-span-2 lg:col-span-1"
                      : ""
                  }`}>
                  {/* Step Card */}
                  <div className="glass-card p-8 h-full border border-white/10 hover:border-neon-blue/30 transition-all group hover:shadow-lg hover:shadow-neon-blue/20">
                    {/* Step Number Badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center border-2 border-background font-bold text-white text-lg">
                      {step.number}
                    </motion.div>

                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="mb-6 inline-flex p-3 rounded-lg bg-neon-blue/10 group-hover:bg-neon-blue/20 transition-colors">
                      <Icon className="w-8 h-8 text-neon-blue" />
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-neon-blue transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 mb-6 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-2">
                      {step.features.map((feature) => (
                        <li
                          key={feature}
                          className="text-sm text-gray-400 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-neon-blue mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Arrow for desktop */}
                    {index < steps.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="hidden lg:flex absolute -bottom-12 left-1/2 transform -translate-x-1/2 z-20">
                        <ArrowRight className="w-6 h-6 text-neon-blue/50 rotate-90" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-20">
          <p className="text-xl text-gray-300 mb-8">
            Ready to transform your career? Start your journey with PalmTechnIQ
            today
          </p>
          <Link href="/courses">
            <Button
              size="lg"
              className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white px-8 py-4 text-lg font-semibold rounded-2xl hover-glow group">
              Browse Courses
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
