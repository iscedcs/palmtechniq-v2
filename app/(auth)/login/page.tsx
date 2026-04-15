import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/component/forms/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export const dynamic = "force-dynamic";
export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your learning journey">
      <LoginForm />
    </AuthLayout>
  );
}
