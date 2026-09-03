"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ShieldCheck,
  ShieldX,
  Award,
  Heart,
  Calendar,
  User,
  BookOpen,
  GraduationCap,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Share2,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";

type CertificateType = "program" | "course" | "volunteer" | "general";

interface VerifiedCertificate {
  certificateId: string;
  certCode?: string;
  title: string;
  studentName: string;
  volunteerName?: string;
  programName?: string | null;
  cohortName?: string | null;
  courseName?: string | null;
  courseSlug?: string | null;
  eventName?: string | null;
  role?: string | null;
  description: string | null;
  grade?: string | null;
  score?: number | null;
  issuedAt: string;
  isRevoked: boolean;
  revocationReason?: string | null;
  certificateUrl: string;
  holderImage?: string | null;
  issuedByName?: string | null;
}

interface VerifyResult {
  valid: boolean;
  type: CertificateType;
  certificate: VerifiedCertificate;
}

export default function VerifyCertificatePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <VerifyCertificatePage />
    </Suspense>
  );
}

function VerifyCertificatePage() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const verifyCode = useCallback(async (codeToVerify: string) => {
    const trimmed = codeToVerify.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/certificates/verify?code=${encodeURIComponent(trimmed)}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Certificate not found");
        return;
      }

      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const urlCode = searchParams?.get("code");
    if (urlCode) {
      setCode(urlCode);
      verifyCode(urlCode);
    }
  }, [searchParams, verifyCode]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    verifyCode(code);
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success("Credential ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = (id: string) => {
    const shareUrl = `${window.location.origin}/verify-certificate?code=${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Verification link copied to clipboard!");
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
            className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-blue/10 border border-neon-blue/20 mb-6">
              <ShieldCheck className="w-4 h-4 text-neon-blue" />
              <span className="text-sm text-neon-blue font-medium">
                Official Credential Verification
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Verify a</span>{" "}
              <span className="text-gradient">Certificate</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Enter the unique Credential ID to instantly verify authenticity. Validates Professional Program, Course, and Volunteer certifications issued by PalmTechnIQ.
            </p>

            {/* Search form */}
            <form
              onSubmit={handleVerify}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <Input
                placeholder="e.g. PTQ-PRG-2026-9F3K8A or PTV-2026-P0X8"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="glass-card border-white/20 focus:border-neon-blue/50 text-white placeholder:text-gray-400 h-12 uppercase font-mono"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading || !code.trim()}
                className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white h-12 px-6">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="ml-2">Verify</span>
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Result Section */}
      <section className="relative pb-24">
        <div className="container mx-auto px-6 max-w-2xl">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}>
                <Card className="glass-card border-red-500/30 p-8 text-center">
                  <ShieldX className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Verification Not Found
                  </h2>
                  <p className="text-gray-400 text-sm">{error}</p>
                </Card>
              </motion.div>
            )}

            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}>
                <Card className="glass-card border-white/10 overflow-hidden shadow-2xl">
                  {/* Status banner */}
                  <div
                    className={`px-6 py-4 flex items-center justify-between gap-3 ${
                      result.valid
                        ? "bg-emerald-500/10 border-b border-emerald-500/20"
                        : "bg-red-500/10 border-b border-red-500/20"
                    }`}>
                    <div className="flex items-center gap-3">
                      {result.valid ? (
                        <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
                      ) : (
                        <ShieldX className="w-7 h-7 text-red-400 shrink-0" />
                      )}
                      <div>
                        <p
                          className={`font-bold text-base ${
                            result.valid ? "text-emerald-400" : "text-red-400"
                          }`}>
                          {result.valid
                            ? "Verified Authentic Certificate"
                            : "Certificate Revoked"}
                        </p>
                        <p className="text-xs text-gray-300 mt-0.5">
                          {result.valid
                            ? "This credential has been officially verified by PalmTechnIQ."
                            : "This certificate has been revoked by administration and is no longer valid."}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShareLink(result.certificate.certificateId)}
                      className="text-gray-300 hover:text-white shrink-0 text-xs">
                      <Share2 className="w-3.5 h-3.5 mr-1" />
                      Share
                    </Button>
                  </div>

                  {/* Certificate details */}
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Category badge */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={`${
                          result.type === "program"
                            ? "border-neon-purple/40 text-neon-purple bg-neon-purple/10"
                            : result.type === "volunteer"
                            ? "border-pink-500/40 text-pink-400 bg-pink-500/10"
                            : "border-neon-blue/40 text-neon-blue bg-neon-blue/10"
                        } px-3 py-1 text-xs font-semibold`}>
                        {result.type === "program" ? (
                          <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
                        ) : result.type === "volunteer" ? (
                          <Heart className="w-3.5 h-3.5 mr-1.5" />
                        ) : (
                          <Award className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        {result.type === "program"
                          ? "Professional Program Certification"
                          : result.type === "volunteer"
                          ? "Volunteer Recognition"
                          : "Course Certificate of Completion"}
                      </Badge>

                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-black/40 border border-white/10 text-neon-blue">
                          {result.certificate.certificateId}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-white"
                          onClick={() => handleCopyId(result.certificate.certificateId)}
                          title="Copy Credential ID">
                          {copied ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Information Details */}
                    <div className="space-y-4 pt-2 border-t border-white/10">
                      <InfoRow
                        icon={User}
                        label="Recipient Name"
                        value={result.certificate.studentName || result.certificate.volunteerName || ""}
                      />

                      {result.certificate.programName && (
                        <InfoRow
                          icon={GraduationCap}
                          label="Program"
                          value={result.certificate.programName}
                        />
                      )}

                      {result.certificate.cohortName && (
                        <InfoRow
                          icon={Calendar}
                          label="Cohort / Cycle"
                          value={result.certificate.cohortName}
                        />
                      )}

                      {result.certificate.courseName && !result.certificate.programName && (
                        <InfoRow
                          icon={BookOpen}
                          label="Course / Event"
                          value={result.certificate.courseName}
                        />
                      )}

                      {result.certificate.title && (
                        <InfoRow
                          icon={Award}
                          label="Award Title"
                          value={result.certificate.title}
                        />
                      )}

                      {result.certificate.grade && (
                        <InfoRow
                          icon={FileCheck}
                          label="Final Grade"
                          value={result.certificate.grade}
                        />
                      )}

                      {result.certificate.description && (
                        <InfoRow
                          icon={AlertCircle}
                          label="Details / Commendation"
                          value={result.certificate.description}
                        />
                      )}

                      <InfoRow
                        icon={Calendar}
                        label="Issued On"
                        value={new Date(result.certificate.issuedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      />

                      <InfoRow
                        icon={ShieldCheck}
                        label="Credential ID"
                        value={result.certificate.certificateId}
                      />
                    </div>

                    {/* Prominent Certificate Document Download / View Button */}
                    {result.certificate.certificateUrl && result.certificate.certificateUrl.trim() && (
                      <div className="pt-4 border-t border-white/10">
                        <Button
                          asChild
                          className="w-full h-12 bg-gradient-to-r from-neon-blue via-cyan-500 to-neon-purple hover:opacity-90 text-white font-semibold text-sm shadow-lg shadow-neon-blue/20">
                          <a
                            href={result.certificate.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2">
                            <FileCheck className="w-5 h-5" />
                            <span>View / Download Original Certificate Document</span>
                            <ExternalLink className="w-4 h-4 ml-1" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {!result && !error && !loading && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-gray-500 space-y-4 py-8">
                <ShieldCheck className="w-12 h-12 mx-auto opacity-30 text-neon-blue" />
                <p className="text-sm">
                  Enter a credential code above (e.g. <span className="font-mono text-gray-400">PTQ-PRG-2026-9F3K8A</span>) to verify
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 shrink-0 mt-0.5">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
          {label}
        </p>
        <p className="text-white font-medium text-sm sm:text-base mt-0.5">{value}</p>
      </div>
    </div>
  );
}
