import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getCertificatesList,
  getCertificateStats,
  getEligibleStudentsAndPrograms,
} from "@/actions/certificate-admin";
import CertificatesClient from "./certificates-client";

export const dynamic = "force-dynamic";

export default async function AdminCertificatesPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "SUPERIOR")) {
    redirect("/courses");
  }

  const [certsResult, statsResult, lookupResult] = await Promise.all([
    getCertificatesList({ page: 1, pageSize: 50 }),
    getCertificateStats(),
    getEligibleStudentsAndPrograms(),
  ]);

  if ("error" in certsResult || "error" in statsResult) {
    redirect("/courses");
  }

  return (
    <CertificatesClient
      initialCertificates={certsResult.certificates || []}
      stats={
        statsResult.stats || {
          total: 0,
          programCertificates: 0,
          courseCertificates: 0,
          volunteerCertificates: 0,
          generalCertificates: 0,
          revoked: 0,
          issuedThisMonth: 0,
        }
      }
      lookupData={
        lookupResult && "students" in lookupResult && lookupResult.students
          ? {
              students: lookupResult.students,
              programs: lookupResult.programs,
              courses: lookupResult.courses,
              recentEnrollments: lookupResult.recentEnrollments,
            }
          : {
              students: [],
              programs: [],
              courses: [],
              recentEnrollments: [],
            }
      }
      userRole={session.user.role as "ADMIN" | "SUPERIOR"}
    />
  );
}
