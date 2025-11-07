"use client";

import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="pt-32 pb-8 relative overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-20" />
      <motion.div
        className="absolute top-20 right-20 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"
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

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-white">My</span>{" "}
              <span className="text-gradient">Students</span>
            </h1>
            <p className="text-xl text-gray-300">
              Manage, track, and support your enrolled students
            </p>
          </div>
          <Button className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
