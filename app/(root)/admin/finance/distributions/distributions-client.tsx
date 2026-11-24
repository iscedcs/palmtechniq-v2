"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Calculator, CheckCircle2, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  approveDistribution,
  computeDistributionRun,
  markSharePaid,
} from "@/actions/admin-distributions";

const naira = (kobo: number) =>
  `₦${(kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

type Share = {
  id: string;
  sharePercent: number;
  amountKobo: number;
  priority: number;
  status: "PENDING" | "PAID";
  paidAt: string | null;
  paymentRef: string | null;
  stakeholder: {
    name: string;
    role: string;
    bankName: string | null;
    accountNumber: string | null;
  };
};

type Run = {
  id: string;
  periodStart: string;
  periodEnd: string;
  baseKobo: number;
  status: "DRAFT" | "APPROVED" | "PAID";
  computedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  shares: Share[];
};

type Preview =
  | {
      ok: true;
      period: { start: string; end: string; label: string };
      base: {
        totalKobo: number;
        breakdown: {
          coursesAndMentorshipKobo: number;
          programsKobo: number;
          programGrossKobo: number;
          programInstructorShareKobo: number;
        };
        counts: { transactions: number; installments: number };
      };
      validity: { ok: true } | { ok: false; total: number; message: string };
      existing: { id: string; status: string } | null;
    }
  | { ok: false; error: string };

const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const statusColour = (status: string) =>
  status === "PAID"
    ? "bg-green-500/20 text-green-400 border-green-500/30"
    : status === "APPROVED"
      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
      : "bg-gray-500/20 text-gray-300 border-gray-500/30";

export default function DistributionsClient({
  runs,
  preview,
}: {
  runs: Run[];
  preview: Preview;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refs, setRefs] = useState<Record<string, string>>({});

  function compute() {
    startTransition(async () => {
      const result = await computeDistributionRun();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `${result.recomputed ? "Recomputed" : "Drafted"} ${result.label}: ₦${result.base.toLocaleString()} to split`,
      );
      router.refresh();
    });
  }

  function approve(id: string, label: string) {
    startTransition(async () => {
      const result = await approveDistribution(id);
      if (!result.ok) {
        toast.error(result.error, { duration: 10_000 });
        return;
      }
      toast.success(
        `${label} approved. ₦${result.total.toLocaleString()} is now committed.`,
      );
      router.refresh();
    });
  }

  function pay(shareId: string, name: string) {
    const paymentRef = refs[shareId]?.trim();
    if (!paymentRef) {
      toast.error("Enter the transfer reference first.");
      return;
    }
    startTransition(async () => {
      const result = await markSharePaid({ shareId, paymentRef });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${name} marked paid`);
      setRefs((r) => ({ ...r, [shareId]: "" }));
      router.refresh();
    });
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Next period */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-neon-blue" />
            Next distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!preview.ok ? (
            <p className="text-sm text-gray-400">{preview.error}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-2xl font-bold text-white">
                  {preview.period.label}
                </p>
                <p className="text-sm text-gray-400">
                  {naira(preview.base.totalKobo)} to split
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-400">
                    Courses and mentorship
                  </p>
                  <p className="text-white font-medium">
                    {naira(preview.base.breakdown.coursesAndMentorshipKobo)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {preview.base.counts.transactions} transaction(s) in period
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-400">Programs</p>
                  <p className="text-white font-medium">
                    {naira(preview.base.breakdown.programsKobo)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {naira(preview.base.breakdown.programGrossKobo)} collected,
                    less {naira(preview.base.breakdown.programInstructorShareKobo)}{" "}
                    instructor share
                  </p>
                </div>
              </div>

              {!preview.validity.ok && (
                <p className="text-sm text-orange-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  {preview.validity.message}
                </p>
              )}

              <p className="text-xs text-gray-500">
                The figure above is what was earned in the period. It does not
                subtract Paystack&apos;s fees, which are not recorded anywhere,
                so it runs slightly ahead of the cash in hand. Approval checks
                the real money position and refuses if it would overcommit.
              </p>

              <Button
                onClick={compute}
                disabled={pending || !preview.validity.ok}
                className="bg-neon-blue/80 hover:bg-neon-blue text-white">
                {preview.existing
                  ? `Recompute ${preview.period.label} draft`
                  : `Draft ${preview.period.label}`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Runs */}
      {runs.length === 0 && (
        <p className="text-sm text-gray-400">
          No distribution runs yet. Draft one above.
        </p>
      )}

      {runs.map((run) => {
        const total = run.shares.reduce((s, x) => s + x.amountKobo, 0);
        const paid = run.shares
          .filter((s) => s.status === "PAID")
          .reduce((s, x) => s + x.amountKobo, 0);
        const label = monthLabel(run.periodStart);

        return (
          <Card key={run.id} className="glass-card border-white/10">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  {label}
                  <Badge className={statusColour(run.status)}>
                    {run.status}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  {naira(total)} across {run.shares.length} stakeholder(s)
                  {run.status !== "DRAFT" && ` · ${naira(paid)} paid`}
                </p>
              </div>
              {run.status === "DRAFT" && (
                <Button
                  onClick={() => approve(run.id, label)}
                  disabled={pending}
                  className="bg-green-600/80 hover:bg-green-600 text-white shrink-0">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-400">#</TableHead>
                      <TableHead className="text-gray-400">
                        Stakeholder
                      </TableHead>
                      <TableHead className="text-gray-400">Share</TableHead>
                      <TableHead className="text-gray-400">Amount</TableHead>
                      <TableHead className="text-gray-400">Bank</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {run.shares.map((share) => (
                      <TableRow key={share.id} className="border-white/10">
                        <TableCell className="text-gray-500 text-sm">
                          {share.priority}
                        </TableCell>
                        <TableCell>
                          <p className="text-white text-sm font-medium">
                            {share.stakeholder.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {share.stakeholder.role}
                          </p>
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm">
                          {share.sharePercent}%
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {naira(share.amountKobo)}
                        </TableCell>
                        <TableCell className="text-gray-400 text-xs">
                          {share.stakeholder.bankName ? (
                            <>
                              {share.stakeholder.bankName}
                              <br />
                              {share.stakeholder.accountNumber}
                            </>
                          ) : (
                            <span className="text-orange-400">
                              No bank details
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {share.status === "PAID" ? (
                            <div className="text-xs">
                              <Badge className={statusColour("PAID")}>
                                PAID
                              </Badge>
                              <p className="text-gray-500 mt-1">
                                {share.paymentRef}
                              </p>
                            </div>
                          ) : run.status === "DRAFT" ? (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Not approved
                            </span>
                          ) : (
                            <div className="flex gap-1">
                              <Input
                                value={refs[share.id] ?? ""}
                                onChange={(e) =>
                                  setRefs((r) => ({
                                    ...r,
                                    [share.id]: e.target.value,
                                  }))
                                }
                                placeholder="Transfer ref"
                                className="h-8 w-28 bg-white/5 border-white/10 text-white text-xs"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pending}
                                onClick={() =>
                                  pay(share.id, share.stakeholder.name)
                                }
                                className="h-8 border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs">
                                Paid
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
