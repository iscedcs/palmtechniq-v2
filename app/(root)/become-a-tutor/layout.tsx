import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Become a Tutor",
  description:
    "Join PalmTechnIQ as a tutor. Share your expertise, create courses, mentor students, and earn income teaching tech skills.",
  alternates: {
    canonical: "/become-a-tutor",
  },
  openGraph: {
    title: "Become a Tutor | PalmTechnIQ",
    description:
      "Share your expertise, create courses, mentor students, and earn income teaching tech skills.",
    url: absoluteUrl("/become-a-tutor"),
    type: "website",
  },
};

export default function BecomeATutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
