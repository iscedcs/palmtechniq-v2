import type { Metadata } from "next";
import { EnrollmentWizard } from "@/components/enrollment/enrollment-wizard";
import { getProgramBySlug } from "@/data/programs";

export const metadata: Metadata = {
  title: "Enroll — PalmTechnIQ Professional Programs",
  description:
    "Reserve your spot in PalmTechnIQ's intensive professional programs. Choose your path, select a cohort, and start your career pipeline.",
  alternates: {
    canonical: "/enroll",
  },
  openGraph: {
    title: "Enroll — PalmTechnIQ Professional Programs",
    description:
      "Reserve your spot in PalmTechnIQ's intensive professional programs. Choose your path, select a cohort, and start your career pipeline.",
    url: "https://palmtechniq.com/enroll",
    type: "website",
  },
};

export default async function EnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const params = await searchParams;
  const slug = params.program;
  const preselectedSlug = slug && getProgramBySlug(slug) ? slug : undefined;

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24 pb-16">
      <EnrollmentWizard initialProgramSlug={preselectedSlug} />
    </main>
  );
}
