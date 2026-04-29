import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with PalmTechnIQ. Reach out for support, partnerships, or general enquiries about our e-learning platform.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact PalmTechnIQ",
    description:
      "Reach out for support, partnerships, or general enquiries about our e-learning platform.",
    url: "https://palmtechniq.com/contact",
    type: "website",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
