import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnrollmentWizard } from "@/components/enrollment/enrollment-wizard";
import { getProgramBySlug } from "@/data/programs";

type RouteParams = {
  programSlug: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { programSlug } = await params;
  const program = getProgramBySlug(programSlug);

  if (!program) {
    return {
      title: "Program Not Found — PalmTechnIQ",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${program.name} (${program.durationLabel}) — Enroll | PalmTechnIQ`,
    description: `Enroll directly into ${program.name} (${program.durationLabel}) at PalmTechnIQ. Complete your details and payment in minutes.`,
    alternates: {
      canonical: `/enroll/${program.slug}`,
    },
    openGraph: {
      title: `${program.name} (${program.durationLabel}) — Enroll`,
      description: `Start your ${program.durationLabel.toLowerCase()} ${program.name} journey with PalmTechnIQ.`,
      url: `https://palmtechniq.com/enroll/${program.slug}`,
      type: "website",
    },
  };
}

export default async function ProgramEnrollPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { programSlug } = await params;
  const program = getProgramBySlug(programSlug);

  if (!program) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24 pb-16">
      <EnrollmentWizard initialProgramSlug={program.slug} />
    </main>
  );
}
