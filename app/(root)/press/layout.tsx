import type { Metadata } from "next";

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
    url: "https://palmtechniq.com/press",
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
