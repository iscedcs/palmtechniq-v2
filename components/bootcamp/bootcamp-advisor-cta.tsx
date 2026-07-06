"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, MessageSquare, ArrowRight, Bot } from "lucide-react";

export function BootcampAdvisorCta() {
  return (
    <section id="ai-advisor" className="w-full py-20 bg-[#00343d] relative overflow-hidden border-t border-white/10">
      {/* Glow Orbs */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#84c8d4]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#27ba55]/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-[#001c22]/80 border-2 border-[#84c8d4] rounded-3xl p-8 sm:p-12 backdrop-blur-2xl shadow-[0_0_50px_rgba(132,200,212,0.25)] flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#84c8d4]/20 border border-[#84c8d4] text-[#84c8d4] text-xs font-black uppercase tracking-widest w-fit mx-auto md:mx-0">
              <Bot className="w-4 h-4" />
              <span>AI Career Advisor Ready</span>
            </div>

            <h3 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              UNSURE WHICH <span className="text-[#84c8d4]">TRACK FITS YOU?</span>
            </h3>

            <p className="text-sm sm:text-base font-semibold text-white/80 leading-relaxed">
              Our custom AI Bootcamp Advisor evaluates your current technical baseline, career aspirations, and learning pace to recommend the exact curriculum track and tuition tier designed for your highest ROI.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto flex-shrink-0">
            <Link
              href="/admin/advisor" // Or interactive advisor modal / page
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#84c8d4] text-black font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(132,200,212,0.6)] hover:scale-105 transition-all"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Launch AI Advisor</span>
            </Link>

            <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider text-center">
              Free Instant Assessment
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
