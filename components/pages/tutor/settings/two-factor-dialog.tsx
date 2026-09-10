"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateAuthenticatorSetup,
  verifyAndEnableAuthenticator,
  sendEmailTwoFactorOtp,
  verifyAndEnableEmailTwoFactor,
  disableTwoFactor,
  TwoFactorMethod,
} from "@/actions/account-security";

interface TwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabled: boolean;
  currentMethod: TwoFactorMethod | null;
  userEmail: string;
  onStatusChange?: (enabled: boolean, method: TwoFactorMethod | null) => void;
}

export function TwoFactorDialog({
  open,
  onOpenChange,
  enabled,
  currentMethod,
  userEmail,
  onStatusChange,
}: TwoFactorDialogProps) {
  const [activeTab, setActiveTab] = useState<TwoFactorMethod>("AUTHENTICATOR");
  const [authSetup, setAuthSetup] = useState<{
    secret: string;
    qrCodeDataUrl: string;
    otpauthUrl: string;
  } | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Email OTP state
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Verification & Disable submission state
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  // Load authenticator setup when dialog opens and 2FA is disabled
  useEffect(() => {
    if (open && !enabled && activeTab === "AUTHENTICATOR" && !authSetup) {
      loadAuthenticatorSetup();
    }
  }, [open, enabled, activeTab, authSetup]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const loadAuthenticatorSetup = async () => {
    setLoadingSetup(true);
    try {
      const res = await generateAuthenticatorSetup();
      if (!res.success) {
        toast.error(res.error);
      } else if (res.data) {
        setAuthSetup(res.data);
      }
    } catch {
      toast.error("Failed to generate authenticator setup. Please try again.");
    } finally {
      setLoadingSetup(false);
    }
  };

  const handleCopySecret = async () => {
    if (!authSetup?.secret) return;
    try {
      await navigator.clipboard.writeText(authSetup.secret);
      setCopiedSecret(true);
      toast.success("Secret key copied to clipboard.");
      setTimeout(() => setCopiedSecret(false), 2500);
    } catch {
      toast.error("Failed to copy secret.");
    }
  };

  const handleSendEmailOtp = async () => {
    if (resendCooldown > 0 || sendingEmail) return;
    setSendingEmail(true);
    try {
      const res = await sendEmailTwoFactorOtp();
      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Verification code sent to your email.");
        setEmailSent(true);
        setResendCooldown(60);
      }
    } catch {
      toast.error("Failed to send verification code. Please try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleVerifyAuthenticator = async () => {
    if (!authSetup?.secret || authenticatorCode.length !== 6) {
      toast.error("Please enter the 6-digit code from your authenticator app.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyAndEnableAuthenticator({
        secret: authSetup.secret,
        code: authenticatorCode,
      });

      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Authenticator 2FA enabled!");
        onStatusChange?.(true, "AUTHENTICATOR");
        onOpenChange(false);
        resetState();
      }
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (emailCode.length !== 6) {
      toast.error("Please enter the 6-digit code sent to your email.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyAndEnableEmailTwoFactor({
        code: emailCode,
      });

      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Email 2FA enabled!");
        onStatusChange?.(true, "EMAIL");
        onOpenChange(false);
        resetState();
      }
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    setIsDisabling(true);
    try {
      const res = await disableTwoFactor();
      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Two-Factor Authentication disabled.");
        onStatusChange?.(false, null);
        setConfirmDisable(false);
        onOpenChange(false);
        resetState();
      }
    } catch {
      toast.error("Failed to disable 2FA. Please try again.");
    } finally {
      setIsDisabling(false);
    }
  };

  const resetState = () => {
    setAuthSetup(null);
    setAuthenticatorCode("");
    setEmailCode("");
    setEmailSent(false);
    setConfirmDisable(false);
    setCopiedSecret(false);
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-[#090d16] border-white/10 text-white shadow-2xl backdrop-blur-xl no-scrollbar">
        <DialogHeader className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue mb-1">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold text-white tracking-tight">
            Two-Factor Authentication (2FA)
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm leading-relaxed">
            Protect your account with an extra verification layer each time you sign in.
          </DialogDescription>
        </DialogHeader>

        {enabled ? (
          /* ACTIVE 2FA MANAGEMENT VIEW */
          <div className="space-y-5 py-2">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  Two-Factor Authentication is Active
                </p>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  Your account is protected via{" "}
                  <strong className="text-white">
                    {currentMethod === "EMAIL"
                      ? "Email Verification Codes"
                      : "Authenticator App (TOTP)"}
                  </strong>
                  .
                </p>
              </div>
            </div>

            {confirmDisable ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-medium text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Are you sure you want to disable 2FA?
                </div>
                <p className="text-xs text-gray-300">
                  Disabling Two-Factor Authentication makes your account more vulnerable to unauthorized access.
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDisable(false)}
                    disabled={isDisabling}
                    className="border-white/10 text-gray-300 hover:bg-white/5 bg-transparent"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDisableTwoFactor}
                    disabled={isDisabling}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDisabling ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Disabling...
                      </>
                    ) : (
                      "Confirm Disable"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs text-gray-400">
                  Want to disable or change your security method?
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDisable(true)}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 bg-transparent text-xs shrink-0"
                >
                  Disable 2FA
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* SETUP VIEW WITH TABS */
          <div className="space-y-4 py-2">
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val as TwoFactorMethod);
                if (val === "AUTHENTICATOR" && !authSetup) {
                  loadAuthenticatorSetup();
                }
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 bg-white/5 border border-white/10 p-1">
                <TabsTrigger
                  value="AUTHENTICATOR"
                  className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue text-xs sm:text-sm font-medium flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Authenticator App
                </TabsTrigger>
                <TabsTrigger
                  value="EMAIL"
                  className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue text-xs sm:text-sm font-medium flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email OTP
                </TabsTrigger>
              </TabsList>

              {/* METHOD 1: AUTHENTICATOR APP */}
              <TabsContent value="AUTHENTICATOR" className="space-y-4 mt-4">
                {loadingSetup ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-neon-blue" />
                    <p className="text-xs">Generating secure TOTP key & QR code...</p>
                  </div>
                ) : authSetup ? (
                  <div className="space-y-4">
                    <div className="text-xs text-gray-300 leading-relaxed">
                      1. Scan this QR code in your authenticator app (e.g. Google Authenticator, 1Password, Authy):
                    </div>

                    {/* QR Code Container */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="p-2.5 bg-white rounded-lg shadow-md">
                        <Image
                          src={authSetup.qrCodeDataUrl}
                          alt="Two-Factor QR Code"
                          width={170}
                          height={170}
                          className="rounded"
                          unoptimized
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-2 max-w-full">
                        <code className="text-[11px] font-mono bg-black/50 text-neon-blue px-2.5 py-1 rounded border border-white/10 tracking-widest break-all">
                          {authSetup.secret}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleCopySecret}
                          className="h-7 w-7 text-gray-400 hover:text-white shrink-0"
                          title="Copy secret key"
                        >
                          {copiedSecret ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-gray-300">
                        2. Enter the 6-digit code shown in your authenticator app:
                      </p>
                      <div className="flex justify-center pt-1">
                        <InputOTP
                          maxLength={6}
                          value={authenticatorCode}
                          onChange={setAuthenticatorCode}
                        >
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

                    <Button
                      onClick={handleVerifyAuthenticator}
                      disabled={authenticatorCode.length !== 6 || isVerifying}
                      className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white font-medium"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Activate Authenticator"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400">
                    <p>Failed to load authenticator setup.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadAuthenticatorSetup}
                      className="mt-3 border-white/10 text-neon-blue"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Try Again
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* METHOD 2: EMAIL OTP */}
              <TabsContent value="EMAIL" className="space-y-4 mt-4">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Mail className="w-4 h-4 text-neon-blue" />
                    <span>Registered email address:</span>
                  </div>
                  <div className="font-mono text-xs text-white font-medium pl-6">
                    {userEmail || "Your registered email"}
                  </div>
                </div>

                {!emailSent ? (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Click below to send a one-time 6-digit verification code to your email address.
                    </p>
                    <Button
                      onClick={handleSendEmailOtp}
                      disabled={sendingEmail}
                      className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white font-medium"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Sending Code...
                        </>
                      ) : (
                        "Send Verification Code"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-medium">
                        Verification code sent!
                      </span>
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={resendCooldown > 0 || sendingEmail}
                        className="text-neon-blue hover:underline disabled:text-gray-500 disabled:no-underline"
                      >
                        {resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : "Resend Code"}
                      </button>
                    </div>

                    <div className="flex justify-center pt-1">
                      <InputOTP
                        maxLength={6}
                        value={emailCode}
                        onChange={setEmailCode}
                      >
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

                    <Button
                      onClick={handleVerifyEmail}
                      disabled={emailCode.length !== 6 || isVerifying}
                      className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white font-medium"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Activate Email 2FA"
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDialogClose(false)}
            className="w-full sm:w-auto border-white/10 text-gray-300 hover:bg-white/5 bg-transparent"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
