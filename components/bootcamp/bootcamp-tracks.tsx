"use client";

import React, { useState } from "react";
import { Brain, Code, Palette, Cloud, Database, Shield, Smartphone, Briefcase, ArrowRight } from "lucide-react";

const TRACKS = [
  {
    id: "ai-llm",
    title: "AI & Large Language Model Engineering",
    badge: "MOST IN-DEMAND",
    badgeColor: "#e4d406",
    icon: Brain,
    description:
      "Master vector databases, RAG architectures, LangChain, fine-tuning Llama 3 & Gemini models, and deploying enterprise agentic workflows.",
    skills: ["PyTorch", "RAG & Vector DBs", "LangChain / LlamaIndex", "Agentic Systems", "FastAPI Deployment"],
    duration: "12 Weeks Intensive",
  },
  {
    id: "fullstack",
    title: "Full-Stack Systems Architecture",
    badge: "CORE BUILDER TRACK",
    badgeColor: "#27ba55",
    icon: Code,
    description:
      "Build scalable distributed systems from scratch using Next.js 15, TypeScript, Node.js, Prisma, PostgreSQL, and event-driven microservices.",
    skills: ["Next.js 15 App Router", "TypeScript Strict", "PostgreSQL & Prisma", "Microservices", "Docker & CI/CD"],
    duration: "12 Weeks Intensive",
  },
  {
    id: "uiux",
    title: "Product UI/UX & Maximalist Design",
    badge: "CREATIVE CRUCIBLE",
    badgeColor: "#84c8d4",
    icon: Palette,
    description:
      "Design high-conversion, Moonshot-inspired digital experiences. Master Figma token systems, GSAP interactive motion, and design engineering.",
    skills: ["Figma Design Systems", "GSAP 60fps Motion", "User Research & Testing", "Maximalist Aesthetics", "Design Engineering"],
    duration: "12 Weeks Intensive",
  },
  {
    id: "cloud-devops",
    title: "Cloud Infrastructure & DevOps",
    badge: "INFRASTRUCTURE",
    badgeColor: "#27ba55",
    icon: Cloud,
    description:
      "Architect zero-downtime multi-cloud infrastructure. Master Kubernetes, Terraform, AWS/GCP cloud native patterns, and GitOps pipelines.",
    skills: ["Kubernetes & Docker", "Terraform & IaC", "AWS & GCP Architecture", "Prometheus Monitoring", "Zero-Trust Security"],
    duration: "12 Weeks Intensive",
  },
  {
    id: "data-science",
    title: "Data Science & Predictive ML",
    badge: "ANALYTICS POWERHOUSE",
    badgeColor: "#e4d406",
    icon: Database,
    description:
      "Turn raw data into high-conviction business intelligence. Master predictive modeling, deep learning pipelines, and big data processing.",
    skills: ["Python & Pandas", "Predictive ML Models", "Apache Spark & BigQuery", "Deep Learning", "Data Visualization"],
    duration: "12 Weeks Intensive",
  },
  {
    id: "cybersecurity",
    title: "Enterprise Cybersecurity & Zero-Trust",
    badge: "DEFENSE GRID",
    badgeColor: "#800000",
    icon: Shield,
    description:
      "Protect critical national and enterprise infrastructure. Master ethical hacking, penetration testing, SOC monitoring, and zero-trust protocols.",
    skills: ["Penetration Testing", "Network Defense & SOC", "Zero-Trust Architecture", "Cryptography", "Incident Response"],
    duration: "12 Weeks Intensive",
  },
  {
    id: "mobile-app",
    title: "Mobile Engineering (React Native & Flutter)",
    badge: "CROSS-PLATFORM",
    badgeColor: "#84c8d4",
    icon: Smartphone,
    description:
      "Build native iOS and Android applications with fluid animations, offline-first SQLite synchronization, and native device integrations.",
    skills: ["React Native & Expo", "Flutter & Dart", "Offline-First Sync", "Native Bridge API", "App Store Optimization"],
    duration: "12 Weeks Intensive",
  },
  {
    id: "product-mgmt",
    title: "Technical Product Management & Agile",
    badge: "LEADERSHIP TRACK",
    badgeColor: "#27ba55",
    icon: Briefcase,
    description:
      "Lead cross-functional engineering teams to deliver moonshot products. Master roadmap strategy, user telemetry, and technical specifications.",
    skills: ["Product Specs & PRDs", "Agile & Scrum Leadership", "User Telemetry & KPIs", "Go-To-Market Strategy", "Stakeholder Alignment"],
    duration: "12 Weeks Intensive",
  },
];

export function BootcampTracks() {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  return (
    <section id="tracks" className="w-full py-24 bg-[#001418] relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00343d]/30 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00343d] border border-[#84c8d4]/40 text-[#84c8d4] text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(132,200,212,0.2)]">
            <span>Specialized Engineering Paths</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-6">
            8 INTENSIVE <span className="text-[#27ba55]">CRUCIBLE TRACKS</span>
          </h2>
          <p className="text-base sm:text-lg font-semibold text-white/70 max-w-2xl">
            Choose your specialization. Every track is built around shipping real production software, code reviews by industry veterans, and competing in our $10,000 Demo Day Battlefield.
          </p>
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRACKS.map((track) => {
            const IconComponent = track.icon;
            const isSelected = selectedTrack === track.id;

            return (
              <div
                key={track.id}
                onClick={() => setSelectedTrack(isSelected ? null : track.id)}
                className={`group relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 cursor-pointer border ${
                  isSelected
                    ? "bg-[#00343d] border-[#27ba55] shadow-[0_0_30px_rgba(39,186,85,0.3)] scale-[1.02]"
                    : "bg-[#00343d]/40 border-white/10 hover:border-[#84c8d4]/50 hover:bg-[#00343d]/60 shadow-lg"
                }`}
              >
                <div>
                  {/* Card Header & Badge */}
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:text-[#27ba55] transition-all">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span
                      className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest"
                      style={{
                        backgroundColor: `${track.badgeColor}20`,
                        color: track.badgeColor,
                        border: `1px solid ${track.badgeColor}50`,
                      }}
                    >
                      {track.badge}
                    </span>
                  </div>

                  {/* Track Title */}
                  <h3 className="text-xl font-black text-white tracking-tight leading-snug mb-3 group-hover:text-[#27ba55] transition-colors">
                    {track.title}
                  </h3>

                  {/* Track Description */}
                  <p className="text-xs font-medium text-white/70 leading-relaxed mb-6">
                    {track.description}
                  </p>
                </div>

                <div>
                  {/* Skills Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6 pt-4 border-t border-white/10">
                    {track.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] font-bold bg-black/40 text-[#84c8d4] px-2 py-0.5 rounded-md uppercase tracking-wider"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Bottom Action */}
                  <div className="flex items-center justify-between text-xs font-black tracking-widest uppercase pt-2">
                    <span className="text-white/50">{track.duration}</span>
                    <a
                      href="#pricing"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[#27ba55] hover:underline"
                    >
                      <span>Enroll</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
