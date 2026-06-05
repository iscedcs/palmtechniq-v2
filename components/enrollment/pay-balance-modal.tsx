"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { initiateBalancePayment, verifyAndCompleteBalancePayment } from "@/actions/program-balance-payment";
import { useRouter, useSearchParams } from "next/navigation";
import { NairaSign } from "@/components/shared/naira-sign-icon";

interface PayBalanceModalProps {
  enrollmentId: string;
  programName: string;
  balanceAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentStatus = "idle" | "initiating" | "success" | "error";

export default function PayBalanceModal({
  enrollmentId,
  programName,
  balanceAmount,
  onClose,
  onSuccess,
}: PayBalanceModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  React.useEffect(() => {
    const reference = searchParams?.get("reference");
    if (reference && enrollmentId) {
      handlePaymentVerification(reference);
    }
  }, [searchParams, enrollmentId]);

  const handlePaymentVerification = async (reference: string) => {
    setIsCheckingVerification(true);
    try {
      const result = await verifyAndCompleteBalancePayment(reference, enrollmentId);

      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          onSuccess();
          router.push("/student/programs");
        }, 2000);
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Payment verification failed");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("An unexpected error occurred");
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleInitiatePayment = async () => {
    setStatus("initiating");
    setErrorMessage("");

    try {
      const result = await initiateBalancePayment(enrollmentId);

      if (result.success && result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Failed to initiate payment");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("An unexpected error occurred");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-card border-white/10 bg-slate-950/95 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Remaining Balance</DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            Complete your payment for {programName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {(status === "idle" || status === "initiating") && (
            <>
              <div className="space-y-2 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-sm text-gray-400">Program</p>
                <p className="font-semibold text-white">{programName}</p>
              </div>

              <div className="space-y-2 rounded-3xl border border-sky-500/20 bg-sky-500/10 p-4">
                <p className="text-sm font-medium text-sky-200">Amount to Pay</p>
                <p className="text-3xl font-bold text-white">
                  <NairaSign className="text-base" />
                  {balanceAmount.toLocaleString("en-NG")}
                </p>
              </div>

              <div className="space-y-2 rounded-3xl border border-white/10 bg-slate-900/80 p-3 text-xs text-gray-400">
                <p className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                  <span>
                    You will be redirected to Paystack to complete the payment securely.
                  </span>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={status === "initiating"}
                  className="flex-1 border-white/10 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInitiatePayment}
                  disabled={status === "initiating"}
                  className="flex-1 bg-neon-blue text-white hover:bg-blue-500"
                >
                  {status === "initiating" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Pay Now"
                  )}
                </Button>
              </div>
            </>
          )}

          {status === "success" && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-emerald-500/10 p-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-white">Payment Successful!</p>
                <p className="text-sm text-gray-400">
                  Your balance payment of <NairaSign className="text-base" />
                  {balanceAmount.toLocaleString("en-NG")} has been received.
                  You will be redirected back to the program page.
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
                <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <div>
                  <p className="font-semibold text-white">Payment Failed</p>
                  <p className="mt-1 text-sm text-red-200">{errorMessage}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-white/10 text-white hover:bg-white/10"
                >
                  Close
                </Button>
                <Button
                  onClick={handleInitiatePayment}
                  className="flex-1 bg-neon-blue text-white hover:bg-blue-500"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {isCheckingVerification && (
            <div className="flex flex-col items-center justify-center space-y-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
              <p className="text-sm text-gray-400">Verifying your payment...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
