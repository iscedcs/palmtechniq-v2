import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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

export default async function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "TESTER" && role !== "SUPERIOR") {
    redirect("/courses");
  }

  return children;
}
