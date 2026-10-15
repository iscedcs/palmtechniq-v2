import { getTransactionAudit } from "@/actions/admin-transactions";
import TransactionsClient from "./transactions-client";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageParam, status } = await searchParams;
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const result = await getTransactionAudit({
    page: Number.isFinite(page) && page > 0 ? page : 1,
    status,
  });

  if ("error" in result) {
    return <div className="p-8 text-red-400">{result.error}</div>;
  }

  return (
    <TransactionsClient
      summary={result.summary}
      transactions={result.transactions}
      pagination={result.pagination}
    />
  );
}
