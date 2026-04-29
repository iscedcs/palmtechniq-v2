import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "Change Password",
  description: "Change your password to access the platform",
};

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!(session as any).mustChangePassword) {
    redirect("/documentation");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Change Your Password
          </h1>
          <p className="text-muted-foreground">
            You must set a new password before continuing. Your temporary
            password has expired.
          </p>
        </div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
