"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ShieldX,
  GraduationCap,
  Calendar,
  BookOpen,
  Trophy,
  Star,
  Loader2,
  User,
} from "lucide-react";
import Image from "next/image";

interface StudentVerifyResult {
  valid: boolean;
  student?: {
    name: string;
    image: string | null;
    memberSince: string;
    isActive: boolean;
    level: string;
    rank: string;
    coursesStarted: number;
    coursesCompleted: number;
    totalPoints: number;
    activeEnrollments: string[];
  };
  error?: string;
}

export default function VerifyStudentPage() {
  const params = useParams();
  const studentId = params?.id as string;

  const [result, setResult] = useState<StudentVerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;

    async function verify() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/students/verify?id=${encodeURIComponent(studentId)}`,
        );
        const data = await res.json();

        if (!res.ok) {
          setResult({ valid: false, error: data.error || "Student not found" });
        } else {
          setResult(data);
        }
      } catch {
        setResult({ valid: false, error: "Something went wrong. Please try again." });
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [studentId]);

  const levelLabel: Record<string, string> = {
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-10" />
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-blue/10 border border-neon-blue/20 mb-6">
              <GraduationCap className="w-4 h-4 text-neon-blue" />
              <span className="text-sm text-neon-blue font-medium">
                Student ID Verification
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Verify a</span>{" "}
              <span className="text-gradient">Student</span>
            </h1>
            <p className="text-lg text-gray-300">
              Confirming student enrollment and identity on PalmTechnIQ.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Result */}
      <section className="relative pb-24">
        <div className="container mx-auto px-6 max-w-2xl">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-12"
              >
                <Loader2 className="w-10 h-10 text-neon-blue animate-spin" />
                <p className="text-gray-400">Verifying student identity...</p>
              </motion.div>
            )}

            {!loading && result && !result.valid && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="glass-card border-red-500/30 p-8 text-center">
                  <ShieldX className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Verification Failed
                  </h2>
                  <p className="text-gray-400">
                    {result.error || "This student ID could not be verified."}
                  </p>
                </Card>
              </motion.div>
            )}

            {!loading && result?.valid && result.student && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="glass-card border-white/10 overflow-hidden">
                  {/* Status banner */}
                  <div
                    className={`px-6 py-4 flex items-center gap-3 ${
                      result.student.isActive
                        ? "bg-green-500/10 border-b border-green-500/20"
                        : "bg-yellow-500/10 border-b border-yellow-500/20"
                    }`}
                  >
                    <ShieldCheck
                      className={`w-6 h-6 ${
                        result.student.isActive
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    />
                    <div>
                      <p
                        className={`font-semibold ${
                          result.student.isActive
                            ? "text-green-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {result.student.isActive
                          ? "Verified Student"
                          : "Inactive Student"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {result.student.isActive
                          ? "This person is a verified and active student of PalmTechnIQ."
                          : "This student account is currently inactive."}
                      </p>
                    </div>
                  </div>

                  {/* Student details */}
                  <div className="p-6 space-y-6">
                    {/* Profile header */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-neon-blue/30 flex-shrink-0">
                        {result.student.image ? (
                          <Image
                            src={result.student.image}
                            alt={result.student.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-neon-blue/10 flex items-center justify-center">
                            <User className="w-8 h-8 text-neon-blue/50" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {result.student.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className="border-neon-blue/40 text-neon-blue"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            {result.student.rank}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-neon-purple/40 text-neon-purple"
                          >
                            {levelLabel[result.student.level] || result.student.level}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-card rounded-lg p-4 flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-neon-blue" />
                        <div>
                          <p className="text-xs text-gray-400">Member Since</p>
                          <p className="text-sm font-semibold text-white">
                            {new Date(result.student.memberSince).toLocaleDateString(
                              "en-US",
                              { month: "long", year: "numeric" },
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="glass-card rounded-lg p-4 flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-neon-purple" />
                        <div>
                          <p className="text-xs text-gray-400">Points</p>
                          <p className="text-sm font-semibold text-white">
                            {result.student.totalPoints.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="glass-card rounded-lg p-4 flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-xs text-gray-400">Courses Started</p>
                          <p className="text-sm font-semibold text-white">
                            {result.student.coursesStarted}
                          </p>
                        </div>
                      </div>

                      <div className="glass-card rounded-lg p-4 flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="text-xs text-gray-400">Completed</p>
                          <p className="text-sm font-semibold text-white">
                            {result.student.coursesCompleted}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Active enrollments */}
                    {result.student.activeEnrollments.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">
                          Currently Enrolled In
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.student.activeEnrollments.map((course) => (
                            <Badge
                              key={course}
                              variant="secondary"
                              className="bg-white/5 text-gray-300 border border-white/10"
                            >
                              {course}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Student ID */}
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-500 text-center">
                        Student ID: {studentId}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  );
}
