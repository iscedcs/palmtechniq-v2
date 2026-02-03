"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingAIButtonProps {
  onActivate: () => void;
  isActive?: boolean;
  lessonProgress?: number;
}

export function FloatingAIButton({
  onActivate,
  isActive = false,
  lessonProgress = 0,
}: FloatingAIButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 1 }}
      className="fixed bottom-24 right-6 z-40">
      <div className="relative">
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && !isActive && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-black/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap border border-white/20">
              Need help? Ask your AI tutor!
              <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/20" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Button */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => {
            setIsHovered(true);
            setTimeout(() => setShowTooltip(true), 500);
          }}
          onHoverEnd={() => {
            setIsHovered(false);
            setShowTooltip(false);
          }}>
          <Button
            onClick={onActivate}
            className={`w-14 h-14 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple shadow-2xl shadow-neon-blue/30 border-2 border-white/20 relative overflow-hidden ${
              isActive ? "ring-4 ring-neon-blue/50" : ""
            }`}>
            {/* Animated background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-blue"
              animate={{
                rotate: isHovered ? 360 : 0,
              }}
              transition={{
                duration: 2,
                repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
                ease: "linear",
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center justify-center">
              <motion.div
                animate={{
                  rotate: isActive ? [0, 10, -10, 0] : 0,
                }}
                transition={{
                  duration: 0.5,
                  repeat: isActive ? Number.POSITIVE_INFINITY : 0,
                }}>
                <Bot className="w-6 h-6 text-white" />
              </motion.div>
            </div>

            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-neon-blue/30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </Button>
        </motion.div>

        {/* Notification dot for new features */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-neon-orange to-pink-400 rounded-full flex items-center justify-center">
          <Sparkles className="w-2 h-2 text-white" />
        </motion.div>

        {/* Progress indicator */}
        {lessonProgress > 0 && (
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: lessonProgress / 100 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 -m-1">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="30"
                stroke="rgba(59, 130, 246, 0.3)"
                strokeWidth="2"
                fill="none"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="30"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - lessonProgress / 100)}`}
              />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
