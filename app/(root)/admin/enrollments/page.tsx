import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAdminEnrollmentsData } from "@/actions/admin-enrollments";
import AdminEnrollmentsClient from "./enrollments-client";

export const dynamic = "force-dynamic";

export default async function AdminEnrollmentsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/courses");
  }

  const data = await getAdminEnrollmentsData();

  if ("error" in data) {
    redirect("/courses");
  }

  return (
    <AdminEnrollmentsClient enrollments={data.enrollments} stats={data.stats} />
  );
}
