"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { StudentAchievementsData } from "@/data/studentprogress";
import { motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  File as Fire,
  Search,
  Target,
  Trophy,
  Zap,
  Award,
  FileCheck,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  Zap,
  Fire,
  Trophy,
  Brain,
  Target,
  BookOpen,
};

const RARITY_STYLES: Record<string, string> = {
  Common: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  Uncommon: "bg-green-500/20 text-green-400 border-green-500/30",
  Rare: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Epic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const TYPE_FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Lessons", value: "LESSON_COMPLETED" },
  { label: "Quizzes", value: "QUIZ_PASSED" },
  { label: "Courses", value: "COURSE_COMPLETED" },
  { label: "Skills", value: "SKILL_MASTERED" },
];

type Props = StudentAchievementsData;

export default function AchievementsClient({
  achievements,
  certificates = [],
  summary,
  userName,
}: Props) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Credential ID copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = useMemo(() => {
    return achievements.filter((a: any) => {
      const matchesType = activeFilter === "ALL" || a.type === activeFilter;
      const matchesSearch =
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [achievements, search, activeFilter]);

  const summaryCards = [
    {
      label: "Total Earned",
      value: summary.total,
      color: "from-yellow-400 to-orange-500",
      Icon: Trophy,
    },
    {
      label: "Courses Done",
      value: summary.coursesCompleted,
      color: "from-purple-500 to-indigo-500",
      Icon: BookOpen,
    },
    {
      label: "Current Streak",
      value: `${summary.streak}d`,
      color: "from-orange-400 to-red-500",
      Icon: Fire,
    },
    {
      label: "Total XP",
      value: summary.totalPoints,
      color: "from-neon-blue to-neon-purple",
      Icon: Zap,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container mx-auto px-6 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-white">
                {userName.split(" ")[0]}&apos;s
              </span>{" "}
              <span className="text-gradient">Achievements</span>
            </h1>
            <p className="text-xl text-gray-300">
              Every milestone tells your story
            </p>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {summaryCards.map(({ label, value, color, Icon }) => (
              <Card key={label} className="glass-card border-white/10">
                <CardContent className="p-5 flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Earned Certificates Section */}
          {certificates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="mb-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-neon-purple" />
                  <h3 className="text-lg font-bold text-white">
                    Official Certificates &amp; Credentials
                  </h3>
                </div>
                <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/40">
                  {certificates.length} Verified
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((cert: any) => {
                  const isCopied = copiedId === cert.credentialId;
                  const hasUrl = Boolean(cert.certificateUrl && cert.certificateUrl.trim());

                  return (
                    <Card
                      key={cert.id}
                      className="glass-card border-neon-purple/30 bg-neon-purple/5 hover:border-neon-purple/50 transition-all overflow-hidden">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className="border-neon-purple/40 text-neon-purple bg-neon-purple/10 text-[10px]">
                                {cert.programName ? "Program" : "Course"}
                              </Badge>
                              {cert.grade && (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px]">
                                  {cert.grade}
                                </Badge>
                              )}
                            </div>
                            <h4 className="text-white font-semibold text-base leading-snug">
                              {cert.title}
                            </h4>
                            {(cert.programName || cert.courseName) && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {cert.programName || cert.courseName}
                                {cert.cohortName ? ` · ${cert.cohortName}` : ""}
                              </p>
                            )}
                          </div>

                          <div className="p-2.5 rounded-xl bg-neon-purple/20 border border-neon-purple/40 shrink-0">
                            <Award className="w-6 h-6 text-neon-purple" />
                          </div>
                        </div>

                        {/* Credential ID row */}
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/10">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                              Credential ID
                            </p>
                            <code className="text-xs font-mono font-semibold text-neon-blue">
                              {cert.credentialId}
                            </code>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyId(cert.credentialId)}
                            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                            title="Copy Credential ID">
                            {isCopied ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          {hasUrl ? (
                            <Button
                              asChild
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white text-xs h-9">
                              <a
                                href={cert.certificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5">
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>Download / View</span>
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                              </a>
                            </Button>
                          ) : null}

                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-gray-300 hover:text-white text-xs h-9">
                            <Link
                              href={`/verify-certificate?code=${encodeURIComponent(
                                cert.credentialId,
                              )}`}
                              target="_blank">
                              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-neon-blue" />
                              Verify
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Filters & Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search achievements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeFilter === f.value
                      ? "bg-neon-blue text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                  }`}>
                  {f.label}
                  {f.value !== "ALL" && (
                    <span className="ml-1 opacity-60">
                      ({summary.byType[f.value] ?? 0})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Achievements Grid */}
          {filtered.length === 0 ? (
            <Card className="glass-card border-white/10">
              <CardContent className="py-20 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-gray-400 text-lg">No achievements found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {search
                    ? "Try a different search term"
                    : "Complete lessons and courses to earn achievements!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((achievement: any, index: any) => {
                const IconComponent = iconMap[achievement.icon] || Trophy;
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.04 }}>
                    <Card className="glass-card border-white/10 hover:border-white/20 transition-colors h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-12 h-12 rounded-full bg-gradient-to-r ${achievement.color} flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="text-white font-semibold text-sm">
                                {achievement.title}
                              </h4>
                              <Badge
                                className={`text-xs border ${RARITY_STYLES[achievement.rarity] || RARITY_STYLES.Common}`}>
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-xs line-clamp-2">
                              {achievement.description}
                            </p>
                            <p className="text-xs text-green-400 mt-2">
                              {achievement.earned}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Streak Milestone progress (sidebar summary) */}
          {summary.longestStreak > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <Fire className="w-5 h-5 text-orange-400" />
                    Streak Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-8">
                  <div>
                    <p className="text-3xl font-bold text-white">
                      {summary.streak}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Current streak (days)
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">
                      {summary.longestStreak}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Longest streak (days)
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">
                      {summary.rank || "Novice"}
                    </p>
                    <p className="text-gray-400 text-sm">Current rank</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
