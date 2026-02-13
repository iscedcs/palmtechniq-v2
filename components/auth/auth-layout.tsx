"use client";

import type React from "react";

import { motion } from "framer-motion";
import { Brain, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { generateRandomAvatar } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showBackButton?: boolean;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen my-20  max-w-7xl mx-auto flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" />

        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-black to-black flex items-center justify-center mb-6 mx-auto">
              <Image
                src="/assets/standalone.png"
                alt=""
                width={100}
                height={100}
                className="w-10 h-10"
              />
            </div>
            <h1 className="text-4xl font-bold text-gradient mb-4">
              PalmTechnIQ
            </h1>
            <p className="text-xl text-white/80 max-w-md">
              Transform your learning journey with AI-powered education
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-6">
            <div className="glass-card p-6 rounded-xl border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">
                🚀 AI-Powered Learning
              </h3>
              <p className="text-white/70">
                Personalized courses adapted to your learning style
              </p>
            </div>

            <div className="glass-card p-6 rounded-xl border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">
                👥 Expert Mentorship
              </h3>
              <p className="text-white/70">
                Connect with industry professionals and get guidance
              </p>
            </div>

            <div className="glass-card p-6 rounded-xl border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">
                🏆 Gamified Progress
              </h3>
              <p className="text-white/70">
                Earn achievements and track your learning journey
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-12">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center mr-3">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">PalmTechnIQ</span>
          </div>

          {/* Back Button */}
          {showBackButton && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6">
              <Link href="/">
                <Button
                  variant="ghost"
                  className="hover:bg-white/10 text-white/70 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
            <p className="text-white/70">{subtitle}</p>
          </motion.div>

          {/* Form Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}>
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
