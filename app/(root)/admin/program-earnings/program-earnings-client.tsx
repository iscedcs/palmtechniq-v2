"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Lock,
  TriangleAlert,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatToNaira } from "@/lib/utils";
import {
  releaseProgramEarnings,
  setCohortLeadInstructor,
} from "@/actions/program-earnings";

type Instructor = { id: string; name: string; email: string };

type Cohort = {
  id: string;
  displayName: string;
  programName: string;
  startDate: string;
  seatsTaken: number;
  leadInstructor: Instructor | null;
  accruedTotal: number;
  releasableNow: number;
  releasableCount: number;
  releasedTotal: number;
  heldForPreviousInstructor: number;
  nextReleaseAt: string | null;
};

const UNASSIGNED = "__unassigned__";

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function ProgramEarningsClient({
  cohorts,
  instructors,
}: {
  cohorts: Cohort[];
  instructors: Instructor[];
}) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const totals = cohorts.reduce(
    (acc, c) => ({
      accrued: acc.accrued + c.accruedTotal,
      releasable: acc.releasable + c.releasableNow,
      released: acc.released + c.releasedTotal,
    }),
    { accrued: 0, releasable: 0, released: 0 },
  );

  const handleAssign = (cohortId: string, value: string) => {
    setBusyId(cohortId);
    startTransition(async () => {
      const result = await setCohortLeadInstructor(
        cohortId,
        value === UNASSIGNED ? null : value,
      );
      setBusyId(null);
      if (!result.ok) {
        toast.error(result.error ?? "Could not update instructor");
        return;
      }
      toast.success(
        result.accrued
          ? `Instructor set. Back-filled ${result.accrued} accrual${result.accrued === 1 ? "" : "s"} for payments already received.`
          : "Instructor updated.",
      );
    });
  };

  const handleRelease = (cohortId: string) => {
    setBusyId(cohortId);
    startTransition(async () => {
      const result = await releaseProgramEarnings(cohortId);
      setBusyId(null);
      if (!result.ok) {
        toast.error(result.error ?? "Release failed");
        return;
      }
      if (result.released === 0) {
        toast.info(
          result.notYetEligible
            ? `Nothing releasable yet — ${result.notYetEligible} accrual${result.notYetEligible === 1 ? " is" : "s are"} still inside the refund window or waiting for the cohort to start.`
            : "Nothing to release.",
        );
        return;
      }
      toast.success(
        `Released ${formatToNaira(result.total ?? 0)} across ${result.released} accrual${result.released === 1 ? "" : "s"}.`,
      );
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold">Program Revenue Share</h1>
          <p className="text-sm text-muted-foreground">
            Lead instructors earn 25% of a program&apos;s full price, accrued as
            each installment is paid. Accrued money is recorded but stays in the
            company account until released.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Accrued, not released"
            value={totals.accrued}
            icon={<Clock className="h-4 w-4" />}
          />
          <SummaryCard
            label="Releasable now"
            value={totals.releasable}
            icon={<CheckCircle2 className="h-4 w-4" />}
            highlight
          />
          <SummaryCard
            label="Already released"
            value={totals.released}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
        </div>

        <div className="space-y-4">
          {cohorts.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No cohorts yet.
              </CardContent>
            </Card>
          )}

          {cohorts.map((cohort, index) => {
            const busy = pending && busyId === cohort.id;
            const canRelease = cohort.releasableNow > 0;

            return (
              <motion.div
                key={cohort.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">
                          {cohort.programName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {cohort.displayName} · starts{" "}
                          {formatDate(cohort.startDate)} · {cohort.seatsTaken}{" "}
                          enrolled
                        </p>
                      </div>
                      {!cohort.leadInstructor && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 text-amber-600"
                        >
                          <TriangleAlert className="mr-1 h-3 w-3" />
                          No lead instructor
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Figure
                        label="Accrued"
                        value={formatToNaira(cohort.accruedTotal)}
                      />
                      <Figure
                        label="Releasable now"
                        value={formatToNaira(cohort.releasableNow)}
                        emphasis={canRelease}
                      />
                      <Figure
                        label="Released"
                        value={formatToNaira(cohort.releasedTotal)}
                      />
                    </div>

                    {!canRelease && cohort.accruedTotal > 0 && (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Held until{" "}
                        {formatDate(cohort.nextReleaseAt) === "—"
                          ? "the cohort starts"
                          : formatDate(cohort.nextReleaseAt)}
                        {" — "}
                        accruals clear 30 days after payment and not before the
                        cohort begins.
                      </p>
                    )}

                    {cohort.heldForPreviousInstructor > 0 && (
                      <p className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-400">
                        <TriangleAlert className="h-3 w-3 shrink-0" />
                        {formatToNaira(cohort.heldForPreviousInstructor)} was
                        accrued to a different instructor before the current
                        assignment. It stays with them — changing the lead does
                        not move money already earned.
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={cohort.leadInstructor?.id ?? UNASSIGNED}
                          onValueChange={(value) =>
                            handleAssign(cohort.id, value)
                          }
                          disabled={busy}
                        >
                          <SelectTrigger className="w-[260px]">
                            <SelectValue placeholder="Assign lead instructor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNASSIGNED}>
                              Unassigned
                            </SelectItem>
                            {instructors.map((instructor) => (
                              <SelectItem
                                key={instructor.id}
                                value={instructor.id}
                              >
                                {instructor.name} · {instructor.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={() => handleRelease(cohort.id)}
                        disabled={busy || !canRelease}
                        size="sm"
                      >
                        {busy
                          ? "Working…"
                          : `Release ${cohort.releasableCount || ""} to wallet`.trim()}
                      </Button>

                      {cohort.nextReleaseAt && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          Next eligible {formatDate(cohort.nextReleaseAt)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/40" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="mt-1 text-xl font-semibold">{formatToNaira(value)}</p>
      </CardContent>
    </Card>
  );
}

function Figure({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold ${emphasis ? "text-primary" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
