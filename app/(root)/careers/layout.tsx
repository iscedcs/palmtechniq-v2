import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join the PalmTechnIQ team. Explore open positions in engineering, education, design, and more.",
  alternates: {
    canonical: "/careers",
  },
  openGraph: {
    title: "Careers at PalmTechnIQ",
    description:
      "Join the PalmTechnIQ team. Explore open positions in engineering, education, design, and more.",
    url: absoluteUrl("/careers"),
    type: "website",
  },
};

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
