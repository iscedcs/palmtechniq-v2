import WalletClient from "./wallet-client";
import { getWalletDashboardData } from "@/actions/withdrawal";

export default async function TutorWalletPage() {
  const result = await getWalletDashboardData();

  const fallbackSummary = {
    availableBalance: 0,
    pendingPayouts: 0,
    totalEarnings: 0,
  };
  const fallbackUser = {
    name: "Tutor",
    avatar: null,
    role: "TUTOR" as const,
    recipientCode: null,
    bankName: null,
    accountNumber: null,
  };

  const initialSummary =
    "summary" in result && result.summary ? result.summary : fallbackSummary;
  const initialUser =
    "user" in result && result.user ? result.user : fallbackUser;
  const initialTransactions =
    "transactions" in result && result.transactions ? result.transactions : [];
  const initialEarningsData =
    "earningsData" in result && result.earningsData ? result.earningsData : [];
  const initialRevenueBreakdown =
    "revenueBreakdown" in result && result.revenueBreakdown
      ? result.revenueBreakdown
      : [];
  const rawPaymentMethods =
    "paymentMethods" in result && result.paymentMethods
      ? result.paymentMethods
      : [];
  const initialPaymentMethods = rawPaymentMethods.map((method) => ({
    ...method,
    details:
      method.details && typeof method.details === "object"
        ? method.details
        : null,
  }));

  return (
    <WalletClient
      initialSummary={initialSummary}
      initialUser={initialUser}
      initialTransactions={initialTransactions}
      initialEarningsData={initialEarningsData}
      initialRevenueBreakdown={initialRevenueBreakdown}
      initialPaymentMethods={initialPaymentMethods}
    />
  );
}
