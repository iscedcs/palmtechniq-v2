"use client";

import { motion } from "framer-motion";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, MapPin, Zap, ArrowRight } from "lucide-react";

export default function CareersPage() {
  const jobs = [
    {
      title: "Senior Product Manager",
      department: "Product",
      location: "Hybrid (Lagos, NG)",
      type: "Part-time",
      description: "Lead product strategy for our AI learning platform",
    },
    {
      title: "Machine Learning Engineer",
      department: "Engineering",
      location: "Hybrid (Lagos, NG)",
      type: "Part-time",
      description: "Build AI models that personalize learning experiences",
    },
    {
      title: "Content Strategist",
      department: "Content",
      location: "Hybrid (Lagos, NG)",
      type: "Full-time",
      description: "Create and curate world-class learning content",
    },
    {
      title: "Community Manager",
      department: "Marketing",
      location: "Hybrid (Lagos, NG)",
      type: "Full-time",
      description: "Build and engage our global learning community",
    },
  ];

  const benefits = [
    "Competitive salary",
    // "Health insurance & wellness",
    // "Unlimited PTO",
    "Professional development",
    "Remote-friendly culture",
    "Learning stipend",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-10" />
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Join Our</span>
              <br />
              <span className="text-gradient">Amazing Team</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Help us improve education and change lives around the world. We're
              looking for talented individuals who are passionate about learning
              and making a difference.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="relative py-24 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Why Join</span>{" "}
              <span className="text-gradient">PalmTechnIQ</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center flex-shrink-0 mt-1">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {benefit}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="relative py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Open</span>{" "}
              <span className="text-gradient">Positions</span>
            </h2>
            <p className="text-xl text-gray-300">
              {jobs.length} roles available
            </p>
          </motion.div>

          <div className="space-y-6">
            {jobs.map((job, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}>
                <Card className="glass-card p-8 border-white/10 hover:border-neon-blue/30 transition-all duration-300 hover-glow">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div>
                      <h3 className="text-2xl font-semibold text-white mb-2">
                        {job.title}
                      </h3>
                      <p className="text-gray-400">{job.department}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Briefcase className="w-4 h-4" />
                        <span>{job.type}</span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white">
                        Apply Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-300 mt-4">{job.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
