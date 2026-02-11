"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
} from "@/actions/withdrawal";
import { toast } from "sonner";

type WithdrawalRow = {
  id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  requestedAt: Date;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  paidAt: Date | null;
  adminNote: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    recipientCode: string | null;
    bankName: string | null;
    accountNumber: string | null;
  };
  payout: {
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
    transferReference: string | null;
    transferCode: string | null;
  } | null;
};

type Totals = {
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  _sum: { amount: number | null };
  _count: { _all: number };
};

export default function AdminFinanceClient({
  initialRequests,
  initialTotals,
}: {
  initialRequests: WithdrawalRow[];
  initialTotals: Totals[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [totals, setTotals] = useState(initialTotals);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const refreshTotals = (updated: WithdrawalRow[]) => {
    const summary = updated.reduce<
      Record<string, { count: number; amount: number }>
    >((acc, row) => {
      const key = row.status;
      if (!acc[key]) acc[key] = { count: 0, amount: 0 };
      acc[key].count += 1;
      acc[key].amount += row.amount;
      return acc;
    }, {});
    const nextTotals = Object.entries(summary).map(([status, data]) => ({
      status: status as Totals["status"],
      _sum: { amount: data.amount },
      _count: { _all: data.count },
    }));
    setTotals(nextTotals);
  };

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    const res = await approveWithdrawalRequest(id);
    if ("error" in res) {
      toast.error(res.error);
      setLoadingId(null);
      return;
    }
    toast.success("Withdrawal approved");
    const updated = requests.map((row) =>
      row.id === id ? { ...row, status: "APPROVED" } : row,
    );
    setRequests(updated as WithdrawalRow[]);
    refreshTotals(updated as WithdrawalRow[]);
    setLoadingId(null);
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    const res = await rejectWithdrawalRequest(id);
    if ("error" in res) {
      toast.error(res.error);
      setLoadingId(null);
      return;
    }
    toast.success("Withdrawal rejected");
    const updated = requests.map((row) =>
      row.id === id ? { ...row, status: "REJECTED" } : row,
    );
    setRequests(updated as WithdrawalRow[]);
    refreshTotals(updated as WithdrawalRow[]);
    setLoadingId(null);
  };

  const renderStatus = (status: WithdrawalRow["status"]) => {
    if (status === "PAID")
      return "bg-green-500/20 text-green-400 border-green-500/30";
    if (status === "APPROVED")
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (status === "REJECTED")
      return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24">
      <div className="container mx-auto px-6 py-8 space-y-6">
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Payout Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {["PENDING", "APPROVED", "PAID", "REJECTED"].map((status) => {
              const row = totals.find((item) => item.status === status);
              return (
                <div
                  key={status}
                  className="rounded-lg border border-white/10 p-4">
                  <p className="text-sm text-gray-400">{status}</p>
                  <p className="text-xl text-white font-semibold">
                    ₦{(row?._sum.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {row?._count._all || 0} requests
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Withdrawal Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-400">Tutor</TableHead>
                  <TableHead className="text-gray-400">Amount</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Requested</TableHead>
                  <TableHead className="text-gray-400">Payout</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((row) => (
                  <TableRow key={row.id} className="border-white/10">
                    <TableCell className="text-gray-200">
                      <div className="space-y-1">
                        <p className="text-white font-medium">
                          {row.user.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {row.user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      ₦{row.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={renderStatus(row.status)}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(row.requestedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {row.payout?.status || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            row.status !== "PENDING" || loadingId === row.id
                          }
                          onClick={() => handleApprove(row.id)}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-400 border-red-500/40"
                          disabled={
                            row.status !== "PENDING" || loadingId === row.id
                          }
                          onClick={() => handleReject(row.id)}>
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
