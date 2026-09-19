import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Press",
  description:
    "PalmTechnIQ press and media resources. Latest news, press releases, and brand assets.",
  alternates: {
    canonical: "/press",
  },
  openGraph: {
    title: "Press | PalmTechnIQ",
    description:
      "Latest news, press releases, and brand assets from PalmTechnIQ.",
    url: absoluteUrl("/press"),
    type: "website",
  },
};

export default function PressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
