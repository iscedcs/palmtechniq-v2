import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/component/forms/forgot-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your PalmTechnIQ account password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive a password reset link">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
