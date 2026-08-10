import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAdminBundleQueue } from "@/actions/bundles";
import AdminBundlesClient from "./bundles-client";

export const dynamic = "force-dynamic";

export default async function AdminBundlesPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/courses");
  }

  const data = await getAdminBundleQueue();
  if (!data.ok) redirect("/courses");

  return (
    <AdminBundlesClient
      bundles={data.bundles.map((bundle: (typeof data.bundles)[number]) => ({
        ...bundle,
        submittedAt: bundle.submittedAt
          ? bundle.submittedAt.toISOString()
          : null,
      }))}
    />
  );
}
