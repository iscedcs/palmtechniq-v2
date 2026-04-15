import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/component/forms/signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your PalmTechnIQ account and start learning today.",
};

export default function SignupPage() {
  return (
    <AuthLayout
      title="Join PalmTechnIQ"
      subtitle="Create your account and start learning today">
      <SignupForm />
    </AuthLayout>
  );
}
