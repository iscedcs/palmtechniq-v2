"use client";

import { motion } from "framer-motion";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronDown,
  MessageCircle,
  BookOpen,
  Zap,
} from "lucide-react";
import { useState } from "react";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: "How do I enroll in a course?",
      answer:
        "To enroll in a course, browse our course catalog, select a course you're interested in, and click 'Enroll Now'. You'll be guided through the payment process if the course is paid.",
    },
    {
      question: "Can I get a refund?",
      answer:
        "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with your purchase, contact our support team for a full refund.",
    },
    {
      question: "How does the AI coach work?",
      answer:
        "Our AI coach uses machine learning to provide personalized feedback on your assignments and quiz answers. It adapts to your learning style and provides targeted recommendations.",
    },
    {
      question: "Can I schedule a mentorship session?",
      answer:
        "Yes, browse our available mentors, check their availability, and book a session that works for your schedule. You can communicate directly with your mentor before the session.",
    },
    {
      question: "Do you offer certificates?",
      answer:
        "Yes, upon completing a course with a passing grade, you'll receive a certificate of completion that you can share on LinkedIn and your resume.",
    },
    {
      question: "How long does it take to complete a course?",
      answer:
        "Course duration varies, but most courses can be completed in 4-12 weeks with 5-10 hours of study per week. You can learn at your own pace.",
    },
  ];

  const categories = [
    { icon: BookOpen, title: "Getting Started", count: 12 },
    { icon: Zap, title: "Courses & Learning", count: 28 },
    { icon: MessageCircle, title: "Mentorship", count: 15 },
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
              <span className="text-white">How Can We</span>
              <br />
              <span className="text-gradient">Help You?</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Find answers to common questions and get support
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-card border-white/20 focus:border-neon-blue/50 text-white placeholder:text-gray-400 flex-1"
              />
              <Button className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative py-24 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}>
                <Card className="glass-card p-8 border-white/10 hover:border-neon-blue/30 transition-all duration-300 hover-glow cursor-pointer text-center">
                  <category.icon className="w-12 h-12 text-neon-blue mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    {category.title}
                  </h3>
                  <p className="text-gray-300">{category.count} articles</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="relative py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}>
                <Card
                  className="glass-card border-white/10 hover:border-neon-blue/30 transition-all duration-300 cursor-pointer"
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }>
                  <div className="p-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`w-6 h-6 text-neon-blue flex-shrink-0 transition-transform duration-300 ${
                        expandedFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-6 border-t border-white/10">
                      <p className="text-gray-300">{faq.answer}</p>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative py-24 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-4">
              Still need help?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Couldn't find what you're looking for? Our support team is here to
              help.
            </p>
            <Button className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white">
              Contact Support
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
