import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Documentation",
    template: "%s | PalmTechnIQ Docs",
  },
  description:
    "Comprehensive documentation for PalmTechnIQ — guides for students, tutors, mentors, admins, and developers.",
  alternates: {
    canonical: "/documentation",
  },
  openGraph: {
    title: "PalmTechnIQ Documentation",
    description:
      "Guides, API reference, and architecture documentation for the PalmTechnIQ e-learning platform.",
    url: "https://palmtechniq.com/documentation",
    type: "website",
  },
};

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
