"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { updateAccountPassword } from "@/actions/account-security";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasPassword?: boolean;
  onSuccess?: () => void;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  hasPassword = true,
  onSuccess,
}: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Criteria validation
  const hasMinLength = newPassword.length >= 8;
  const hasMixedChar = /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasPassword && !currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }

    if (!hasMinLength) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateAccountPassword({
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Password updated successfully.");
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      }
    } catch {
      toast.error("Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[460px] bg-[#090d16] border-white/10 text-white shadow-2xl backdrop-blur-xl">
        <DialogHeader className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue mb-1">
            <KeyRound className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold text-white tracking-tight">
            {hasPassword ? "Change Password" : "Set Account Password"}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm leading-relaxed">
            {hasPassword
              ? "Ensure your account is using a long, random password to stay secure."
              : "Set a password for your account so you can also log in directly via email and password."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {hasPassword && (
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-300 font-medium">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-10 focus-visible:ring-neon-blue/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm text-gray-300 font-medium">New Password</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-10 focus-visible:ring-neon-blue/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-gray-300 font-medium">Confirm New Password</Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-10 focus-visible:ring-neon-blue/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Validation Checklist */}
          {newPassword && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1.5 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                {hasMinLength ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-gray-500" />
                )}
                <span className={hasMinLength ? "text-emerald-300" : ""}>
                  Minimum 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasMixedChar ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-gray-500" />
                )}
                <span className={hasMixedChar ? "text-emerald-300" : ""}>
                  Includes uppercase & numbers (recommended)
                </span>
              </div>
              {confirmPassword && (
                <div className="flex items-center gap-2">
                  {passwordsMatch ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className={passwordsMatch ? "text-emerald-300" : "text-amber-300"}>
                    Passwords match
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
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
              type="submit"
              disabled={isSubmitting || !hasMinLength || !passwordsMatch}
              className="bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white font-medium"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
