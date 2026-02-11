import { getAdminWithdrawalQueue } from "@/actions/withdrawal";
import AdminFinanceClient from "@/app/(root)/admin/finance/finance-client";

export default async function AdminFinancePage() {
  const result = await getAdminWithdrawalQueue();
  const initialRequests =
    "requests" in result && Array.isArray(result.requests)
      ? result.requests
      : [];
  const initialTotals =
    "totals" in result && Array.isArray(result.totals) ? result.totals : [];

  return (
    <AdminFinanceClient
      initialRequests={initialRequests}
      initialTotals={initialTotals}
    />
  );
}
