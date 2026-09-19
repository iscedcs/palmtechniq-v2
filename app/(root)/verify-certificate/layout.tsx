import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Verify Certificate",
  description:
    "Verify the authenticity of PalmTechnIQ course completion and volunteer certificates.",
  alternates: {
    canonical: "/verify-certificate",
  },
  openGraph: {
    title: "Verify Certificate | PalmTechnIQ",
    description:
      "Verify the authenticity of PalmTechnIQ course completion and volunteer certificates.",
    url: absoluteUrl("/verify-certificate"),
    type: "website",
  },
};

export default function VerifyCertificateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
