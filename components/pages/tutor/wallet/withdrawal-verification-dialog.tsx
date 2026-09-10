"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  ShieldCheck,
  Smartphone,
  Mail,
  Loader2,
  Building2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  requestWithdrawal,
  sendWithdrawalAuthorizationOtp,
} from "@/actions/withdrawal";
import { TwoFactorMethod } from "@/actions/account-security";

interface WithdrawalVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  twoFactorMethod: TwoFactorMethod | null;
  userEmail?: string;
  bankName?: string | null;
  accountNumber?: string | null;
  onSuccess: () => void;
}

export function WithdrawalVerificationDialog({
  open,
  onOpenChange,
  amount,
  twoFactorMethod,
  userEmail,
  bankName,
  accountNumber,
  onSuccess,
}: WithdrawalVerificationDialogProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);

  // Auto-dispatch email code when dialog opens and method is EMAIL
  useEffect(() => {
    if (open && twoFactorMethod === "EMAIL" && !emailSent && resendCooldown === 0) {
      handleSendEmailCode();
    }
  }, [open, twoFactorMethod]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendEmailCode = async () => {
    if (resendCooldown > 0 || isSendingEmail) return;
    setIsSendingEmail(true);
    try {
      const res = await sendWithdrawalAuthorizationOtp(amount);
      if (!res.success) {
        toast.error(res.error || "Failed to send authorization code.");
      } else {
        toast.success(res.message || "Authorization code sent to your email.");
        setEmailSent(true);
        setResendCooldown(60);
      }
    } catch {
      toast.error("Failed to deliver verification code.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleAuthorize = async () => {
    if (code.trim().length !== 6) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestWithdrawal(amount, code.trim());
      if ("error" in res && res.error) {
        toast.error(res.error);
        setCode("");
      } else {
        toast.success("Withdrawal request authorized and submitted successfully!");
        onOpenChange(false);
        setCode("");
        onSuccess();
      }
    } catch {
      toast.error("Failed to authorize withdrawal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setCode("");
      setEmailSent(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[460px] bg-[#090d16] border-white/10 text-white shadow-2xl backdrop-blur-xl">
        <DialogHeader className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold text-white tracking-tight">
            Authorize Withdrawal
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm leading-relaxed">
            Please enter your Two-Factor Authentication code to confirm this payout request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Payout Summary Box */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Amount to Withdraw:</span>
              <strong className="text-emerald-400 text-base">{formattedAmount}</strong>
            </div>
            {bankName && (
              <div className="flex items-center justify-between text-xs text-gray-300 pt-1 border-t border-white/5">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Building2 className="w-3.5 h-3.5 text-neon-blue" />
                  Payout Bank:
                </span>
                <span>
                  {bankName} {accountNumber ? `(•••• ${accountNumber.slice(-4)})` : ""}
                </span>
              </div>
            )}
          </div>

          {/* Verification Method Instruction */}
          {twoFactorMethod === "EMAIL" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neon-blue" />
                  Code sent to {userEmail || "your email"}
                </span>
                <button
                  type="button"
                  onClick={handleSendEmailCode}
                  disabled={resendCooldown > 0 || isSendingEmail}
                  className="text-neon-blue hover:underline disabled:text-gray-500 disabled:no-underline"
                >
                  {isSendingEmail
                    ? "Sending..."
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend Code"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Smartphone className="w-3.5 h-3.5 text-neon-blue shrink-0" />
              <span>
                Enter the 6-digit code from your Authenticator app (e.g. Google Authenticator):
              </span>
            </div>
          )}

          {/* 6-Digit OTP Slot Input */}
          <div className="flex justify-center py-2">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className="bg-white/5 border-white/20 text-white h-11 w-10 text-lg" />
                <InputOTPSlot index={1} className="bg-white/5 border-white/20 text-white h-11 w-10 text-lg" />
                <InputOTPSlot index={2} className="bg-white/5 border-white/20 text-white h-11 w-10 text-lg" />
                <InputOTPSlot index={3} className="bg-white/5 border-white/20 text-white h-11 w-10 text-lg" />
                <InputOTPSlot index={4} className="bg-white/5 border-white/20 text-white h-11 w-10 text-lg" />
                <InputOTPSlot index={5} className="bg-white/5 border-white/20 text-white h-11 w-10 text-lg" />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
            className="border-white/10 text-gray-300 hover:bg-white/5 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAuthorize}
            disabled={code.length !== 6 || isSubmitting}
            className="bg-gradient-to-r from-neon-green to-emerald-500 hover:opacity-90 text-white font-medium shadow-md shadow-emerald-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Authorizing...
              </>
            ) : (
              "Authorize & Withdraw"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
