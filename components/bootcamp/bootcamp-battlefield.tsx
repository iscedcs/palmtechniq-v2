"use client";

import React from "react";
import Link from "next/link";
import { Trophy, Users, Flame, Target, ArrowRight } from "lucide-react";

export function BootcampBattlefield() {
  return (
    <section id="battlefield" className="w-full py-24 bg-[#000000] relative overflow-hidden border-y border-white/10">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#800000]/30 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Typography & Value */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#800000]/40 border border-[#800000] text-white text-xs font-black uppercase tracking-widest w-fit shadow-[0_0_20px_rgba(128,0,0,0.6)]">
              <Flame className="w-3.5 h-3.5 text-[#e4d406]" />
              <span>Hackathon Crucible</span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white leading-tight">
              THE DEMO DAY <span className="text-[#e4d406]">BATTLEFIELD</span>
            </h2>

            <p className="text-base sm:text-lg font-semibold text-white/80 leading-relaxed">
              Bootcamp isn&apos;t just about exercises; it&apos;s about shipping a company. In Week 8, all students form multi-disciplinary squads (AI engineers + Full-Stack architects + UI/UX designers) to build a production moonshot product.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3 bg-[#00343d]/40 p-4 rounded-2xl border border-white/10">
                <Trophy className="w-6 h-6 text-[#e4d406] flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-white">
                    $10,000 Equity-Free Pool
                  </h4>
                  <p className="text-xs text-white/70 mt-1">
                    Top 3 winning teams take home equity-free cash grants to fund their cloud infrastructure and launch.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#00343d]/40 p-4 rounded-2xl border border-white/10">
                <Users className="w-6 h-6 text-[#27ba55] flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-white">
                    Live VC &amp; Partner Pitch
                  </h4>
                  <p className="text-xs text-white/70 mt-1">
                    Pitch directly to tier-1 venture capitalists, angel investors, and engineering directors from hiring partners.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="#pricing"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#e4d406] text-black font-black text-sm uppercase tracking-widest shadow-[0_0_25px_rgba(228,212,6,0.5)] hover:scale-105 transition-all"
              >
                <span>Enter The Battlefield</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Visual HUD Box */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-[#00343d] border-2 border-[#800000] p-8 shadow-[0_0_50px_rgba(128,0,0,0.5)] flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-black uppercase tracking-widest text-[#84c8d4]">
                  Battlefield Metrics
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#27ba55] text-black font-extrabold text-[10px] uppercase">
                  Live in Week 8
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-[#27ba55]" />
                    <span className="text-sm font-bold text-white uppercase">Squad Formation</span>
                  </div>
                  <span className="text-xs font-black text-[#84c8d4] font-mono">4-5 BUILDERS / TEAM</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-[#e4d406]" />
                    <span className="text-sm font-bold text-white uppercase">First Prize</span>
                  </div>
                  <span className="text-xs font-black text-[#e4d406] font-mono">$5,000 CASH</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-white/80" />
                    <span className="text-sm font-bold text-white uppercase">Second Prize</span>
                  </div>
                  <span className="text-xs font-black text-white/80 font-mono">$3,000 CASH</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-[#800000]" />
                    <span className="text-sm font-bold text-white uppercase">Third Prize</span>
                  </div>
                  <span className="text-xs font-black text-[#800000] font-mono">$2,000 CASH</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  All participants receive Demo Day Verified Github Credentials
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
