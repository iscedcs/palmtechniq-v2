"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  User,
  ArrowRight,
  Search,
  Clock,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { urlFor } from "@/lib/sanity";

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  publishedAt: string;
  featured?: boolean;
  readingTime?: number;
  author?: { name: string; image?: { asset: { _ref: string } } };
  categories?: { _id: string; title: string }[];
}

interface Category {
  _id: string;
  title: string;
  description?: string;
}

/* ── Featured Hero ─────────────────────────────────────────────── */
function FeaturedHero({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug.current}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative rounded-2xl overflow-hidden group cursor-pointer">
        {post.mainImage ? (
          <div className="relative h-[420px] md:h-[480px]">
            <Image
              src={urlFor(post.mainImage).width(1400).height(700).url()}
              alt={post.mainImage.alt || post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>
        ) : (
          <div className="h-[420px] md:h-[480px] bg-gradient-to-br from-neon-blue/20 to-neon-purple/20" />
        )}

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-blue/20 text-neon-blue text-xs font-semibold border border-neon-blue/30">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
            {post.categories?.slice(0, 2).map((cat) => (
              <span
                key={cat._id}
                className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium">
                {cat.title}
              </span>
            ))}
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 group-hover:text-neon-blue transition-colors leading-tight">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="text-gray-300 text-lg mb-4 line-clamp-2 max-w-2xl">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-400">
            {post.author && (
              <div className="flex items-center gap-2">
                {post.author.image ? (
                  <Image
                    src={urlFor(post.author.image).width(32).height(32).url()}
                    alt={post.author.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span>{post.author.name}</span>
              </div>
            )}
            {post.publishedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            )}
            {post.readingTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.readingTime} min read
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ── Post Card ─────────────────────────────────────────────────── */
function PostCard({ post, index }: { post: Post; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      viewport={{ once: true }}>
      <Link href={`/blog/${post.slug.current}`}>
        <Card className="glass-card overflow-hidden border-white/10 hover:border-neon-blue/30 transition-all duration-300 h-full hover-glow flex flex-col group">
          {post.mainImage ? (
            <div className="relative h-52 overflow-hidden">
              <Image
                src={urlFor(post.mainImage).width(800).height(450).url()}
                alt={post.mainImage.alt || post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {post.featured && (
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-blue/20 text-neon-blue text-xs font-semibold border border-neon-blue/30 backdrop-blur-sm">
                    <TrendingUp className="w-3 h-3" />
                    Featured
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="relative h-52 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20">
              {post.featured && (
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-blue/20 text-neon-blue text-xs font-semibold border border-neon-blue/30">
                    <TrendingUp className="w-3 h-3" />
                    Featured
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="p-6 flex-1 flex flex-col">
            {post.categories && post.categories.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {post.categories.map((cat) => (
                  <span
                    key={cat._id}
                    className="inline-block px-2.5 py-0.5 rounded-full bg-neon-blue/10 text-neon-blue text-xs font-medium">
                    {cat.title}
                  </span>
                ))}
              </div>
            )}

            <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2 group-hover:text-neon-blue transition-colors">
              {post.title}
            </h3>

            {post.excerpt && (
              <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-3">
                {post.excerpt}
              </p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {post.author && (
                  <div className="flex items-center gap-1.5">
                    {post.author.image ? (
                      <Image
                        src={urlFor(post.author.image)
                          .width(24)
                          .height(24)
                          .url()}
                        alt={post.author.name}
                        width={18}
                        height={18}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                    <span>{post.author.name}</span>
                  </div>
                )}
                {post.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                )}
                {post.readingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readingTime} min
                  </div>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-neon-blue group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

/* ── Main Blog Content ─────────────────────────────────────────── */
export function BlogContent({
  posts,
  categories,
  featuredPosts,
  initialSearchQuery = "",
  initialCategory = null,
}: {
  posts: Post[];
  categories: Category[];
  featuredPosts: Post[];
  initialSearchQuery?: string;
  initialCategory?: string | null;
}) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    initialCategory,
  );

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

  const topFeatured = featuredPosts[0];
  const isFiltering = searchQuery || activeCategory;

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

      {/* Featured Post */}
      {topFeatured && !isFiltering && (
        <section className="relative pb-8">
          <div className="container mx-auto px-6">
            <FeaturedHero post={topFeatured} />
          </div>
        </section>
      )}

      {/* Search & filter */}
      <section className="relative py-8 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-card border-white/20 focus:border-neon-blue/50 text-white placeholder:text-gray-400 pl-10"
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !activeCategory
                    ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40"
                    : "text-gray-400 hover:text-white border border-white/10"
                }`}>
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === cat.title ? null : cat.title,
                    )
                  }
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat.title
                      ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40"
                      : "text-gray-400 hover:text-white border border-white/10"
                  }`}>
                  {cat.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Posts grid */}
      <section className="relative py-16">
        <div className="container mx-auto px-6">
          {!isFiltering && (
            <div className="flex items-center gap-2 mb-8">
              <h2 className="text-2xl font-bold text-white">Latest Articles</h2>
              <span className="text-sm text-gray-500">
                ({posts.length} {posts.length === 1 ? "article" : "articles"})
              </span>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-lg">No articles found</p>
              <p className="text-sm mt-2">
                Try adjusting your search or check back later for new content.
              </p>
              {(searchQuery || activeCategory) && (
                <Button
                  variant="outline"
                  className="mt-4 border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory(null);
                  }}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post, index) => (
                <PostCard key={post._id} post={post} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="relative py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative max-w-2xl mx-auto text-center glass-card border border-white/10 rounded-2xl p-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-neon-blue/20 text-neon-blue text-xs font-semibold border border-neon-blue/30">
                <Sparkles className="w-3 h-3" />
                Stay Updated
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-2 mb-3">
              Never miss a learning insight
            </h2>
            <p className="text-gray-400 mb-6">
              Get the latest articles, tips, and tech education stories
              delivered to your inbox.
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="glass-card border-white/20 focus:border-neon-blue/50 text-white placeholder:text-gray-400"
              />
              <Button className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white px-6 flex-shrink-0">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
