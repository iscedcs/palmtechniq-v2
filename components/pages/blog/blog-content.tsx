"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, User, ArrowRight, Search } from "lucide-react";
import { urlFor } from "@/lib/sanity";

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  publishedAt: string;
  author?: { name: string; image?: { asset: { _ref: string } } };
  categories?: { title: string }[];
}

interface Category {
  _id: string;
  title: string;
  description?: string;
}

export function BlogContent({
  posts,
  categories,
}: {
  posts: Post[];
  categories: Category[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = posts.filter((post) => {
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !activeCategory ||
      post.categories?.some((c) => c.title === activeCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
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
            className="text-center max-w-4xl mx-auto"
          >
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

      {/* Search & filter */}
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

          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !activeCategory
                    ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40"
                    : "text-gray-400 hover:text-white border border-white/10"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === cat.title ? null : cat.title
                    )
                  }
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat.title
                      ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40"
                      : "text-gray-400 hover:text-white border border-white/10"
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Posts grid */}
      <section className="relative py-24">
        <div className="container mx-auto px-6">
          {filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <p className="text-lg">No articles found</p>
              <p className="text-sm mt-2">
                Try adjusting your search or check back later for new content.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filtered.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link href={`/blog/${post.slug.current}`}>
                    <Card className="glass-card overflow-hidden border-white/10 hover:border-neon-blue/30 transition-all duration-300 h-full hover-glow flex flex-col">
                      {post.mainImage ? (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={urlFor(post.mainImage)
                              .width(800)
                              .height(400)
                              .url()}
                            alt={post.mainImage.alt || post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20" />
                      )}

                      <div className="p-8 flex-1 flex flex-col">
                        {post.categories && post.categories.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-2">
                            {post.categories.map((cat) => (
                              <span
                                key={cat.title}
                                className="inline-block px-3 py-1 rounded-full bg-neon-blue/20 text-neon-blue text-sm font-semibold"
                              >
                                {cat.title}
                              </span>
                            ))}
                          </div>
                        )}

                        <h3 className="text-2xl font-semibold text-white mb-3">
                          {post.title}
                        </h3>

                        {post.excerpt && (
                          <p className="text-gray-300 mb-6 flex-1 line-clamp-3">
                            {post.excerpt}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            {post.author && (
                              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                                <User className="w-4 h-4" />
                                <span>{post.author.name}</span>
                              </div>
                            )}
                            {post.publishedAt && (
                              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(
                                    post.publishedAt
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-neon-blue hover:text-neon-blue"
                            tabIndex={-1}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
