"use client";

import { motion } from "framer-motion";

export function ProblemSolutionSection() {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden cyber-grid border-t border-b border-white/5">
      {/* Subtle ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-left">
          {/* Main Headline */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.15] mb-8">
            You&apos;ve started three courses this year.
          </h2>

          {/* First Paragraph */}
          <p className="text-lg sm:text-xl text-gray-300 leading-relaxed font-normal mb-6">
            Watched the intro modules. Maybe even finished one. But when
            it&apos;s time to actually build something on your own &mdash; no
            tutorial open in another tab &mdash; you freeze.
          </p>

          {/* Second Paragraph */}
          <p className="text-lg sm:text-xl text-gray-300 leading-relaxed font-normal mb-10">
            That&apos;s not a discipline problem. That&apos;s a structure
            problem. Most online courses hand you information and disappear. No
            one checks if you actually understood it. No one tells you when
            you&apos;re stuck for the wrong reasons.
          </p>

          {/* Solution Checkpoint Callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 border-l-4 border-l-primary p-6 sm:p-8 shadow-2xl">
            <p className="text-lg sm:text-xl text-white font-medium leading-relaxed">
              PalmTechniq is built around checkpoints, not just content a mentor
              reviews your work, a project makes you prove it, and someone
              actually notices if you go quiet.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
