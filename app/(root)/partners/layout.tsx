import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Partner with PalmTechnIQ to deliver high-impact tech education. Explore partnership opportunities for organizations and institutions.",
  alternates: {
    canonical: "/partners",
  },
  openGraph: {
    title: "Partner with PalmTechnIQ",
    description:
      "Explore partnership opportunities to deliver high-impact tech education.",
    url: "https://palmtechniq.com/partners",
    type: "website",
  },
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
