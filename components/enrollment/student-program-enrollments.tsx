"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ProgramEnrollmentCard, {
  ProgramEnrollmentData,
} from "./program-enrollment-card";
import {
  getStudentProgramEnrollments,
  verifyAndCompleteBalancePayment,
} from "@/actions/program-balance-payment";

export default function StudentProgramEnrollments() {
  const [enrollments, setEnrollments] = useState<ProgramEnrollmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "success" | "error">("idle");
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchEnrollments = async () => {
    try {
      setIsLoading(true);
      const result = await getStudentProgramEnrollments();

      if (result.success) {
        setEnrollments(result.enrollments || []);
      } else {
        setError(result.error || "Failed to load enrollments");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  useEffect(() => {
    const reference = searchParams?.get("reference");
    if (!reference) return;

    const verifyPayment = async () => {
      setVerificationStatus("idle");
      setVerificationMessage("Verifying payment...");

      const result = await verifyAndCompleteBalancePayment(reference);

      if (result.success) {
        setVerificationStatus("success");
        setVerificationMessage("Payment verified successfully. Your balance has been updated.");
        await fetchEnrollments();
        router.replace("/student/programs");
      } else {
        setVerificationStatus("error");
        setVerificationMessage(result.error || "Payment verification failed");
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handlePaymentSuccess = async () => {
    const result = await getStudentProgramEnrollments();
    if (result.success) {
      setEnrollments(result.enrollments || []);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BookOpen className="h-5 w-5 text-white" />
            My Program Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-neon-blue" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertCircle className="h-5 w-5 text-red-400" />
            My Program Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-200">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (enrollments.length === 0) {
    return (
      <Card className="glass-card border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BookOpen className="h-5 w-5 text-white" />
            My Program Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="font-medium text-white">No program enrollments yet</p>
              <p className="text-sm text-gray-400">
                Explore professional programs to get started.
              </p>
            </div>
            <Link href="/programs">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Explore Programs
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingBalance = enrollments.filter(
    (e) =>
      e.firstInstallmentPaid &&
      e.hasBalancePayment &&
      !e.balancePaid
  ).length;

  const fullyPaid = enrollments.filter((e) => e.remainingBalance === 0).length;

  return (
    <div className="space-y-6">
      {verificationMessage && (
        <Card
          className={`glass-card border-white/10 ${
            verificationStatus === "success"
              ? "bg-emerald-500/10"
              : verificationStatus === "error"
              ? "bg-red-500/10"
              : "bg-slate-950/70"
          }`}
        >
          <CardContent>
            <p
              className={`text-sm font-medium ${
                verificationStatus === "success"
                  ? "text-emerald-200"
                  : verificationStatus === "error"
                  ? "text-red-200"
                  : "text-gray-300"
              }`}
            >
              {verificationMessage}
            </p>
          </CardContent>
        </Card>
      )}
      <Card className="glass-card border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-white">
              <BookOpen className="h-5 w-5 text-white" />
              My Program Enrollments
            </span>
            <Badge className="bg-white/10 text-white border-white/10">
              {enrollments.length} Programs
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-center">
              <p className="text-3xl font-semibold text-white">{enrollments.length}</p>
              <p className="text-xs text-gray-400">Total Enrollments</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-center">
              <p className="text-3xl font-semibold text-emerald-400">{fullyPaid}</p>
              <p className="text-xs text-gray-400">Fully Paid</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-center">
              <p className="text-3xl font-semibold text-amber-300">{pendingBalance}</p>
              <p className="text-xs text-gray-400">Pending Balance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {enrollments.map((enrollment) => (
          <ProgramEnrollmentCard
            key={enrollment.id}
            enrollment={enrollment}
            onPaymentSuccess={handlePaymentSuccess}
          />
        ))}
      </div>

      {pendingBalance > 0 && (
        <Card className="glass-card border-white/10 bg-slate-950/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
              <div className="space-y-1">
                <p className="font-medium text-white">Pending balance payment</p>
                <p className="text-sm text-gray-400">
                  You have {pendingBalance} program{pendingBalance > 1 ? "s" : ""} with a balance payment pending.
                  Click "Pay Remaining Balance" to complete the payment and unlock your full program access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
