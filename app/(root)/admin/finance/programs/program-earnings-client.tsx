"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Lock,
  TriangleAlert,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
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
import { REVENUE } from "@/lib/payments/revenue";
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

const LEAD_PERCENT = Math.round(REVENUE.programSplit.leadInstructor * 100);
const WINDOW_DAYS = REVENUE.refundWindowDays;

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

/**
 * Why a cohort is in the attention group, in the order the admin should care.
 *
 * Returns null for a cohort that needs nothing, which is what splits the list.
 * An unassigned lead on a cohort with enrolled students is the worst case: the
 * money is arriving and nothing is being accrued against it at all.
 */
function attentionReason(cohort: Cohort) {
  if (!cohort.leadInstructor && cohort.seatsTaken > 0) {
    return {
      tone: "amber" as const,
      label: "No lead instructor",
      detail: `${cohort.seatsTaken} student${cohort.seatsTaken === 1 ? "" : "s"} enrolled and nothing is being accrued. Assigning a lead back-fills every payment already received.`,
    };
  }
  if (cohort.heldForPreviousInstructor > 0) {
    return {
      tone: "amber" as const,
      label: "Earned by a previous lead",
      detail: `${formatToNaira(cohort.heldForPreviousInstructor)} was accrued to a different instructor before the current assignment. It stays with them: changing the lead does not move money already earned.`,
    };
  }
  if (cohort.releasableNow > 0) {
    return {
      tone: "green" as const,
      label: "Ready to release",
      detail: null,
    };
  }
  return null;
}

