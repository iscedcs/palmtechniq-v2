import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set New Password",
  description: "Set a new password for your PalmTechnIQ account.",
};

export default function NewPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
