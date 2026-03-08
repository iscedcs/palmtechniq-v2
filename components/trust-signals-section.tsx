"use client";

import { motion } from "framer-motion";
import { Award, Users, Briefcase, TrendingUp } from "lucide-react";

const trustSignals = [
  {
    icon: Users,
    stat: "50+",
    label: "Students Trained",
    description: "Across all disciplines",
  },
  {
    icon: Award,
    stat: "80%",
    label: "Job Placement Rate",
    description: "Within 3 months of graduation",
  },
  {
    icon: Briefcase,
    stat: "50+",
    label: "Top Companies",
    description: "Google, Meta, The Trade Desk, Criteo & more",
  },
  {
    icon: TrendingUp,
    stat: "40%",
    label: "Avg Salary Increase",
    description: "For career switchers & graduates",
  },
];

export function TrustSignalsSection() {
  return (
    <section className="py-16 px-6 bg-gradient-to-r from-black/50 via-neon-blue/5 to-black/50 border-t border-b border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Proven Results</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our metrics speak for themselves. Join a community of successful
            professionals.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustSignals.map((signal, index) => {
            const Icon = signal.icon;
            return (
              <motion.div
                key={signal.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group">
                <div className="glass-card p-8 text-center border border-white/10 hover:border-neon-blue/30 transition-all h-full hover:shadow-lg hover:shadow-neon-blue/20">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="inline-flex p-3 rounded-lg bg-neon-blue/10 group-hover:bg-neon-blue/20 transition-colors mb-4">
                    <Icon className="w-8 h-8 text-neon-blue" />
                  </motion.div>

                  <div className="text-5xl md:text-6xl font-bold text-gradient mb-3">
                    {signal.stat}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-blue transition-colors">
                    {signal.label}
                  </h3>

                  <p className="text-sm text-gray-400">{signal.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
