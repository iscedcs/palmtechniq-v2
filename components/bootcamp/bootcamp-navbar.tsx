"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Menu, X, ArrowRight } from "lucide-react";

export function BootcampNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Why Attend", href: "#why-attend" },
    { label: "8 Intensive Tracks", href: "#tracks" },
    { label: "Demo Day Battlefield", href: "#battlefield" },
    { label: "Mentors", href: "#mentors" },
    { label: "Tuition & Tiers", href: "#pricing" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[#00343d]/85 border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Tag */}
        <Link href="/bootcamp" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#27ba55] flex items-center justify-center shadow-[0_0_20px_rgba(39,186,85,0.4)] group-hover:scale-105 transition-transform">
            <span className="text-black font-black text-xl tracking-tighter">P</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white text-xl tracking-tight uppercase">
                PalmTechnIQ
              </span>
              <span className="bg-[#e4d406] text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                Summer &apos;26
              </span>
            </div>
            <span className="text-xs font-semibold text-[#84c8d4] tracking-widest uppercase">
              Paid Immersive Bootcamp
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-bold text-white/80 hover:text-[#27ba55] transition-colors uppercase tracking-wider text-xs"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA & AI Advisor */}
        <div className="hidden lg:flex items-center gap-4">
          <Link
            href="/bootcamp#ai-advisor"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#84c8d4]/15 border border-[#84c8d4]/40 text-[#84c8d4] hover:bg-[#84c8d4]/25 transition-all text-xs font-black tracking-wider uppercase shadow-[0_0_15px_rgba(132,200,212,0.2)]"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Advisor</span>
          </Link>

          <Link
            href="/bootcamp#pricing"
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#27ba55] text-black font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(39,186,85,0.5)] hover:shadow-[0_0_35px_rgba(39,186,85,0.8)] hover:scale-105 active:scale-95 transition-all"
          >
            <span>Secure Seat</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:text-[#27ba55]"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-4 pb-6 bg-[#00343d] border-b border-white/10 flex flex-col gap-4 animate-in slide-in-from-top-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-white hover:text-[#27ba55] py-2 border-b border-white/5 uppercase tracking-wider"
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/bootcamp#ai-advisor"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#84c8d4]/20 border border-[#84c8d4]/40 text-[#84c8d4] font-black text-xs uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4" />
              <span>Talk to AI Bootcamp Advisor</span>
            </Link>
            <Link
              href="/bootcamp#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#27ba55] text-black font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(39,186,85,0.4)]"
            >
              <span>Secure Your Seat Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
