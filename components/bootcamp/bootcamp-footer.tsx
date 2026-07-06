"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";

export function BootcampFooter() {
  return (
    <footer className="w-full bg-[#000000] text-white border-t border-white/10 relative overflow-hidden pt-16 pb-12">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#84c8d4_1px,transparent_1px),linear-gradient(to_bottom,#84c8d4_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          {/* Brand & Mission Statement */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <Link href="/bootcamp" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#27ba55] flex items-center justify-center shadow-[0_0_20px_rgba(39,186,85,0.4)]">
                <span className="text-black font-black text-xl">P</span>
              </div>
              <span className="font-black text-white text-2xl tracking-tighter uppercase">
                PalmTechnIQ <span className="text-[#e4d406]">Summer &apos;26</span>
              </span>
            </Link>
            <p className="text-sm font-medium text-white/70 leading-relaxed max-w-sm">
              An immersive 12-week paid software engineering and AI bootcamp designed for high-conviction builders. Inspired by Moonshot by TechCabal.
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#27ba55]/15 border border-[#27ba55]/40 text-[#27ba55] text-xs font-black uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Cohort Starting Summer 2026</span>
              </span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#84c8d4]">
              Curriculum Tracks
            </h4>
            <ul className="flex flex-col gap-3 text-sm font-semibold text-white/80">
              <li><a href="#tracks" className="hover:text-[#27ba55] transition-colors">AI &amp; LLM Engineering</a></li>
              <li><a href="#tracks" className="hover:text-[#27ba55] transition-colors">Full-Stack Architecture</a></li>
              <li><a href="#tracks" className="hover:text-[#27ba55] transition-colors">Product UI/UX Maximalism</a></li>
              <li><a href="#tracks" className="hover:text-[#27ba55] transition-colors">Cloud &amp; DevOps Engineering</a></li>
              <li><a href="#tracks" className="hover:text-[#27ba55] transition-colors">Data Science &amp; Analytics</a></li>
            </ul>
          </div>

          {/* Portal Links */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#84c8d4]">
              Bootcamp Portal
            </h4>
            <ul className="flex flex-col gap-3 text-sm font-semibold text-white/80">
              <li><a href="#why-attend" className="hover:text-[#27ba55] transition-colors">Why Attend PalmTechnIQ?</a></li>
              <li><a href="#battlefield" className="hover:text-[#27ba55] transition-colors">Demo Day Battlefield ($10K Prize)</a></li>
              <li><a href="#pricing" className="hover:text-[#27ba55] transition-colors">Tuition &amp; Scholarship Tiers</a></li>
              <li><a href="#ai-advisor" className="hover:text-[#27ba55] transition-colors">AI Career Course Advisor</a></li>
              <li>
                <Link href="/" className="inline-flex items-center gap-1 text-[#e4d406] hover:underline font-bold">
                  <span>Return to Main LMS Platform</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-white/50 tracking-wider uppercase">
          <p>&copy; {new Date().getFullYear()} PalmTechnIQ. All rights reserved. Building for a New World.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
