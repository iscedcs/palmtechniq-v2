"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Sparkles, Terminal, Flame, ShieldCheck, Cpu } from "lucide-react";

export function BootcampHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Live countdown timer state (counting down to Summer 2026 Cohort kickoff)
  const [timeLeft, setTimeLeft] = useState({
    days: 56,
    hours: 18,
    minutes: 42,
    seconds: 15,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: 23, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // GSAP Choreographed Entrance Animation (using official useGSAP hook and gsap-timeline skill)
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-badge", {
        y: -30,
        opacity: 0,
        duration: 0.8,
      })
        .from(
          ".hero-title-word",
          {
            y: 80,
            opacity: 0,
            duration: 1,
            stagger: 0.15,
            ease: "back.out(1.4)",
          },
          "-=0.4"
        )
        .from(
          ".hero-subtitle",
          {
            y: 40,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.6"
        )
        .from(
          ".hero-countdown",
          {
            scale: 0.9,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.4"
        )
        .from(
          ".hero-cta",
          {
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
          },
          "-=0.4"
        )
        .from(
          ".hero-floating-card",
          {
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
          },
          "-=0.4"
        );
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className="relative w-full pt-12 pb-24 overflow-hidden">
      {/* Subtle Cyber-Grid Background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,#84c8d4_1px,transparent_1px),linear-gradient(to_bottom,#84c8d4_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Decorative Glow Orbs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#27ba55]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#84c8d4]/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        {/* Top Announcement Badge */}
        <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00343d] border border-[#27ba55]/50 text-white shadow-[0_0_20px_rgba(39,186,85,0.25)] mb-8">
          <span className="w-2 h-2 rounded-full bg-[#27ba55] animate-ping" />
          <span className="text-xs font-black uppercase tracking-widest text-[#27ba55]">
            Moonshot Maximalist Series
          </span>
          <span className="text-white/40">|</span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#e4d406]">
            Applications Open for Summer &apos;26
          </span>
        </div>

        {/* Giant Viewport Typography */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] max-w-5xl mb-8 flex flex-wrap justify-center gap-x-4">
          <span className="hero-title-word text-white">COURAGE</span>
          <span className="hero-title-word text-white">TO</span>
          <span className="hero-title-word text-[#84c8d4] underline decoration-[#27ba55] decoration-4 underline-offset-8">
            CODE.
          </span>
          <span className="hero-title-word text-white">CONVICTION</span>
          <span className="hero-title-word text-white">TO</span>
          <span className="hero-title-word text-[#e4d406] bg-clip-text">
            BUILD.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle text-lg sm:text-2xl font-bold text-white/80 max-w-3xl mb-12 leading-relaxed">
          The PalmTechnIQ Summer 2026 Bootcamp is a 12-week high-density, mentor-led engineering crucible designed to transform high-conviction builders into top 1% software engineers and AI architects.
        </p>

        {/* Highlight Yellow Pulse Countdown Ticker */}
        <div className="hero-countdown w-full max-w-2xl bg-[#000000]/80 border-2 border-[#e4d406] rounded-3xl p-6 shadow-[0_0_40px_rgba(228,212,6,0.25)] mb-12 transform hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#e4d406] animate-bounce" />
              <span className="text-xs font-black uppercase tracking-widest text-[#e4d406]">
                Live Countdown to Cohort Kickoff
              </span>
            </div>
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
              Limited Seats Available
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="flex flex-col bg-[#00343d]/60 rounded-2xl p-3 border border-white/10">
              <span className="text-3xl sm:text-4xl font-black text-[#e4d406] font-mono">
                {String(timeLeft.days).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">
                Days
              </span>
            </div>
            <div className="flex flex-col bg-[#00343d]/60 rounded-2xl p-3 border border-white/10">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">
                Hours
              </span>
            </div>
            <div className="flex flex-col bg-[#00343d]/60 rounded-2xl p-3 border border-white/10">
              <span className="text-3xl sm:text-4xl font-black text-[#84c8d4] font-mono">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">
                Minutes
              </span>
            </div>
            <div className="flex flex-col bg-[#00343d]/60 rounded-2xl p-3 border border-white/10">
              <span className="text-3xl sm:text-4xl font-black text-[#27ba55] font-mono animate-pulse">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">
                Seconds
              </span>
            </div>
          </div>
        </div>

        {/* Hero CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-16">
          <Link
            href="#pricing"
            className="hero-cta w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#27ba55] text-black font-black text-base uppercase tracking-widest shadow-[0_0_30px_rgba(39,186,85,0.6)] hover:shadow-[0_0_45px_rgba(39,186,85,0.9)] hover:scale-105 active:scale-95 transition-all"
          >
            <span>Apply For Summer &apos;26</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="#tracks"
            className="hero-cta w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/10 border border-white/20 text-white font-black text-base uppercase tracking-widest hover:bg-white/20 hover:border-white/40 transition-all"
          >
            <Terminal className="w-5 h-5 text-[#84c8d4]" />
            <span>Explore 8 Tracks</span>
          </Link>
        </div>

        {/* Floating 3D Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left">
          <div className="hero-floating-card bg-[#00343d]/60 border border-[#27ba55]/40 rounded-3xl p-6 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-[#27ba55] transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-[#27ba55]/20 flex items-center justify-center text-[#27ba55] mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">
              100% Code-First Crucible
            </h3>
            <p className="text-sm font-semibold text-white/70 leading-relaxed">
              No passive video watching. You build real-world distributed architectures, train custom LLMs, and deploy production microservices.
            </p>
          </div>

          <div className="hero-floating-card bg-[#00343d]/60 border border-[#84c8d4]/40 rounded-3xl p-6 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-[#84c8d4] transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-[#84c8d4]/20 flex items-center justify-center text-[#84c8d4] mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">
              1-on-1 Senior Mentorship
            </h3>
            <p className="text-sm font-semibold text-white/70 leading-relaxed">
              Weekly rigorous code reviews and architectural sparring sessions with senior tech leads from top global tech enterprises.
            </p>
          </div>

          <div className="hero-floating-card bg-[#00343d]/60 border border-[#e4d406]/40 rounded-3xl p-6 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-[#e4d406] transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-[#e4d406]/20 flex items-center justify-center text-[#e4d406] mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">
              $10,000 Demo Day Pool
            </h3>
            <p className="text-sm font-semibold text-white/70 leading-relaxed">
              Form hackathon teams, build MVP moonshots, and pitch live to venture capitalists and hiring partners on Demo Day.
            </p>
          </div>
        </div>
      </div>

      {/* Stat Marquee Tape Across Bottom */}
      <div className="w-full bg-[#000000] border-y-2 border-[#27ba55] py-4 mt-20 overflow-hidden relative">
        <div className="flex items-center gap-12 whitespace-nowrap animate-marquee font-mono text-sm font-black tracking-widest uppercase text-white">
          <span className="flex items-center gap-2 text-[#27ba55]">
            <span>⚡</span> 5,000+ GLOBAL ALUMNI NETWORK
          </span>
          <span className="text-white/30">•</span>
          <span className="flex items-center gap-2 text-[#e4d406]">
            <span>🏆</span> $10,000 HACKATHON PRIZE POOL
          </span>
          <span className="text-white/30">•</span>
          <span className="flex items-center gap-2 text-[#84c8d4]">
            <span>💻</span> 8 SPECIALIZED ENGINEERING TRACKS
          </span>
          <span className="text-white/30">•</span>
          <span className="flex items-center gap-2 text-[#27ba55]">
            <span>🤝</span> 100% HIRING PARTNER INTERVIEWS FOR EXECUTIVE TIER
          </span>
          <span className="text-white/30">•</span>
          <span className="flex items-center gap-2 text-[#e4d406]">
            <span>🚀</span> BUILDING FOR A NEW WORLD
          </span>
        </div>
      </div>
    </section>
  );
}
