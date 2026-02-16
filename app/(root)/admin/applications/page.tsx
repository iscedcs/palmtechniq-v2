import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTutorMentorApplications } from "@/actions/admin-applications";
import AdminApplicationsClient from "@/app/(root)/admin/applications/applications-client";

export default async function AdminApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/courses");
  }

  const data = await getTutorMentorApplications();

  return (
    <AdminApplicationsClient
      initialApplications={"applications" in data ? data.applications : []}
      initialStats={
        "stats" in data
          ? data.stats
          : {
              total: 0,
              pending: 0,
              underReview: 0,
              approved: 0,
              rejected: 0,
            }
      }
    />
  );
}
