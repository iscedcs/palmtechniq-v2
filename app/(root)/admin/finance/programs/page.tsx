import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProgramEarningsOverview } from "@/actions/program-earnings";
import ProgramEarningsClient from "./program-earnings-client";

export const dynamic = "force-dynamic";

export default async function AdminProgramEarningsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/courses");
  }

  const data = await getProgramEarningsOverview();
  if (!data.ok) redirect("/courses");

  return (
    <ProgramEarningsClient
      cohorts={data.cohorts.map((cohort: (typeof data.cohorts)[number]) => ({
        ...cohort,
        startDate: cohort.startDate.toISOString(),
        nextReleaseAt: cohort.nextReleaseAt
          ? cohort.nextReleaseAt.toISOString()
          : null,
      }))}
      instructors={data.instructors}
    />
  );
}
