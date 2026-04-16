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
  Loader2,
  AlertCircle,
} from "lucide-react";

type CertificateType = "course" | "volunteer";

interface CourseCertificate {
  certificateId: string;
  title: string;
  studentName: string;
  courseName: string;
  courseSlug: string;
  description: string | null;
  issuedAt: string;
  isRevoked: boolean;
  certificateUrl: string;
  holderImage: string | null;
}

interface VolunteerCertificate {
  certCode: string;
  volunteerName: string;
  eventName: string;
  role: string | null;
  description: string | null;
  issuedAt: string;
  isRevoked: boolean;
  certificateUrl: string;
}

interface VerifyResult {
  valid: boolean;
  type: CertificateType;
  certificate: CourseCertificate | VolunteerCertificate;
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
    const urlCode = searchParams.get("code");
    if (urlCode) {
      setCode(urlCode);
      verifyCode(urlCode);
    }
  }, [searchParams, verifyCode]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    verifyCode(code);
  }

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
                Certificate Verification
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Verify a</span>{" "}
              <span className="text-gradient">Certificate</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Enter the certificate ID or code to verify its authenticity. Works
              for both course completion and volunteer certificates.
            </p>

            {/* Search form */}
            <form
              onSubmit={handleVerify}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <Input
                placeholder="e.g. PTV-2025-P0X8 or certificate ID"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="glass-card border-white/20 focus:border-neon-blue/50 text-white placeholder:text-gray-400 h-12"
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

      {/* Result */}
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
                    Verification Failed
                  </h2>
                  <p className="text-gray-400">{error}</p>
                </Card>
              </motion.div>
            )}

            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}>
                <Card className="glass-card border-white/10 overflow-hidden">
                  {/* Status banner */}
                  <div
                    className={`px-6 py-4 flex items-center gap-3 ${
                      result.valid
                        ? "bg-green-500/10 border-b border-green-500/20"
                        : "bg-red-500/10 border-b border-red-500/20"
                    }`}>
                    {result.valid ? (
                      <ShieldCheck className="w-6 h-6 text-green-400" />
                    ) : (
                      <ShieldX className="w-6 h-6 text-red-400" />
                    )}
                    <div>
                      <p
                        className={`font-semibold ${
                          result.valid ? "text-green-400" : "text-red-400"
                        }`}>
                        {result.valid
                          ? "Valid Certificate"
                          : "Certificate Revoked"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {result.valid
                          ? "This certificate is authentic and verified by PalmTechnIQ."
                          : "This certificate has been revoked and is no longer valid."}
                      </p>
                    </div>
                  </div>

                  {/* Certificate details */}
                  <div className="p-6 space-y-5">
                    {/* Type badge */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`${
                          result.type === "volunteer"
                            ? "border-neon-purple/40 text-neon-purple"
                            : "border-neon-blue/40 text-neon-blue"
                        }`}>
                        {result.type === "volunteer" ? (
                          <Heart className="w-3 h-3 mr-1" />
                        ) : (
                          <Award className="w-3 h-3 mr-1" />
                        )}
                        {result.type === "volunteer"
                          ? "Volunteer Certificate"
                          : "Certificate of Completion"}
                      </Badge>
                    </div>

                    {result.type === "course" ? (
                      <CourseCertDetails
                        cert={result.certificate as CourseCertificate}
                      />
                    ) : (
                      <VolunteerCertDetails
                        cert={result.certificate as VolunteerCertificate}
                      />
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
                className="text-center text-gray-500 space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto opacity-30" />
                <p className="text-sm">
                  Enter a certificate code above to verify
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

function CourseCertDetails({ cert }: { cert: CourseCertificate }) {
  return (
    <div className="space-y-4">
      <InfoRow icon={User} label="Student Name" value={cert.studentName} />
      <InfoRow icon={BookOpen} label="Course" value={cert.courseName} />
      {cert.title && <InfoRow icon={Award} label="Title" value={cert.title} />}
      {cert.description && (
        <InfoRow
          icon={AlertCircle}
          label="Description"
          value={cert.description}
        />
      )}
      <InfoRow
        icon={Calendar}
        label="Issued On"
        value={new Date(cert.issuedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />
      <InfoRow
        icon={ShieldCheck}
        label="Certificate ID"
        value={cert.certificateId}
      />
    </div>
  );
}

function VolunteerCertDetails({ cert }: { cert: VolunteerCertificate }) {
  return (
    <div className="space-y-4">
      <InfoRow icon={User} label="Volunteer Name" value={cert.volunteerName} />
      <InfoRow icon={Award} label="Event" value={cert.eventName} />
      {cert.role && <InfoRow icon={Heart} label="Role" value={cert.role} />}
      {cert.description && (
        <InfoRow
          icon={AlertCircle}
          label="Description"
          value={cert.description}
        />
      )}
      <InfoRow
        icon={Calendar}
        label="Issued On"
        value={new Date(cert.issuedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />
      <InfoRow icon={ShieldCheck} label="Cert Code" value={cert.certCode} />
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
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-500">
          {label}
        </p>
        <p className="text-white font-medium">{value}</p>
      </div>
    </div>
  );
}
