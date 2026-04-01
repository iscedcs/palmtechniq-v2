import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Interview Prep",
  description:
    "Practice interview skills with AI-powered mock interviews. Get real-time feedback, track progress, and prepare for tech interviews with PalmTechnIQ.",
  alternates: {
    canonical: "/features/ai-interview",
  },
  openGraph: {
    title: "AI Interview Prep | PalmTechnIQ",
    description:
      "Practice interview skills with AI-powered mock interviews. Real-time feedback and progress tracking.",
    url: "https://palmtechniq.com/features/ai-interview",
    type: "website",
  },
};

export default function FeatureAIInterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
