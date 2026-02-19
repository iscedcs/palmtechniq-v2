"use client";

import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { NewPasswordForm } from "@/components/component/forms/new-password-form";

function NewPasswordContent() {
  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Create a new secure password for your account">
      <Suspense fallback={<NewPasswordFormSkeleton />}>
        <NewPasswordFormWrapper />
      </Suspense>
    </AuthLayout>
  );
}

function NewPasswordFormWrapper() {
  return <NewPasswordForm />;
}

function NewPasswordFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="h-8 bg-gray-200 rounded animate-pulse mx-auto w-48" />
        <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto w-64" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function NewPasswordPage() {
  return <NewPasswordContent />;
}
