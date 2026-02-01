"use client";

import { motion } from "framer-motion";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

export default function PressPage() {
  const pressReleases = [
    {
      title: "CyberLearn Raises $50M Series B to Expand AI Learning Platform",
      date: "November 2024",
      excerpt:
        "Investment led by top-tier VCs to accelerate product development and global expansion",
    },
    {
      title: "CyberLearn Named Top EdTech Startup of 2024",
      date: "September 2024",
      excerpt:
        "Recognition from TechCrunch and other major publications for innovation in online education",
    },
    {
      title: "500,000+ Learners Achieve Their Goals on CyberLearn",
      date: "August 2024",
      excerpt:
        "Milestone announcement as platform reaches 500K active learners globally",
    },
  ];

  const mediaKits = [
    { title: "Brand Guidelines", file: "cyberlearn-brand-guidelines.pdf" },
    { title: "Logo Pack", file: "cyberlearn-logos.zip" },
    { title: "Press Kit", file: "cyberlearn-press-kit.pdf" },
  ];

  const mentions = [
    {
      publication: "TechCrunch",
      article: "How CyberLearn is Using AI to Personalize Education",
    },
    {
      publication: "Forbes",
      article: "5 EdTech Startups Changing the Future of Learning",
    },
    {
      publication: "The Verge",
      article: "Interview: Building the Future of Online Education",
    },
    {
      publication: "VentureBeat",
      article: "CyberLearn's AI Tutor Powers Next Generation of Learners",
    },
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
              <span className="text-white">Press &</span>
              <br />
              <span className="text-gradient">Media Kit</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Latest news, media resources, and press inquiries
            </p>
          </motion.div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="relative py-24 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Latest Press Releases
            </h2>
          </motion.div>

          <div className="space-y-6">
            {pressReleases.map((release, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}>
                <Card className="glass-card p-8 border-white/10 hover:border-neon-blue/30 transition-all duration-300 hover-glow">
                  <div className="mb-4">
                    <span className="text-neon-blue text-sm font-semibold">
                      {release.date}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    {release.title}
                  </h3>
                  <p className="text-gray-300 mb-4">{release.excerpt}</p>
                  <Button
                    variant="ghost"
                    className="text-neon-blue hover:text-neon-blue hover:bg-white/5">
                    Read More
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="relative py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Media Resources
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mediaKits.map((kit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}>
                <Card className="glass-card p-8 border-white/10 hover:border-neon-blue/30 transition-all duration-300 hover-glow text-center">
                  <Download className="w-12 h-12 text-neon-blue mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {kit.title}
                  </h3>
                  <Button className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white w-full">
                    Download
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Mentions */}
      <section className="relative py-24 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">As Seen In</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mentions.map((mention, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}>
                <Card className="glass-card p-6 border-white/10 hover:border-neon-blue/30 transition-all duration-300">
                  <h3 className="text-sm font-semibold text-neon-blue mb-2">
                    {mention.publication}
                  </h3>
                  <p className="text-white font-semibold">{mention.article}</p>
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
