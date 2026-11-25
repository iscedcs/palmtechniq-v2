import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "PalmTechnIQ's 30-day money-back guarantee: what is covered, what is not, and how to request a refund.",
  alternates: {
    canonical: "/refunds",
  },
};

export default function RefundsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
