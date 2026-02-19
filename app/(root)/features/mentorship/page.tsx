"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Clock3, Shield, Users, Zap } from "lucide-react";

const offerCards = [
  {
    title: "One-off sessions",
    description:
      "Book focused 1-on-1 sessions for interview prep, code reviews, and career guidance.",
    points: ["Fast booking", "Role-specific support", "Instant feedback"],
    icon: Zap,
  },
  {
    title: "Mentorship packages",
    description:
      "Get discounted bundles of sessions for deeper progress over multiple weeks.",
    points: ["Better pricing", "Consistent growth", "Priority scheduling"],
    icon: Users,
  },
];

const trustSignals = [
  "Verified mentors from industry teams",
  "Transparent pricing and checkout flow",
  "Flexible request-first or instant booking",
  "Session tracking for accountability",
];

export default function MentorshipFeaturePage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 cyber-grid opacity-10" />
        <motion.div
          className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-neon-purple/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
        />
        <div className="container relative z-10 mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge className="mb-6 border-neon-purple/30 bg-neon-purple/20 text-neon-purple">
              Live Mentorship
            </Badge>
            <h1 className="mb-6 text-5xl font-bold md:text-6xl">
              <span className="text-white">Turn Guidance into</span>{" "}
              <span className="text-gradient">Real Career Progress</span>
            </h1>
            <p className="mb-10 text-xl text-gray-300">
              Book expert mentors for targeted growth with flexible session
              options and package discounts.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:from-neon-blue/80 hover:to-neon-purple/80"
              >
                <Link href="/mentorship">
                  Start Booking
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

      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
              Choose the mentorship format that fits
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-300">
              Use single sessions for quick wins or multi-session packages for
              sustained results.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {offerCards.map((offer, idx) => (
              <motion.div
                key={offer.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card h-full border-white/10">
                  <CardContent className="p-8">
                    <offer.icon className="mb-4 h-10 w-10 text-neon-blue" />
                    <h3 className="mb-3 text-2xl font-semibold text-white">
                      {offer.title}
                    </h3>
                    <p className="mb-5 text-gray-300">{offer.description}</p>
                    <div className="space-y-2">
                      {offer.points.map((point) => (
                        <div key={point} className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-4 w-4 text-neon-green" />
                          <p className="text-sm text-gray-300">{point}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-transparent to-white/5 py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-10"
          >
            <div className="mb-6 flex items-center gap-3">
              <Shield className="h-6 w-6 text-neon-green" />
              <h3 className="text-2xl font-semibold text-white">
                Why teams choose our mentorship model
              </h3>
            </div>
            <div className="space-y-3">
              {trustSignals.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 text-neon-blue" />
                  <p className="text-gray-300">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
