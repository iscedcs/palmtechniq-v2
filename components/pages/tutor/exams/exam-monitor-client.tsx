"use client";

import { forceSubmit, grantAnotherAttempt, grantExtraTime } from "@/actions/exam-monitor";
import { getAttemptEvents, type MonitorSnapshot } from "@/data/exam-monitor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AlertTriangle, Flag, Loader2, Plus, RefreshCw, StopCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const REFRESH_MS = 15_000;

type AttemptEvent = {
  id: string;
  type: string;
  severity: string;
  ipAddress: string | null;
  createdAt: Date;
};

const SIGNAL_LABEL: Record<string, string> = {
  ATTEMPT_STARTED: "Started the exam",
  ATTEMPT_SUBMITTED: "Submitted",
  FOCUS_LOST: "Left the exam tab",
  FOCUS_REGAINED: "Came back to the tab",
  PASTE: "Pasted content",
  FULLSCREEN_EXIT: "Left fullscreen",
  IP_CHANGED: "Network address changed",
  DISCONNECTED: "Lost connection",
  RECONNECTED: "Reconnected",
  SECOND_DEVICE_BLOCKED: "Blocked a second device",
  TIME_ANOMALY: "Clock anomaly",
  EXTRA_TIME_GRANTED: "You granted extra time",
  FORCE_SUBMITTED: "You submitted this for them",
};

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function ExamMonitorClient({ snapshot }: { snapshot: MonitorSnapshot }) {
  const router = useRouter();

  // Same trick as the runner: count down against the server's clock, not the
  // invigilator's, so the monitor never disagrees with the engine.
  const clockOffset = useRef(new Date(snapshot.serverTime).getTime() - Date.now());
  const [, setTick] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [extending, setExtending] = useState<{ id: string; name: string } | null>(null);
  const [extraMinutes, setExtraMinutes] = useState(10);

  // Signal drill-down
  const [signalsFor, setSignalsFor] = useState<string | null>(null);
  const [signals, setSignals] = useState<AttemptEvent[] | null>(null);

  const openSignals = async (attemptId: string, name: string) => {
    setSignalsFor(name);
    setSignals(null);
    const events = await getAttemptEvents(attemptId);
    setSignals(events as AttemptEvent[]);
  };

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(t);
  }, [autoRefresh, router]);

  const serverNow = () => Date.now() + clockOffset.current;

  const handleForceSubmit = async (attemptId: string, name: string) => {
    setBusy(attemptId);
    const result = await forceSubmit(attemptId);
    setBusy(null);
    if ("error" in result) toast.error(result.error);
    else {
      toast.success(`${name}'s exam submitted`);
      router.refresh();
    }
  };

  const handleExtend = async () => {
    if (!extending) return;
    setBusy(extending.id);
    const result = await grantExtraTime(extending.id, extraMinutes);
    setBusy(null);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.appliedToRunningAttempt
        ? `${extending.name} now has ${extraMinutes} more minutes on their running attempt`
        : `${extraMinutes} extra minutes saved for ${extending.name}'s next attempt`,
    );
    setExtending(null);
    router.refresh();
  };

  const { counts } = snapshot;
  const live = counts.total > 0 ? (counts.submitted / counts.total) * 100 : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-20">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/tutor/exams/${snapshot.examId}`}
            className="text-sm text-gray-400 hover:underline">
            ← Back to exam
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{snapshot.title}</h1>
          {/* A div, not a p — Badge renders a div, which is invalid inside a p
              and causes a hydration mismatch. */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Live monitor ·</span>
            <Badge variant="secondary">{snapshot.status.toLowerCase()}</Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={cn("mr-2 size-4", autoRefresh && "animate-spin")} />
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          ["Not started", counts.notStarted, ""],
          ["Sitting now", counts.inProgress, "text-emerald-500"],
          ["Submitted", counts.submitted, ""],
          ["Missed", counts.missed, counts.missed > 0 ? "text-destructive" : ""],
        ].map(([label, value, tone]) => (
          <Card key={label as string}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-400">{label as string}</p>
              <p className={cn("text-2xl font-semibold", tone as string)}>
                {value as number}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Progress value={live} className="mb-6 h-1.5" />

      <Card>
        <CardContent className="p-0">
          {snapshot.rows.length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-400">
              Nobody is on the roster for this exam.
            </p>
          ) : (
            <ul className="divide-y">
              {snapshot.rows.map((row) => {
                const isLive = row.attemptStatus === "IN_PROGRESS";
                const remaining = row.expiresAt
                  ? new Date(row.expiresAt).getTime() - serverNow()
                  : 0;
                const urgent = isLive && remaining <= 5 * 60_000;

                // No heartbeat for two minutes on a live attempt usually means
                // the tab is closed or the connection dropped.
                const stale =
                  isLive &&
                  row.lastHeartbeatAt &&
                  serverNow() - new Date(row.lastHeartbeatAt).getTime() > 120_000;

                return (
                  <li
                    key={row.candidateId}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 p-4",
                      row.excluded && "opacity-50",
                    )}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{row.name}</span>

                        {isLive ? (
                          <Badge variant="default">sitting</Badge>
                        ) : row.attemptStatus === "AUTO_SUBMITTED" ? (
                          <Badge variant="outline">auto-submitted</Badge>
                        ) : row.attemptStatus ? (
                          <Badge variant="outline">
                            {row.submittedBy === "TUTOR" ? "force-submitted" : "submitted"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">not started</Badge>
                        )}

                        {row.excluded && <Badge variant="destructive">excluded</Badge>}
                        {row.extraTimeMinutes > 0 && (
                          <Badge variant="outline">+{row.extraTimeMinutes}m</Badge>
                        )}
                        {row.flags.total > 0 && row.attemptId && (
                          <button
                            type="button"
                            onClick={() =>
                              openSignals(row.attemptId!, row.name)
                            }
                            title="Integrity signals — for review, not a verdict. Click for detail.">
                            <Badge
                              // Weight from the count as well as stored severity:
                              // signals recorded before the escalation rule existed
                              // are all INFO, and should still stand out.
                              variant={
                                row.flags.critical > 0 ||
                                row.flags.warning > 0 ||
                                row.flags.total >= 5
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="cursor-pointer hover:opacity-80">
                              <Flag className="mr-1 size-3" />
                              {row.flags.breakdown
                                .map((b) => b.label)
                                .join(" · ")}
                            </Badge>
                          </button>
                        )}
                        {stale && (
                          <Badge variant="secondary" title="No activity for over 2 minutes">
                            <AlertTriangle className="mr-1 size-3" />
                            idle
                          </Badge>
                        )}
                      </div>

                      <p className="mt-0.5 text-xs text-gray-400">
                        {row.email}
                        {row.attemptId && (
                          <>
                            {" · "}
                            {row.answered}/{row.totalQuestions} answered
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {isLive && (
                        <span
                          className={cn(
                            "tabular-nums text-sm font-medium",
                            urgent && "text-destructive",
                          )}>
                          {formatRemaining(remaining)}
                        </span>
                      )}

                      <div className="flex gap-1">
                        {isLive && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setExtending({ id: row.candidateId, name: row.name })
                              }>
                              <Plus className="mr-1 size-3.5" />
                              Time
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy === row.attemptId}
                              onClick={() =>
                                row.attemptId &&
                                handleForceSubmit(row.attemptId, row.name)
                              }>
                              {busy === row.attemptId ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <StopCircle className="size-3.5" />
                              )}
                            </Button>
                          </>
                        )}

                        {!isLive && row.attemptId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy === row.candidateId}
                            onClick={async () => {
                              setBusy(row.candidateId);
                              const result = await grantAnotherAttempt(row.candidateId);
                              setBusy(null);
                              if ("error" in result) toast.error(result.error);
                              else {
                                toast.success(`${row.name} can sit again`);
                                router.refresh();
                              }
                            }}>
                            Allow retry
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-gray-400">
        Integrity flags record tab switches, pasting and reconnections. They are for
        your review — nothing here penalises a student automatically.
      </p>

      {/* Signal drill-down — the full timeline for one attempt */}
      <Dialog
        open={!!signalsFor}
        onOpenChange={(open) => {
          if (!open) {
            setSignalsFor(null);
            setSignals(null);
          }
        }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Activity for {signalsFor}</DialogTitle>
          </DialogHeader>

          {signals === null ? (
            <p className="py-6 text-center text-sm text-gray-400">
              <Loader2 className="mr-2 inline size-4 animate-spin" />
              Loading…
            </p>
          ) : signals.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Nothing recorded for this attempt.
            </p>
          ) : (
            <ul className="space-y-1">
              {signals.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-3 rounded border p-2 text-sm">
                  <span
                    className={cn(
                      event.severity === "CRITICAL"
                        ? "text-destructive"
                        : event.severity === "WARNING"
                          ? "text-amber-500"
                          : "",
                    )}>
                    {SIGNAL_LABEL[event.type] ?? event.type}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-gray-400">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-gray-400">
            A record of what happened, not an accusation. Leaving the tab has many
            innocent explanations — it is for you to judge in context.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={!!extending} onOpenChange={(open) => !open && setExtending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Give {extending?.name} more time</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label>Extra minutes</Label>
            <Input
              type="number"
              min={1}
              value={extraMinutes}
              onChange={(e) => setExtraMinutes(Number(e.target.value))}
              className="max-w-32"
            />
            <p className="text-xs text-gray-400">
              Added to their running attempt straight away, and to any future attempt.
              Their personal window is extended too, so the exam closing will not cut
              the extension short.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExtending(null)}>
              Cancel
            </Button>
            <Button onClick={handleExtend} disabled={busy === extending?.id}>
              {busy === extending?.id && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
