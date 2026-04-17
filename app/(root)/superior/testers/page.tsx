import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TesterManagement } from "./tester-management";

export default async function TestersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPERIOR") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Manage Testers
          </h1>
          <p className="text-muted-foreground mt-2">
            Add and manage tester accounts who can access the documentation
          </p>
        </div>

        <TesterManagement />
      </div>
    </div>
  );
}
