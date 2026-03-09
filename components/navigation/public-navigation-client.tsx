"use client";

import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Zap,
  Users,
  TrendingUp,
  FileText,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PublicNavigationClientProps {
  coursesByLevel: Record<string, Array<{ label: string; href: string }>>;
  coursesByCategory: Record<string, Array<{ label: string; href: string }>>;
  courses: Array<{ id: string; title: string; slug: string | null }>;
  categories: Array<{ id: string; name: string }>;
}

const features = [
  {
    icon: Zap,
    title: "AI Interview Coach",
    description: "Practice with adaptive AI interviewer",
    link: "/features/ai-interview",
  },
  {
    icon: Users,
    title: "Live Mentorship",
    description: "1-on-1 sessions with industry experts",
    link: "/features/mentorship",
  },
  {
    icon: BookOpen,
    title: "Hybrid Learning",
    description: "Virtual & physical learning environments",
    link: "/courses",
  },
  {
    icon: TrendingUp,
    title: "Project-Based Learning",
    description: "Real-world industry projects",
    link: "/courses",
  },
];

const resources = [
  // { icon: FileText, label: "Blog", href: "/blog" },
  // { icon: Lightbulb, label: "Insights", href: "/insights" },
  // { icon: TrendingUp, label: "Case Studies", href: "/case-studies" },
  { icon: MessageSquare, label: "Help Center", href: "/help" },
];

