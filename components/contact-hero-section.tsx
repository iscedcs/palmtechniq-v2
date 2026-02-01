"use client";

import { courseTypes } from "@/lib/const";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  LiveActivityTicker,
  LiveChatWidget,
  SuccessStoryPopup,
  TrustSignals,
} from "./conversion-features";
import {
  ReferralFloatingWidget,
  ReferralSuccessNotification,
} from "./referral-system";
import { DemandSurgeNotification } from "./dynamic-pricing";

export function ContactHeroSection() {
  const [selectedType, setSelectedType] = useState("all");

  return (
    <div className="min-h-screen bg-background">
      <LiveChatWidget />

      {/* <LiveActivityTicker /> */}
      {/* <SuccessStoryPopup /> */}
      {/* <ReferralFloatingWidget /> */}
      {/* <ReferralSuccessNotification /> */}
      {/* <DemandSurgeNotification /> */}
      <section className="pt-32 pb-20 relative overflow-hidden cyber-grid">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-neon-blue/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-gradient">Discover</span>{" "}
              <span className="text-white">Courses</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              From crash courses to masterclasses - find the perfect learning
              path for your goals
            </p>

            <TrustSignals />
          </motion.div>

          {/* Course Type Filters */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-12">
            {courseTypes.map((type, index) => (
              <motion.button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center px-6 py-3 rounded-2xl border transition-all duration-300 ${
                  selectedType === type.id
                    ? "border-neon-blue bg-neon-blue/20 text-neon-blue"
                    : "border-white/20 bg-white/5 text-white hover:border-neon-blue/50 hover:bg-neon-blue/10"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}>
                <type.icon className="w-5 h-5 mr-2" />
                {type.name}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
