import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides on learning a skill, teaching online and earning from what you know — plus AI, technology, business and career insight from PalmTechnIQ.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "PalmTechnIQ Blog",
    description:
      "Guides on learning skills, teaching online and earning from what you know — plus AI, technology and career insight.",
    url: absoluteUrl("/blog"),
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
