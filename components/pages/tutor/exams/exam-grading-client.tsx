"use client";

import { gradeResponse, overrideGrade, releaseResults } from "@/actions/exam-grading";
import type { ExamResultRow, GradingQueueItem } from "@/data/exam-grading";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AlertCircle, Award, CheckCircle2, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ItemStat = {
  id: string;
  stem: string;
  points: number;
  answered: number;
  correct: number;
  correctRate: number;
  averageScore: number;
};

export function ExamGradingClient({
  examId,
  examTitle,
  isFinalAssessment,
  isCourseScoped,
  queue,
  results,
  itemAnalysis,
}: {
  examId: string;
  examTitle: string;
  isFinalAssessment: boolean;
  isCourseScoped: boolean;
  queue: GradingQueueItem[];
  results: ExamResultRow[];
  itemAnalysis: ItemStat[];
}) {
  const router = useRouter();

  const [anonymous, setAnonymous] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { score: string; feedback: string }>>(
    () =>
      Object.fromEntries(
        queue.map((q) => [
          q.responseId,
          { score: q.manualScore?.toString() ?? "", feedback: q.feedback ?? "" },
        ]),
      ),
  );

  const [overriding, setOverriding] = useState<ExamResultRow | null>(null);
  const [overrideValue, setOverrideValue] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [releasing, setReleasing] = useState(false);

  const ungraded = queue.filter((q) => q.manualScore === null);
  const grouped = useMemo(() => {
    const map = new Map<string, GradingQueueItem[]>();
    for (const item of queue) {
      const list = map.get(item.questionId) ?? [];
      list.push(item);
      map.set(item.questionId, list);
    }
    return Array.from(map.values());
  }, [queue]);

  const pendingCount = results.filter((r) => r.status === "PENDING_MANUAL").length;
  const readyCount = results.filter((r) => r.status === "GRADED").length;
  const releasedCount = results.filter((r) => r.status === "RELEASED").length;

  const handleGrade = async (item: GradingQueueItem) => {
    const draft = drafts[item.responseId];
    const score = Number(draft?.score);

    if (!Number.isFinite(score)) {
      toast.error("Enter a score");
      return;
    }

    setBusy(item.responseId);
    const result = await gradeResponse({
      responseId: item.responseId,
      score,
      feedback: draft?.feedback,
    });
    setBusy(null);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Marked");
    router.refresh();
  };

  const handleRelease = async () => {
    setReleasing(true);
    const result = await releaseResults(examId);
    setReleasing(false);

    // `"error" in result` alone — adding `&& result.error` stops TypeScript
    // narrowing the union on the branch that continues.
    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    if (result.released === 0) {
      toast.warning(result.certificateNote ?? "Nothing was ready to release");
    } else {
      toast.success(
        `Released ${result.released} result${result.released === 1 ? "" : "s"}` +
          (result.certificatesIssued > 0
            ? ` · ${result.certificatesIssued} certificate${
                result.certificatesIssued === 1 ? "" : "s"
              } issued`
            : ""),
      );
      if (result.certificateNote) toast.info(result.certificateNote);
      if (result.skippedPendingManual > 0) {
        toast.info(
          `${result.skippedPendingManual} paper${
            result.skippedPendingManual === 1 ? "" : "s"
          } still need marking and were not released.`,
        );
      }
    }
    router.refresh();
  };

  const handleOverride = async () => {
    if (!overriding) return;
    setBusy(overriding.gradeId);
    const result = await overrideGrade({
      gradeId: overriding.gradeId,
      newTotal: Number(overrideValue),
      reason: overrideReason,
    });
    setBusy(null);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Score overridden");
    setOverriding(null);
    setOverrideReason("");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pt-20">
      <div className="mb-6">
        <Link href={`/tutor/exams/${examId}`} className="text-sm text-gray-400 hover:underline">
          ← Back to exam
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{examTitle}</h1>
        <p className="text-sm text-gray-400">Grading and results</p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Awaiting marking", pendingCount, "text-amber-500"],
          ["Ready to release", readyCount, "text-emerald-500"],
          ["Released", releasedCount, ""],
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

      {isFinalAssessment && !isCourseScoped && (
        <Alert className="mb-6">
          <AlertCircle className="size-4" />
          <AlertDescription>
            This is marked as a final assessment, but certificates are tied to a
            course and this exam is not course-scoped. Results will release
            normally; no certificates will be issued.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Queue ({ungraded.length})</TabsTrigger>
          <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
          <TabsTrigger value="analysis">Question analysis</TabsTrigger>
        </TabsList>

        {/* ── Marking queue ── */}
        <TabsContent value="queue" className="mt-4 space-y-4">
          {queue.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-500" />
                <p className="font-medium">Nothing to mark</p>
                <p className="mt-1 text-sm text-gray-400">
                  Every question on this exam is marked automatically, or no one has
                  submitted yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Anonymous marking</p>
                  <p className="text-xs text-gray-400">
                    Hides names while you mark, to keep the standard even.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={anonymous ? "default" : "outline"}
                  onClick={() => setAnonymous(!anonymous)}>
                  {anonymous ? "On" : "Off"}
                </Button>
              </div>

              {grouped.map((group) => (
                <Card key={group[0].questionId}>
                  <CardContent className="p-5">
                    <div className="mb-4">
                      <Badge variant="secondary" className="mb-2">
                        {group[0].points} points · {group.length} answer
                        {group.length === 1 ? "" : "s"}
                      </Badge>
                      <p className="whitespace-pre-wrap font-medium">{group[0].stem}</p>
                    </div>

                    <div className="space-y-4">
                      {group.map((item, i) => (
                        <div key={item.responseId} className="rounded-lg border p-4">
                          <p className="mb-2 text-xs text-gray-400">
                            {anonymous ? `Candidate ${i + 1}` : item.candidateName}
                            {item.manualScore !== null && (
                              <span className="ml-2 text-emerald-500">
                                marked {item.manualScore}/{item.points}
                              </span>
                            )}
                          </p>

                          <div className="mb-3 whitespace-pre-wrap rounded bg-white/5 p-3 text-sm">
                            {typeof item.answer === "string" && item.answer.trim()
                              ? item.answer
                              : "— no answer given —"}
                          </div>

                          <div className="flex flex-wrap items-end gap-3">
                            <div className="w-28 space-y-1.5">
                              <Label className="text-xs">Score (of {item.points})</Label>
                              <Input
                                type="number"
                                min={0}
                                max={item.points}
                                value={drafts[item.responseId]?.score ?? ""}
                                onChange={(e) =>
                                  setDrafts((d) => ({
                                    ...d,
                                    [item.responseId]: {
                                      ...d[item.responseId],
                                      score: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div className="min-w-48 flex-1 space-y-1.5">
                              <Label className="text-xs">Feedback (optional)</Label>
                              <Textarea
                                rows={2}
                                value={drafts[item.responseId]?.feedback ?? ""}
                                onChange={(e) =>
                                  setDrafts((d) => ({
                                    ...d,
                                    [item.responseId]: {
                                      ...d[item.responseId],
                                      feedback: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                            <Button
                              onClick={() => handleGrade(item)}
                              disabled={busy === item.responseId}>
                              {busy === item.responseId && (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                              )}
                              Save mark
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* ── Results ── */}
        <TabsContent value="results" className="mt-4 space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-medium">Release results</p>
                <p className="text-sm text-gray-400">
                  {readyCount === 0
                    ? "Nothing is fully marked yet."
                    : `${readyCount} result${readyCount === 1 ? "" : "s"} ready.`}
                  {pendingCount > 0 &&
                    ` ${pendingCount} still awaiting marking will be left alone.`}
                  {isFinalAssessment &&
                    isCourseScoped &&
                    " Passing students will be issued a certificate."}
                </p>
              </div>
              <Button onClick={handleRelease} disabled={releasing || readyCount === 0}>
                {releasing ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : isFinalAssessment && isCourseScoped ? (
                  <Award className="mr-2 size-4" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                Release {readyCount > 0 ? readyCount : ""}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              {results.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  No submissions yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {results.map((row) => (
                    <li
                      key={row.gradeId}
                      className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{row.candidateName}</span>
                          <Badge
                            variant={
                              row.status === "RELEASED"
                                ? "outline"
                                : row.status === "PENDING_MANUAL"
                                  ? "secondary"
                                  : "default"
                            }>
                            {row.status.toLowerCase().replace("_", " ")}
                          </Badge>
                          {row.overridden && <Badge variant="outline">overridden</Badge>}
                          {row.certificateId && (
                            <Badge variant="default">
                              <Award className="mr-1 size-3" />
                              certificate
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{row.candidateEmail}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p
                            className={cn(
                              "font-semibold tabular-nums",
                              row.status !== "PENDING_MANUAL" &&
                                (row.passed ? "text-emerald-500" : "text-destructive"),
                            )}>
                            {row.totalScore}/{row.maxScore}
                          </p>
                          <p className="text-xs text-gray-400">
                            {row.percentage.toFixed(0)}%
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setOverriding(row);
                            setOverrideValue(String(row.totalScore));
                            setOverrideReason("");
                          }}>
                          Override
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Item analysis ── */}
        <TabsContent value="analysis" className="mt-4">
          <Card>
            <CardContent className="p-5">
              {itemAnalysis.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  Statistics appear once students have submitted.
                </p>
              ) : (
                <ul className="space-y-4">
                  {itemAnalysis.map((item, i) => (
                    <li key={item.id}>
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <p className="text-sm">
                          <span className="text-gray-400">{i + 1}.</span> {item.stem}
                        </p>
                        <span className="shrink-0 text-sm tabular-nums text-gray-400">
                          {item.correctRate.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={item.correctRate} className="h-1.5" />
                      <p className="mt-1 text-xs text-gray-400">
                        {item.correct} of {item.answered} correct · average{" "}
                        {item.averageScore.toFixed(1)}/{item.points}
                        {item.correctRate < 40 && (
                          <span className="ml-2 text-amber-500">
                            worth reviewing in class
                          </span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Override dialog */}
      <Dialog open={!!overriding} onOpenChange={(open) => !open && setOverriding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override {overriding?.candidateName}&apos;s score</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Score (of {overriding?.maxScore})</Label>
              <Input
                type="number"
                min={0}
                max={overriding?.maxScore}
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
                className="max-w-32"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Why is this score being changed?"
              />
              <p className="text-xs text-gray-400">
                Recorded against this grade permanently, with your name and the time.
              </p>
            </div>

            {overriding?.certificateId && (
              <Alert>
                <AlertCircle className="size-4" />
                <AlertDescription>
                  A certificate has been issued for this result. Dropping the score
                  below the pass mark will revoke it.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverriding(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleOverride}
              disabled={!overrideReason.trim() || busy === overriding?.gradeId}>
              {busy === overriding?.gradeId && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
