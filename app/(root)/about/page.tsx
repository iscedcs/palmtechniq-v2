"use client";

import { motion } from "framer-motion";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Zap, Globe, Award, Play } from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      icon: Zap,
      title: "Innovation",
      description: "Cutting-edge technology meets personalized learning",
    },
    {
      icon: Users,
      title: "Community",
      description: "Learn together with experts and peers globally",
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "Quality education available to everyone, everywhere",
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Industry-recognized certifications and outcomes",
    },
  ];

  const stats = [
    { number: "200+", label: "Active Learners" },
    { number: "50+", label: "Expert Tutors" },
    { number: "50+", label: "Courses Available" },
    { number: "85%", label: "Success Rate" },
  ];

  return (
    <div className="min-h-screen bg-background">
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
              <span className="text-white">Empowering Education</span>
              <br />
              <span className="text-gradient">One Learner at a Time</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Since 2024, PalmTechnIQ has been changing how people learn. And we
              stepped in to make it better by combining AI-powered technology
              with expert mentorship and a community of learners. We believe
              everyone deserves access to world-class education.
            </p>
            <Button className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white hover-glow">
              Watch Our Story
              <Play className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Our Core</span>{" "}
              <span className="text-gradient">Values</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              These principles guide everything we do at CyberLearn
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}>
                <Card className="glass-card p-8 h-full border-white/10 hover:border-neon-blue/30 transition-all duration-300 hover-glow">
                  <value.icon className="w-12 h-12 text-neon-blue mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-300">{value.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative py-24 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-white">Our</span>{" "}
                <span className="text-gradient">Mission</span>
              </h2>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                We're on a mission to democratize high-quality education by
                leveraging artificial intelligence and connecting learners with
                world-class experts. We believe that with the right tools,
                guidance, and community, anyone can master any skill.
              </p>
              <p className="text-lg text-gray-400 leading-relaxed">
                Our platform combines personalized AI coaching, live mentorship
                from industry leaders, and project-based learning to create an
                education experience that actually works.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative">
              <div className="glass-card p-12 border-white/10">
                <div className="aspect-video bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 rounded-lg flex items-center justify-center">
                  <Play className="w-16 h-16 text-neon-blue" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
