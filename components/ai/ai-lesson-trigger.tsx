"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AILessonTriggerProps {
  lessonId: string;
  lessonTitle: string;
  onActivate: () => void;
  isActive?: boolean;
}

export function AILessonTrigger({
  lessonId,
  lessonTitle,
  onActivate,
  isActive = false,
}: AILessonTriggerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative">
      <Button
        onClick={onActivate}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative overflow-hidden bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 text-neon-blue hover:from-neon-blue/30 hover:to-neon-purple/30 hover:border-neon-blue/50 transition-all duration-300 ${
          isActive ? "ring-2 ring-neon-blue/50" : ""
        }`}
        size="sm">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10"
          animate={{
            x: isHovered ? ["-100%", "100%"] : "-100%",
          }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
            repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
          }}
        />

        <div className="relative flex items-center space-x-2">
          <motion.div
            animate={{
              rotate: isActive ? 360 : 0,
            }}
            transition={{
              duration: 0.5,
              ease: "easeInOut",
            }}>
            <Bot className="w-4 h-4" />
          </motion.div>
          <span className="font-medium">Ask AI</span>
          <motion.div
            animate={{
              scale: isHovered ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
            }}>
            <Sparkles className="w-3 h-3" />
          </motion.div>
        </div>

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-md"
          animate={{
            boxShadow: isActive
              ? [
                  "0 0 20px rgba(59, 130, 246, 0.3)",
                  "0 0 30px rgba(147, 51, 234, 0.3)",
                  "0 0 20px rgba(59, 130, 246, 0.3)",
                ]
              : "0 0 0px rgba(59, 130, 246, 0)",
          }}
          transition={{
            duration: 2,
            repeat: isActive ? Number.POSITIVE_INFINITY : 0,
          }}
        />
      </Button>

      {/* Smart badge for new feature */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="absolute -top-2 -right-2">
        <Badge className="bg-gradient-to-r from-neon-orange to-pink-400 text-white text-xs px-1.5 py-0.5 animate-pulse">
          <Zap className="w-2 h-2 mr-1" />
          NEW
        </Badge>
      </motion.div>
    </motion.div>
  );
}
