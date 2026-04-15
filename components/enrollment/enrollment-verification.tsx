"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { verifyEnrollmentPayment } from "@/actions/enrollment";
import { formatNaira } from "@/data/programs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Rocket,
  Calendar,
  BookOpen,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { trackPurchase } from "@/lib/fbpixel";

type VerificationState =
  | { status: "loading" }
  | { status: "success"; enrollment: any }
  | { status: "error"; message: string };

export function EnrollmentVerification() {
  const searchParams = useSearchParams();
  const reference = searchParams?.get("reference") ?? null;
  const [state, setState] = useState<VerificationState>({ status: "loading" });

  useEffect(() => {
    if (!reference) {
      setState({ status: "error", message: "No payment reference found" });
      return;
    }

    verifyEnrollmentPayment(reference)
      .then((result) => {
        if (result.success) {
          trackPurchase({
            content_name:
              result.enrollment?.program?.name ?? "Program Enrollment",
            content_type: "product",
            currency: "NGN",
            value: result.enrollment?.amountPaid ?? 0,
          });
          setState({ status: "success", enrollment: result.enrollment });
        } else {
          setState({
            status: "error",
            message: result.error || "Verification failed",
          });
        }
      })
      .catch((err) => {
        console.error("Enrollment verification error:", err);
        setState({
          status: "error",
          message: "An unexpected error occurred during verification",
        });
      });
  }, [reference]);

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6">
      {state.status === "loading" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20">
          <Loader2 className="w-12 h-12 text-neon-blue animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Verifying Your Payment
          </h2>
          <p className="text-gray-400">
            Please wait while we confirm your enrollment payment...
          </p>
        </motion.div>
      )}

      {state.status === "error" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Payment Verification Failed
          </h2>
          <p className="text-gray-400 mb-6">{state.message}</p>
          <div className="flex gap-3 justify-center">
            <Link href="/enroll">
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300">
                Try Again
              </Button>
            </Link>
            <Link href="/contact">
              <Button className="bg-gradient-to-r from-neon-blue to-neon-purple">
                Contact Support
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {state.status === "success" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}>
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}>
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Enrollment Confirmed!
            </h2>
            <p className="text-gray-400">
              Welcome to PalmTechnIQ. Your career pipeline starts now.
            </p>
          </div>

          <Card className="bg-gray-900/60 border-gray-800">
            <CardContent className="p-6 space-y-4">
              {state.enrollment?.program && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Program
                  </p>
                  <p className="font-semibold text-white">
                    {state.enrollment.program.name}
                  </p>
                </div>
              )}

              {state.enrollment?.cohort && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Cohort
                  </p>
                  <p className="font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neon-blue" />
                    {state.enrollment.cohort.displayName}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Status
                  </p>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mt-1">
                    {state.enrollment?.status === "FULLY_PAID"
                      ? "Fully Paid"
                      : "First Installment Paid"}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Amount Paid
                  </p>
                  <p className="text-lg font-bold text-neon-blue">
                    {formatNaira(state.enrollment?.amountPaid || 0)}
                  </p>
                </div>
              </div>

              {state.enrollment?.status === "FIRST_INSTALLMENT_PAID" && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-300">
                  <p>
                    Your 2nd installment of{" "}
                    <span className="font-semibold">
                      {formatNaira(
                        state.enrollment.totalAmount -
                          state.enrollment.amountPaid,
                      )}
                    </span>{" "}
                    is due in 2 weeks. We&apos;ll send you a reminder.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-400 bg-gray-900/40 rounded-lg p-3 border border-gray-800">
              <Mail className="w-4 h-4 text-neon-blue flex-shrink-0" />
              <span>
                A confirmation email has been sent to{" "}
                <span className="text-white">{state.enrollment?.email}</span>{" "}
                with your enrollment details and next steps.
              </span>
            </div>

            <div className="flex gap-3 justify-center pt-4">
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300">
                  Back to Home
                </Button>
              </Link>
              <Link href="/courses">
                <Button className="bg-gradient-to-r from-neon-blue to-neon-purple">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Explore Courses
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
