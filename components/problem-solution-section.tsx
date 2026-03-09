"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Award,
  Users,
  Briefcase,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const problems = [
  {
    icon: AlertCircle,
    title: "Career Uncertainty",
    description: "No clear path to break into or advance in roles",
    color: "from-red-500 to-red-400",
  },
  {
    icon: Briefcase,
    title: "Skill Gap",
    description: "Gap between academic knowledge and industry requirements",
    color: "from-orange-500 to-orange-400",
  },
  {
    icon: Users,
    title: "Lack of Mentorship",
    description: "Limited access to industry experts and guidance",
    color: "from-yellow-500 to-yellow-400",
  },
];

const solutions = [
  {
    icon: TrendingUp,
    title: "Structured Career Paths",
    description: "Clear learning roadmaps designed by industry leaders",
    color: "from-green-500 to-green-400",
  },
  {
    icon: Award,
    title: "Industry-Relevant Skills",
    description: "Hands-on projects using real tools and platforms",
    color: "from-blue-500 to-blue-400",
  },
  {
    icon: Users,
    title: "Expert Guidance",
    description: "1-on-1 mentorship from professionals",
    color: "from-purple-500 to-purple-400",
  },
];

export function ProblemSolutionSection() {
  return (
    <section className="py-20 px-6 bg-black/50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-red-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
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
            <span className="text-gradient">The Challenge.</span>{" "}
            <span className="text-white">The Solution.</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Breaking into is challenging. We've designed PalmTechnIQ to address
            every barrier aspiring professionals face.
          </p>
        </motion.div>

        {/* Problems & Solutions Grid */}
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Problems Section */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}>
            <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
              <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mr-4">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              The Problems
            </h3>

            <div className="space-y-6">
              {problems.map((problem, index) => {
                const Icon = problem.icon;
                return (
                  <motion.div
                    key={problem.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="glass-card p-6 border border-white/10 hover:border-red-500/30 transition-all hover:shadow-lg hover:shadow-red-500/10">
                    <div className="flex items-start gap-4">
                      <Icon className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {problem.title}
                        </h4>
                        <p className="text-gray-400">{problem.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Solutions Section */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}>
            <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
              <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mr-4">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              Our Solution
            </h3>

            <div className="space-y-6">
              {solutions.map((solution, index) => {
                const Icon = solution.icon;
                return (
                  <motion.div
                    key={solution.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="glass-card p-6 border border-white/10 hover:border-green-500/30 transition-all hover:shadow-lg hover:shadow-green-500/10">
                    <div className="flex items-start gap-4">
                      <Icon className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {solution.title}
                        </h4>
                        <p className="text-gray-400">{solution.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Transformation Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="glass-card p-12 border border-neon-blue/30 text-center">
          <p className="text-2xl font-semibold text-white mb-4">
            From aspiring to leading. That's the PalmTechnIQ difference.
          </p>
          <p className="text-gray-400 text-lg">
            Our platform doesn't just teach skills; it transforms careers and
            builds the next generation of leaders.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
