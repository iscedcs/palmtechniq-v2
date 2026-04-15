import type { Metadata } from "next";

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
    url: "https://palmtechniq.com/verify-certificate",
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
