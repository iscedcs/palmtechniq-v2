"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { markStalePendingTransactions } from "@/actions/admin-transactions";
import {
  countByOrigin,
  type TransactionOrigin,
  type TransactionSummary,
} from "@/lib/payments/transaction-origin";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  AlertTriangle 
} from "lucide-react";

type TransactionRow = {
  id: string;
  transactionId: string;
  amount: number;
  status: string;
  currency: string;
  createdAt: string;
  paymentDate: string | null;
  userName: string;
  userEmail: string;
  courseTitle: string;
  origin: TransactionOrigin;
};

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export default function TransactionsClient({
  summary,
  transactions,
  pagination,
}: {
  summary: TransactionSummary;
  transactions: TransactionRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}) {
  const [cleaning, setCleaning] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCleanStale = async () => {
    setCleaning(true);
    const res = await markStalePendingTransactions();
    if ("error" in res) {
      toast.error(res.error);
    } else {
      toast.success(`Marked ${res.count} stale pending transactions as failed.`);
      router.refresh();
    }
    setCleaning(false);
  };

  const setFilter = (status: string | null) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (status) params.set("status", status);
    else params.delete("status");
    params.delete("page"); // Reset page on filter
    router.push(`?${params.toString()}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "FAILED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "REFUNDED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const testCount = countByOrigin(summary, "test");
  const legacyCount = countByOrigin(summary, "legacy");
  const live = summary.live;

  return (
    <div>
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              Transaction Audit
            </h1>
            <p className="text-gray-400">
              Monitor payments, filter test transactions, and clean up abandoned
              checkouts.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            disabled={cleaning}
            onClick={handleCleanStale}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clean Stale Pending
          </Button>
        </div>

        {testCount > 0 && (
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
            <div>
              <h3 className="text-orange-400 font-medium">Test-mode transactions exist</h3>
              <p className="text-sm text-gray-300 mt-1">
                {testCount} transaction{testCount === 1 ? "" : "s"} were made with
                Paystack test keys. They are excluded from every revenue figure
                and are marked TEST in the table below.
              </p>
            </div>
          </div>
        )}

        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Live Revenue (Paystack)</CardTitle>
            <p className="text-sm text-gray-400">
              Completed payments made through the platform. Legacy manual
              payments and test-mode payments are not included.
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Collected (incl. VAT)", value: live.COMPLETED.gross },
              { label: "VAT", value: live.COMPLETED.vat },
              { label: "Tutors' share", value: live.COMPLETED.tutorShare },
              { label: "Platform share", value: live.COMPLETED.platformShare },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 p-4">
                <p className="text-sm text-gray-400">{item.label}</p>
                <p className="text-xl text-white font-semibold mt-1">{naira(item.value)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {live.COMPLETED.count} completed payment{live.COMPLETED.count === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Live Checkouts by Status</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["COMPLETED", "PENDING", "FAILED", "REFUNDED"] as const).map((status) => (
              <div
                key={status}
                onClick={() => setFilter(status)}
                className="rounded-lg border border-white/10 p-4 cursor-pointer hover:bg-white/5 transition-colors">
                <p className="text-sm text-gray-400">{status}</p>
                <p className="text-xl text-white font-semibold mt-1">
                  {live[status].count}
                </p>
                <p className="text-xs text-gray-500 mt-1">transactions</p>
              </div>
            ))}
            <div
              onClick={() => setFilter(null)}
              className="col-span-2 md:col-span-4 mt-2 text-sm text-neon-blue cursor-pointer hover:underline text-right">
              View All Transactions
            </div>
          </CardContent>
        </Card>

        {legacyCount > 0 && (
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Legacy Manual Payments</CardTitle>
              <p className="text-sm text-gray-400">
                Logged by hand before checkout ran through the platform. Kept for
                the record and shown here separately from live revenue.
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-white/10 p-4">
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-xl text-white font-semibold mt-1">
                  {naira(summary.legacy.COMPLETED.gross)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.legacy.COMPLETED.count} payments
                </p>
              </div>
              <div className="rounded-lg border border-white/10 p-4">
                <p className="text-sm text-gray-400">Failed</p>
                <p className="text-xl text-white font-semibold mt-1">
                  {summary.legacy.FAILED.count}
                </p>
                <p className="text-xs text-gray-500 mt-1">transactions</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="glass-card border-white/10">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-400">Reference</TableHead>
                    <TableHead className="text-gray-400">User</TableHead>
                    <TableHead className="text-gray-400">Course</TableHead>
                    <TableHead className="text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((row) => (
                    <TableRow key={row.id} className="border-white/10">
                      <TableCell className="text-gray-300 font-mono text-xs">
                        {row.transactionId}
                        {row.origin === "test" && (
                          <Badge className="ml-2 bg-orange-500/20 text-orange-400 border-orange-500/30">
                            TEST
                          </Badge>
                        )}
                        {row.origin === "legacy" && (
                          <Badge className="ml-2 bg-gray-500/20 text-gray-300 border-gray-500/30">
                            LEGACY
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-200">
                        <div className="space-y-1">
                          <p className="text-white font-medium text-sm">
                            {row.userName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {row.userEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm max-w-[200px] truncate">
                        {row.courseTitle}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        ₦{row.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(row.status)}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions.length === 0 && (
                    <TableRow className="border-white/10">
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                disabled={pagination.page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams?.toString());
                  params.set("page", (pagination.page - 1).toString());
                  router.push(`?${params.toString()}`);
                }}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams?.toString());
                  params.set("page", (pagination.page + 1).toString());
                  router.push(`?${params.toString()}`);
                }}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
