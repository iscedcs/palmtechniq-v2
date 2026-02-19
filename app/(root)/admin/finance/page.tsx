import { getAdminWithdrawalQueue } from "@/actions/withdrawal";
import { getMentorshipFinanceSummary } from "@/actions/mentorship-revenue";
import AdminFinanceClient from "@/app/(root)/admin/finance/finance-client";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const [result, mentorshipResult] = await Promise.all([
    getAdminWithdrawalQueue(),
    getMentorshipFinanceSummary(),
  ]);
  const initialRequests =
    "requests" in result && Array.isArray(result.requests)
      ? result.requests
      : [];
  const initialTotals =
    "totals" in result && Array.isArray(result.totals) ? result.totals : [];
  const mentorshipSummary =
    "success" in mentorshipResult && mentorshipResult.success
      ? mentorshipResult.mentorship
      : null;

  return (
    <AdminFinanceClient
      initialRequests={initialRequests}
      initialTotals={initialTotals}
      mentorshipSummary={mentorshipSummary}
    />
  );
}
