"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getNextCohortInfo } from "@/lib/cohort";

interface AnnouncementBannerProps {
  customDate?: string;
  customText?: string;
  enrollHref?: string;
}

export function AnnouncementBanner({
  customDate,
  customText,
  enrollHref = "/enroll",
}: AnnouncementBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [dateLabel, setDateLabel] = useState<string>("September 21st");

  useEffect(() => {
    setMounted(true);
    const info = getNextCohortInfo();
    setDateLabel(info.dateLabel);
  }, []);

  const displayDate = customDate || (mounted ? dateLabel : "September 21st");
  const message = customText || `New Cohort starts ${displayDate}!`;

  // Repeating items for seamless infinite horizontal marquee
  const repeatCount = 10;
  const items = Array.from({ length: repeatCount }).map((_, i) => ({
    id: i,
    text: message,
  }));

  return (
    <div className="w-full backdrop-blur-3xl bg-black/20 transition-all select-none overflow-hidden relative z-50 shadow-md">
      <Link
        href={enrollHref}
        className="block py-2 sm:py-2.5 group cursor-pointer"
        aria-label={`${message} Click to view programs and register for the next cohort.`}>
        <div className="flex overflow-hidden whitespace-nowrap">
          <motion.div
            className="flex items-center gap-8 sm:gap-12 shrink-0 will-change-transform group-hover:[animation-play-state:paused]"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 25,
            }}>
            {/* Render items twice for continuous infinite scroll */}
            {[...items, ...items].map((item, idx) => (
              <span
                key={`${item.id}-${idx}`}
                className="inline-flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold tracking-wider uppercase text-white drop-shadow-sm">
                <span>{item.text}</span>
                {/* Brand green asterisk matching PalmTechnIQ design system */}
                <span
                  className="text-[#27ba55] font-black text-sm sm:text-base inline-block transform group-hover:scale-125 group-hover:rotate-45 transition-transform"
                  aria-hidden="true">
                  ✳
                </span>
              </span>
            ))}
          </motion.div>
        </div>
      </Link>
    </div>
  );
}
