"use client";

import type React from "react";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Users, BookOpen, Trophy, Star } from "lucide-react";

interface StatItemProps {
  icon: React.ElementType;
  value: number;
  label: string;
  suffix?: string;
  color: string;
}

function StatItem({
  icon: Icon,
  value,
  label,
  suffix = "",
  color,
}: StatItemProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const timer = setInterval(() => {
        setCount((prev) => {
          const increment = Math.ceil(value / 100);
          if (prev + increment >= value) {
            clearInterval(timer);
            return value;
          }
          return prev + increment;
        });
      }, 30);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="text-center group">
      <div
        className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r ₦{color} p-5 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-full h-full text-white" />
      </div>
      <motion.div
        className="text-4xl md:text-5xl font-bold text-gradient mb-2"
        animate={{ scale: isInView ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}>
        {count.toLocaleString()}
        {suffix}
      </motion.div>
      <p className="text-gray-300 text-lg">{label}</p>
    </motion.div>
  );
}

export function StatsSection() {
  const stats = [
    {
      icon: Users,
      value: 200,
      label: "Active Learners",
      suffix: "+",
      color: "from-neon-blue to-cyan-400",
    },
    {
      icon: BookOpen,
      value: 50,
      label: "Expert Courses",
      suffix: "+",
      color: "from-neon-purple to-pink-400",
    },
    {
      icon: Trophy,
      value: 95,
      label: "Success Rate",
      suffix: "%",
      color: "from-neon-green to-emerald-400",
    },
    {
      icon: Star,
      value: 4.5,
      label: "Average Rating",
      suffix: "/5",
      color: "from-neon-orange to-yellow-400",
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 via-transparent to-neon-purple/5" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Trusted by <span className="text-gradient">Thousands</span>
          </h2>
          <p className="text-xl text-gray-300">
            Join the fastest-growing learning community in the world
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
