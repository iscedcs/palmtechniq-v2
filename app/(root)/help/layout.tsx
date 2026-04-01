import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Find answers to frequently asked questions about PalmTechnIQ courses, enrollment, mentorship, payments, and platform features.",
  alternates: {
    canonical: "/help",
  },
  openGraph: {
    title: "Help Center | PalmTechnIQ",
    description:
      "FAQs and support for courses, enrollment, mentorship, payments, and platform features.",
    url: "https://palmtechniq.com/help",
    type: "website",
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