export function PublicNavigationClient({
  coursesByLevel,
  coursesByCategory,
  courses,
  categories,
}: PublicNavigationClientProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "glass-card border-b border-white/10 backdrop-blur-3xl bg-black/20"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}>
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <motion.div
                className="flex items-center space-x-2 cursor-pointer"
                whileHover={{ scale: 1.05 }}>
                <Image
                  src="/assets/standalone.png"
                  alt="PalmTechnIQ"
                  width={100}
                  height={100}
                  className="w-10 h-10"
                />
                <span className="text-2xl font-bold text-gradient hidden sm:inline">
                  PalmTechnIQ
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* Courses Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setOpenMenu("courses")}
                onMouseLeave={() => setOpenMenu(null)}>
                <Button
                  variant="ghost"
                  className="flex items-center group hover:bg-white/10 text-gray-300 hover:text-white transition-all">
                  Courses
                  <ChevronDown className="w-4 h-4 ml-1 group-hover:rotate-180 transition-transform" />
                </Button>

                {/* Courses Mega Menu */}
                <AnimatePresence>
                  {openMenu === "courses" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 mt-0 w-screen max-w-4xl bg-black/90 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl p-8">
                      <div className="grid grid-cols-2 gap-8">
                        {/* By Category */}
                        {Object.entries(coursesByCategory)
                          .slice(0, 2)
                          .map(
                            ([categoryName, items]: [
                              string,
                              Array<{ label: string; href: string }>,
                            ]) => (
                              <div key={categoryName}>
                                <h3 className="text-sm font-bold text-neon-blue mb-4 uppercase tracking-wider">
                                  {categoryName}
                                </h3>
                                <div className="space-y-3">
                                  {items
                                    .slice(0, 5)
                                    .map(
                                      (item: {
                                        label: string;
                                        href: string;
                                      }) => (
                                        <Link key={item.href} href={item.href}>
                                          <motion.div
                                            whileHover={{ x: 4 }}
                                            className="text-gray-300 hover:text-white transition-colors  space-y-3 flex items-center cursor-pointer text-sm">
                                            {item.label}
                                            <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </motion.div>
                                        </Link>
                                      ),
                                    )}
                                </div>
                              </div>
                            ),
                          )}

                        {/* By Skill Level */}
                        {Object.entries(coursesByLevel)
                          .slice(0, 2)
                          .map(
                            ([level, items]: [
                              string,
                              Array<{ label: string; href: string }>,
                            ]) => (
                              <div key={level}>
                                <h3 className="text-sm font-bold text-neon-blue mb-4 uppercase tracking-wider">
                                  {level}
                                </h3>
                                <div className="space-y-3">
                                  {items
                                    .slice(0, 5)
                                    .map(
                                      (item: {
                                        label: string;
                                        href: string;
                                      }) => (
                                        <Link key={item.href} href={item.href}>
                                          <motion.div
                                            whileHover={{ x: 4 }}
                                            className="text-gray-300 hover:text-white transition-colors flex items-center cursor-pointer text-sm">
                                            {item.label}
                                            <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </motion.div>
                                        </Link>
                                      ),
                                    )}
                                </div>
                              </div>
                            ),
                          )}
                      </div>
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <Link href="/courses">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-neon-blue to-neon-purple hover:scale-105 transition-transform">
                            Explore All {courses.length} Courses
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Features Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setOpenMenu("features")}
                onMouseLeave={() => setOpenMenu(null)}>
                <Button
                  variant="ghost"
                  className="flex items-center group hover:bg-white/10 text-gray-300 hover:text-white transition-all">
                  Platform
                  <ChevronDown className="w-4 h-4 ml-1 group-hover:rotate-180 transition-transform" />
                </Button>

                {/* Features Mega Menu */}
                <AnimatePresence>
                  {openMenu === "features" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 mt-0 w-screen max-w-xl bg-black/90 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl p-8">
                      <div className="grid grid-cols-1 gap-4">
                        {features.map((feature) => {
                          const Icon = feature.icon;
                          return (
                            <motion.a
                              key={feature.title}
                              href={feature.link}
                              whileHover={{ x: 4 }}
                              className="p-4 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer">
                              <div className="flex items-start">
                                <Icon className="w-5 h-5 text-neon-blue mr-4 mt-1 flex-shrink-0" />
                                <div>
                                  <h4 className="text-white font-semibold group-hover:text-neon-blue transition-colors">
                                    {feature.title}
                                  </h4>
                                  <p className="text-sm text-gray-400 mt-1">
                                    {feature.description}
                                  </p>
                                </div>
                              </div>
                            </motion.a>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Resources Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setOpenMenu("resources")}
                onMouseLeave={() => setOpenMenu(null)}>
                <Button
                  variant="ghost"
                  className="flex items-center group hover:bg-white/10 text-gray-300 hover:text-white transition-all">
                  Resources
                  <ChevronDown className="w-4 h-4 ml-1 group-hover:rotate-180 transition-transform" />
                </Button>

                {/* Resources Mega Menu */}
                <AnimatePresence>
                  {openMenu === "resources" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 mt-0 w-screen max-w-md bg-black/90 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl p-8">
                      <div className="grid grid-cols-2 gap-4">
                        {resources.map((resource) => {
                          const Icon = resource.icon;
                          return (
                            <Link key={resource.href} href={resource.href}>
                              <motion.div
                                whileHover={{ y: -2 }}
                                className="p-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                                <Icon className="w-5 h-5 text-neon-blue mb-3" />
                                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                                  {resource.label}
                                </p>
                              </motion.div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Simple Links */}
              <Link href="/about">
                <Button
                  variant="ghost"
                  className="hover:bg-white/10 text-gray-300 hover:text-white transition-all">
                  About Us
                </Button>
              </Link>

              <Link href="/contact">
                <Button
                  variant="ghost"
                  className="hover:bg-white/10 text-gray-300 hover:text-white transition-all">
                  Contact
                </Button>
              </Link>
            </div>

            {/* Right Side - Auth Buttons */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="hover:bg-white/10 text-gray-300 hover:text-white transition-all">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 transition-all hover-glow">
                    Sign Up
                  </Button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors">
                {isMobileOpen ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-0 right-0 bg-black/95 border-b border-white/10 z-40 lg:hidden">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="space-y-4">
                <Link href="/courses" onClick={() => setIsMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white">
                    Courses
                  </Button>
                </Link>
                <Link href="/features" onClick={() => setIsMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white">
                    Platform
                  </Button>
                </Link>
                <Link href="/blog" onClick={() => setIsMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white">
                    Resources
                  </Button>
                </Link>
                <Link href="/about" onClick={() => setIsMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white">
                    About Us
                  </Button>
                </Link>
                <Link href="/contact" onClick={() => setIsMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white">
                    Contact
                  </Button>
                </Link>

                <div className="border-t border-white/10 pt-4 space-y-3">
                  <Link href="/login" onClick={() => setIsMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-center">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsMobileOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-neon-blue to-neon-purple">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
