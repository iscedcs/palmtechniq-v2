"use client";

import React from "react";
import Link from "next/link";
import { Check, Sparkles, ShieldCheck, Zap } from "lucide-react";

export function BootcampTiers() {
  const TIERS = [
    {
      id: "virtual-scholar",
      name: "Virtual Scholar",
      tagline: "Merit-Based Scholarship & Self-Paced Track",
      price: "$0",
      period: "Upfront (Merit Application Required)",
      color: "#84c8d4",
      highlight: false,
      ctaLabel: "Apply for Scholarship",
      ctaHref: "/apply?track=bootcamp-scholarship",
      features: [
        "Full access to all 8 intensive curriculum tracks",
        "Community Discord code reviews & sparring",
        "Weekly group live Q&A sessions with mentors",
        "Participation in Demo Day Battlefield team formation",
        "Standard PalmTechnIQ Bootcamp Completion Certificate",
      ],
    },
    {
      id: "immersive-pro",
      name: "Immersive Pro",
      tagline: "The Core 12-Week Guided Crucible experience",
      price: "$499",
      period: "One-Time Tuition (Or 3 Monthly Installments)",
      color: "#27ba55",
      highlight: true,
      badge: "MOST POPULAR CHOICE",
      ctaLabel: "Secure Pro Seat Now",
      ctaHref: "/courses/bootcamp-summer-2026/checkout?tier=immersive-pro",
      features: [
        "Everything in Virtual Scholar, plus:",
        "1-on-1 weekly private code reviews with a Senior Lead",
        "Guaranteed Hackathon Team Placement & Dedicated Mentor",
        "Priority live pitch slot at Demo Day ($10,000 Pool)",
        "Verified Github Codebase & Portfolio Audit",
        "Direct referrals to 5+ hiring partner companies",
      ],
    },
    {
      id: "executive-placement",
      name: "Executive Placement",
      tagline: "Guaranteed Hiring Partner Interviews & VIP Coaching",
      price: "$999",
      period: "All-Inclusive VIP Placement Track",
      color: "#e4d406",
      highlight: false,
      ctaLabel: "Enroll in Executive Track",
      ctaHref: "/courses/bootcamp-summer-2026/checkout?tier=executive-placement",
      features: [
        "Everything in Immersive Pro, plus:",
        "Guaranteed interviews with at least 3 hiring partners",
        "Weekly 1-on-1 Executive Career & Mock Interview Coaching",
        "Direct access to Venture Capitalists during Demo Day",
        "Lifetime PalmTechnIQ Pro Alumni Network Membership",
        "100% Tuition Refund Guarantee if not placed within 6 mos",
      ],
    },
  ];

  return (
    <section id="pricing" className="w-full py-24 bg-[#000000] relative overflow-hidden">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,#27ba55_1px,transparent_1px),linear-gradient(to_bottom,#27ba55_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00343d] border border-[#27ba55]/50 text-[#27ba55] text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(39,186,85,0.25)]">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Transparent Enrollment Tiers</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-6">
            INVEST IN YOUR <span className="text-[#e4d406]">ENGINEERING CONVICTION</span>
          </h2>
          <p className="text-base sm:text-lg font-semibold text-white/70 max-w-2xl">
            No hidden income share agreements. Transparent upfront tuition with scholarship options for high-merit builders.
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
                tier.highlight
                  ? "bg-[#00343d] border-2 border-[#27ba55] shadow-[0_0_50px_rgba(39,186,85,0.3)] lg:-translate-y-4"
                  : "bg-[#00343d]/40 border border-white/10 hover:border-white/30"
              }`}
            >
              {tier.highlight && tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#27ba55] text-black font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_#27ba55]">
                  {tier.badge}
                </div>
              )}

              <div>
                {/* Header */}
                <div className="mb-6">
                  <h3
                    className="text-2xl font-black uppercase tracking-tight mb-1"
                    style={{ color: tier.color }}
                  >
                    {tier.name}
                  </h3>
                  <p className="text-xs font-semibold text-white/70 min-h-[32px]">
                    {tier.tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-8 pb-6 border-b border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white font-mono">
                      {tier.price}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider block mt-1">
                    {tier.period}
                  </span>
                </div>

                {/* Feature List */}
                <ul className="flex flex-col gap-4 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm font-semibold text-white/85">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${tier.color}25`, color: tier.color }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <Link
                href={tier.ctaHref}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                  tier.highlight
                    ? "bg-[#27ba55] text-black shadow-[0_0_25px_rgba(39,186,85,0.5)] hover:shadow-[0_0_40px_rgba(39,186,85,0.8)] hover:scale-[1.02]"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                }`}
              >
                <span>{tier.ctaLabel}</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
