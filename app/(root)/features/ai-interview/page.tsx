"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Brain,
  CheckCircle,
  Clock3,
  MessageSquareText,
  Mic2,
  Target,
  TrendingUp,
} from "lucide-react";

const interviewTracks = [
  {
    title: "Behavioral interviews",
    description:
      "Practice storytelling, structure your answers, and improve confidence under pressure.",
    icon: MessageSquareText,
  },
  {
    title: "Technical interviews",
    description:
      "Work through role-specific questions with guided prompts and actionable feedback.",
    icon: Brain,
  },
  {
    title: "Communication drills",
    description:
      "Train on clarity, pacing, and delivery to present strong responses every time.",
    icon: Mic2,
  },
];

const workflow = [
  "Choose your target role and interview style.",
  "Run AI-guided mock sessions with timed responses.",
  "Review feedback on answer quality and delivery.",
  "Track progress and focus your next practice cycle.",
];

const outcomes = [
  "Better answer structure and clarity",
  "Higher confidence in mock and real interviews",
  "Faster preparation with focused improvement loops",
  "Role-aligned readiness before final interviews",
];

export default function AiInterviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 cyber-grid opacity-10" />
        <motion.div
          className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-neon-blue/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
        />

        <div className="container relative z-10 mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge className="mb-6 border-neon-blue/30 bg-neon-blue/20 text-neon-blue">
              AI Interview Coach
            </Badge>
            <h1 className="mb-6 text-5xl font-bold md:text-6xl">
              <span className="text-white">Prepare Smarter with</span>{" "}
              <span className="text-gradient">AI Interview Practice</span>
            </h1>
            <p className="mb-10 text-xl text-gray-300">
              Practice real interview scenarios, get instant feedback, and build
              confidence before your next opportunity.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:from-neon-blue/80 hover:to-neon-purple/80"
              >
                <Link href="/courses">
                  Start Preparing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/mentorship">Talk to a Mentor</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">
              <span className="text-white">Built for real</span>{" "}
              <span className="text-gradient">interview scenarios</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-300">
              Use focused practice tracks designed to improve the areas that
              matter most in interview performance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {interviewTracks.map((track, index) => (
              <motion.div
                key={track.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card h-full border-white/10">
                  <CardContent className="p-6">
                    <track.icon className="mb-4 h-10 w-10 text-neon-blue" />
                    <h3 className="mb-2 text-2xl font-semibold text-white">
                      {track.title}
                    </h3>
                    <p className="text-gray-300">{track.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-transparent to-white/5 py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <Card className="glass-card h-full border-white/10">
                <CardContent className="p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <Target className="h-6 w-6 text-neon-purple" />
                    <h3 className="text-2xl font-semibold text-white">
                      How it works
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {workflow.map((step, index) => (
                      <div key={step} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neon-purple/20 text-sm font-semibold text-neon-purple">
                          {index + 1}
                        </span>
                        <p className="text-gray-300">{step}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <Card className="glass-card h-full border-white/10">
                <CardContent className="p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-neon-green" />
                    <h3 className="text-2xl font-semibold text-white">
                      Expected outcomes
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {outcomes.map((outcome) => (
                      <div key={outcome} className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-neon-green" />
                        <p className="text-gray-300">{outcome}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-5 w-5 text-neon-blue" />
                      <p className="text-sm text-gray-300">
                        Consistent practice with fast feedback creates measurable
                        gains in interview confidence and response quality.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-10 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-white">
              Ready for your next interview round?
            </h2>
            <p className="mb-8 text-lg text-gray-300">
              Start AI interview prep now and combine it with mentorship for
              stronger real-world outcomes.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-neon-green to-emerald-400 text-white"
              >
                <Link href="/courses">
                  Explore Interview Prep Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/apply">Become a Mentor</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
