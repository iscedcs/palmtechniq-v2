"use client";

import { motion } from "framer-motion";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const blogPosts = [
    {
      title: "How AI is Transforming Online Education",
      excerpt:
        "Explore how artificial intelligence is personalizing learning experiences and helping students achieve their goals faster.",
      author: "Sarah Chen",
      date: "Nov 15, 2024",
      category: "Technology",
      image: "/ai-education.jpg",
    },
    {
      title: "The Future of Remote Learning",
      excerpt:
        "Discover the latest trends in remote education and what it means for learners and educators worldwide.",
      author: "James Wilson",
      date: "Nov 12, 2024",
      category: "Trends",
      image: "/remote-learning.jpg",
    },
    {
      title: "Building Your First Machine Learning Project",
      excerpt:
        "A comprehensive guide to getting started with machine learning, from theory to your first deployed model.",
      author: "Alex Rodriguez",
      date: "Nov 10, 2024",
      category: "Tutorials",
      image: "/machine-learning-concept.png",
    },
    {
      title: "Success Stories: From Bootcamp to Tech Job",
      excerpt:
        "Real stories from our learners who landed their dream jobs after completing our intensive programs.",
      author: "Lisa Park",
      date: "Nov 8, 2024",
      category: "Success",
      image: "/tech-career-path.png",
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
              <span className="text-white">Learning</span>
              <br />
              <span className="text-gradient">Insights & Stories</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Discover tips, trends, and success stories from the world of
              online learning
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search Section */}
      <section className="relative py-8 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-card border-white/20 focus:border-neon-blue/50 text-white placeholder:text-gray-400"
            />
            <Button className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="relative py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogPosts.map((post, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}>
                <Card className="glass-card overflow-hidden border-white/10 hover:border-neon-blue/30 transition-all duration-300 h-full hover-glow flex flex-col">
                  <div className="h-48 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20" />
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-neon-blue/20 text-neon-blue text-sm font-semibold">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">
                      {post.title}
                    </h3>
                    <p className="text-gray-300 mb-6 flex-1">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-gray-400 text-sm">
                          <User className="w-4 h-4" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{post.date}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-neon-blue hover:text-neon-blue">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
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
