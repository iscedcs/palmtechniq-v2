"use client";

import { motion } from "framer-motion";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Globe, Zap, ArrowRight } from "lucide-react";

export default function PartnerPage() {
  const partnershipTypes = [
    {
      icon: Users,
      title: "Affiliate Program",
      description:
        "Earn recurring commissions by referring students to CyberLearn",
      benefits: [
        "Up to 30% commission",
        "Marketing materials provided",
        "Dedicated support",
      ],
    },
    {
      icon: Globe,
      title: "Enterprise Partnerships",
      description:
        "White-label solutions for large organizations and institutions",
      benefits: ["Custom branding", "Volume pricing", "Dedicated success team"],
    },
    {
      icon: TrendingUp,
      title: "Content Creator",
      description: "Create and sell your courses on our platform",
      benefits: ["70% revenue share", "Built-in audience", "Marketing support"],
    },
    {
      icon: Zap,
      title: "Technology Integration",
      description: "Integrate your tools and services with CyberLearn",
      benefits: ["API access", "Co-marketing opportunities", "Revenue sharing"],
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
              <span className="text-white">Partner With</span>
              <br />
              <span className="text-gradient">CyberLearn</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Join our growing ecosystem of partners and help us transform
              education worldwide
            </p>
            <Button className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white hover-glow">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Partnership Types */}
      <section className="relative py-24 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Partnership</span>{" "}
              <span className="text-gradient">Options</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {partnershipTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}>
                <Card className="glass-card p-8 border-white/10 hover:border-neon-blue/30 transition-all duration-300 h-full hover-glow">
                  <type.icon className="w-12 h-12 text-neon-blue mb-4" />
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    {type.title}
                  </h3>
                  <p className="text-gray-300 mb-6">{type.description}</p>
                  <ul className="space-y-3 mb-8">
                    {type.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-neon-blue mt-2 flex-shrink-0" />
                        <span className="text-gray-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white">
                    Learn More
                  </Button>
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
