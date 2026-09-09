"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Pick your track",
    description:
      "Cybersecurity, Frontend, Backend, Design, Data, Marketing, and more whichever fits where you're headed.",
  },
  {
    number: "02",
    title: "Learn by building",
    description:
      "Structured lessons, an AI coach to practice with, mentors on call when you're stuck.",
  },
  {
    number: "03",
    title: "Build something real",
    description:
      "Every track ends in a portfolio project not a certificate you can't back up.",
  },
  {
    number: "04",
    title: "Graduate and get placed",
    description:
      "Interview prep, a LinkedIn overhaul, and support landing your first or next role.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 md:py-32 px-6 cyber-grid relative overflow-hidden border-t border-b border-white/5">
      {/* Subtle ambient lighting */}

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Section: Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20 md:mb-28">
          {/* Left Column: Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-5 text-left">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-lg md:text-xl text-gray-400 font-normal">
              Four steps. No detours.
            </p>
          </motion.div>

          {/* Right Column: 4-step vertical timeline */}
          <div className="lg:col-span-7 relative text-left">
            {/* Connecting Vertical Line */}

            <div className="space-y-10 relative">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative flex items-start gap-5">
                  {/* Step Badge */}
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-mono text-xs font-semibold shrink-0 relative z-10 bg-background">
                    {step.number}
                  </div>

                  {/* Step Content */}
                  <div className="pt-0.5">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-xl">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="glass-card p-8 sm:p-12 md:p-14 border border-white/10 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 text-left">
          <div className="max-w-2xl">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
              Ready to break the tutorial loop?
            </h3>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Admissions are open for our upcoming hybrid engineering track.
              Cohort sizes are capped to maintain strict 1:1 mentor quality.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 w-full sm:w-auto">
            <Link href="/courses">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-black font-semibold px-7 py-3.5 h-auto text-base rounded-xl transition-all hover-glow">
                Explore Career Tracks
              </Button>
            </Link>
            <Link href="/enroll">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border-white/15 px-7 py-3.5 h-auto text-base rounded-xl font-medium transition-all">
                Join Lagos Campus Tour
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
