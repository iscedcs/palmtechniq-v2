"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesColumn,
  CheckCircle,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Reach motivated learners",
    description:
      "Teach students and early-career professionals actively building in-demand skills.",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Track your impact",
    description:
      "Use learner engagement and completion metrics to improve content quality over time.",
  },
  {
    icon: Clock3,
    title: "Teach on your schedule",
    description:
      "Choose your availability and build content at your own pace without fixed teaching hours.",
  },
  {
    icon: ShieldCheck,
    title: "Grow with platform support",
    description:
      "Get guidance on onboarding, profile setup, and course launch best practices.",
  },
];

const steps = [
  "Submit your tutor application with your teaching background and expertise.",
  "Our team reviews your profile and reaches out with next steps.",
  "Set up your tutor profile and prepare your first learning experience.",
  "Publish and start mentoring learners with analytics and support.",
];

const requirements = [
  "Strong practical knowledge in at least one teachable domain",
  "Ability to explain concepts clearly to beginners and intermediates",
  "Portfolio, project history, or proof of relevant professional experience",
  "Commitment to inclusive, learner-first teaching standards",
];

export default function BecomeATutorPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 cyber-grid opacity-10" />
        <motion.div
          className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-neon-blue/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
        />

        <div className="container relative z-10 mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge className="mb-6 border-neon-blue/30 bg-neon-blue/20 text-neon-blue">
              PalmTechnIQ Tutor Program
            </Badge>
            <h1 className="mb-6 text-5xl font-bold md:text-6xl">
              <span className="text-white">Become a</span>{" "}
              <span className="text-gradient">Tutor</span>
            </h1>
            <p className="mb-10 text-xl text-gray-300">
              Turn your expertise into meaningful outcomes for learners. Build
              courses, coach students, and grow your personal brand while
              earning from your knowledge.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:from-neon-blue/80 hover:to-neon-purple/80"
              >
                <Link href="/apply">
                  Start Your Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/contact">Talk to Our Team</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">
              <span className="text-white">Why teach on</span>{" "}
              <span className="text-gradient">PalmTechnIQ</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-300">
              Everything you need to launch, teach, and continuously improve
              your learning programs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {benefits.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card h-full border-white/10 p-2">
                  <CardContent className="p-6">
                    <item.icon className="mb-4 h-10 w-10 text-neon-blue" />
                    <h3 className="mb-2 text-2xl font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="text-gray-300">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-gradient-to-b from-transparent to-white/5 py-20">
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
                    <BookOpen className="h-6 w-6 text-neon-purple" />
                    <h3 className="text-2xl font-semibold text-white">
                      Application roadmap
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {steps.map((step, index) => (
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
                    <GraduationCap className="h-6 w-6 text-neon-green" />
                    <h3 className="text-2xl font-semibold text-white">
                      What we look for
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {requirements.map((requirement) => (
                      <div
                        key={requirement}
                        className="flex items-start gap-3 text-gray-300"
                      >
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-neon-green" />
                        <p>{requirement}</p>
                      </div>
                    ))}
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
              Ready to teach learners globally?
            </h2>
            <p className="mb-8 text-lg text-gray-300">
              Join our tutor network and start creating measurable learning
              impact today.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-neon-green to-emerald-400 text-white"
            >
              <Link href="/apply">
                Apply to Become a Tutor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