export default function ProgramEarningsClient({
  cohorts,
  instructors,
}: {
  cohorts: Cohort[];
  instructors: Instructor[];
}) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { totals, needsAttention, quiet } = useMemo(() => {
    const totals = cohorts.reduce(
      (acc, c) => ({
        accrued: acc.accrued + c.accruedTotal,
        releasable: acc.releasable + c.releasableNow,
        released: acc.released + c.releasedTotal,
        unassigned:
          acc.unassigned + (!c.leadInstructor && c.seatsTaken > 0 ? 1 : 0),
      }),
      { accrued: 0, releasable: 0, released: 0, unassigned: 0 },
    );

    const needsAttention = cohorts
      .filter((c) => attentionReason(c) !== null)
      .sort((a, b) => b.releasableNow - a.releasableNow);
    const attentionIds = new Set(needsAttention.map((c) => c.id));
    const quiet = cohorts.filter((c) => !attentionIds.has(c.id));

    return { totals, needsAttention, quiet };
  }, [cohorts]);

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
            ? `Nothing releasable yet. ${result.notYetEligible} accrual${result.notYetEligible === 1 ? " is" : "s are"} still inside the refund window or waiting for the cohort to start.`
            : "Nothing to release.",
        );
        return;
      }
      toast.success(
        `Released ${formatToNaira(result.total ?? 0)} across ${result.released} accrual${result.released === 1 ? "" : "s"}.`,
      );
    });
  };

  const row = (cohort: Cohort, index: number) => (
    <CohortRow
      key={cohort.id}
      cohort={cohort}
      index={index}
      instructors={instructors}
      busy={pending && busyId === cohort.id}
      onAssign={handleAssign}
      onRelease={handleRelease}
    />
  );

  return (
    <div className="container mx-auto space-y-8 px-6 py-8">
      <header>
        <h1 className="text-gradient mb-2 text-3xl font-bold">
          Program Revenue Share
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-gray-400">
          A lead instructor earns {LEAD_PERCENT}% of a program&apos;s full
          price, accrued as each installment is paid. Accrued money is recorded
          against the cohort but stays in the company account until it clears
          the {WINDOW_DAYS}-day refund window and the cohort has started.
        </p>
      </header>

      {/* One bordered strip rather than four separate cards: these are four
          stages of the same money, so they should read as one ledger. The
          dividers are set per cell because the grid rewraps from 2 to 4. */}
      <Card className="glass-card overflow-hidden border-white/10">
        <CardContent className="grid grid-cols-2 p-0 lg:grid-cols-4">
          <Stat
            label="Accrued, still held"
            value={formatToNaira(totals.accrued)}
            icon={<Clock className="h-3.5 w-3.5" />}
            divider="border-b border-r lg:border-b-0"
          />
          <Stat
            label="Releasable now"
            value={formatToNaira(totals.releasable)}
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            tone={totals.releasable > 0 ? "green" : undefined}
            divider="border-b lg:border-b-0 lg:border-r"
          />
          <Stat
            label="Released to wallets"
            value={formatToNaira(totals.released)}
            icon={<Wallet className="h-3.5 w-3.5" />}
            divider="border-r"
          />
          <Stat
            label="Awaiting a lead"
            value={
              totals.unassigned === 0
                ? "None"
                : `${totals.unassigned} cohort${totals.unassigned === 1 ? "" : "s"}`
            }
            icon={<TriangleAlert className="h-3.5 w-3.5" />}
            tone={totals.unassigned > 0 ? "amber" : undefined}
          />
        </CardContent>
      </Card>

      {cohorts.length === 0 && (
        <Card className="glass-card border-white/10">
          <CardContent className="p-10 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-gray-600" />
            <p className="text-sm text-gray-400">
              No program cohorts exist yet. Revenue share appears here once a
              cohort is created and a student pays.
            </p>
          </CardContent>
        </Card>
      )}

      {needsAttention.length > 0 && (
        <section className="space-y-3">
          <SectionHeading
            title="Needs attention"
            count={needsAttention.length}
          />
          {needsAttention.map(row)}
        </section>
      )}

      {quiet.length > 0 && (
        <section className="space-y-3">
          <SectionHeading
            title={needsAttention.length > 0 ? "Everything else" : "Cohorts"}
            count={quiet.length}
          />
          {quiet.map(row)}
        </section>
      )}
    </div>
  );
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
        {title}
      </h2>
      <span className="text-xs text-gray-500">{count}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function CohortRow({
  cohort,
  index,
  instructors,
  busy,
  onAssign,
  onRelease,
}: {
  cohort: Cohort;
  index: number;
  instructors: Instructor[];
  busy: boolean;
  onAssign: (cohortId: string, value: string) => void;
  onRelease: (cohortId: string) => void;
}) {
  const canRelease = cohort.releasableNow > 0;
  const reason = attentionReason(cohort);
  const lifetime = cohort.accruedTotal + cohort.releasedTotal;
  const startsOn = formatDate(cohort.startDate);
  const nextRelease = formatDate(cohort.nextReleaseAt);

  const pct = (part: number) =>
    lifetime > 0 ? Math.max(0, Math.min(100, (part / lifetime) * 100)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}>
      <Card
        className={`glass-card transition-colors ${
          canRelease
            ? "border-green-500/30 hover:border-green-500/50"
            : "border-white/10 hover:border-white/20"
        }`}>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
            <div className="min-w-[14rem] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-white">
                  {cohort.programName}
                </h3>
                {reason && (
                  <Badge
                    variant="outline"
                    className={
                      reason.tone === "green"
                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    }>
                    {reason.label}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {cohort.displayName}
                {startsOn && ` · starts ${startsOn}`} · {cohort.seatsTaken}{" "}
                enrolled
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {cohort.leadInstructor
                  ? `Lead: ${cohort.leadInstructor.name}`
                  : "No lead instructor assigned"}
              </p>
            </div>

            <div className="grid shrink-0 grid-cols-3 gap-x-8 text-right">
              <Figure label="Accrued" value={cohort.accruedTotal} />
              <Figure
                label="Releasable"
                value={cohort.releasableNow}
                tone={canRelease ? "green" : undefined}
              />
              <Figure label="Released" value={cohort.releasedTotal} />
            </div>
          </div>

          {lifetime > 0 && (
            <div
              className="flex h-1.5 overflow-hidden rounded-full bg-white/5"
              role="presentation">
              <div
                className="bg-gray-500/70"
                style={{ width: `${pct(cohort.releasedTotal)}%` }}
              />
              <div
                className="bg-green-500/80"
                style={{ width: `${pct(cohort.releasableNow)}%` }}
              />
            </div>
          )}

          {reason?.detail && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-300/90">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {reason.detail}
            </p>
          )}

          {!canRelease && cohort.accruedTotal > 0 && (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Held until{" "}
              {nextRelease ?? "the cohort starts"}. Accruals clear{" "}
              {WINDOW_DAYS} days after payment, and never before the cohort
              begins.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 shrink-0 text-gray-500" />
              <Select
                value={cohort.leadInstructor?.id ?? UNASSIGNED}
                onValueChange={(value) => onAssign(cohort.id, value)}
                disabled={busy}>
                <SelectTrigger className="w-[260px] border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Assign lead instructor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.name} · {instructor.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => onRelease(cohort.id)}
              disabled={busy || !canRelease}
              size="sm"
              className={
                canRelease
                  ? "bg-green-500/80 text-white hover:bg-green-500"
                  : undefined
              }>
              {busy
                ? "Working..."
                : canRelease
                  ? `Release ${cohort.releasableCount} to wallet`
                  : "Nothing to release"}
            </Button>

            {nextRelease && !canRelease && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <CalendarDays className="h-3.5 w-3.5" />
                Next eligible {nextRelease}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone,
  divider = "",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "green" | "amber";
  divider?: string;
}) {
  const valueColour =
    tone === "green"
      ? "text-green-400"
      : tone === "amber"
        ? "text-amber-400"
        : "text-white";
  return (
    <div className={`border-white/10 p-5 ${divider}`}>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className={tone ? valueColour : "text-gray-500"}>{icon}</span>
        {label}
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${valueColour}`}>
        {value}
      </p>
    </div>
  );
}

function Figure({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green";
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p
        className={`mt-0.5 text-base font-semibold tabular-nums ${
          tone === "green"
            ? "text-green-400"
            : value > 0
              ? "text-white"
              : "text-gray-600"
        }`}>
        {formatToNaira(value)}
      </p>
    </div>
  );
}
