import { getTransactionAudit } from "@/actions/admin-transactions";
import TransactionsClient from "./transactions-client";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const result = await getTransactionAudit({ page, status: searchParams.status });
  
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
