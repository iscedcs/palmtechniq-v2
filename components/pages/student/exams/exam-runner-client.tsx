"use client";

import { recordExamEvent, submitExamAttempt } from "@/actions/exam-attempt";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Bookmark, Loader2, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { isAnswered, QuestionField } from "./question-field";
import { useExamAutosave } from "./use-exam-autosave";

export type RunnerQuestion = {
  id: string;
  sortOrder: number;
  stem: string;
  questionType: string;
  options: unknown;
  points: number;
  mediaUrls: string[];
  answer: unknown;
  isFlagged: boolean;
};

export type ExamRunnerProps = {
  examId: string;
  examTitle: string;
  attemptId: string;
  /** Server-computed. The client renders against this, it never decides it. */
  expiresAt: string;
  /** Server clock at render, used to correct for a wrong device clock. */
  serverTime: string;
  questions: RunnerQuestion[];
  onePerPage: boolean;
  allowBacktrack: boolean;
};

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function ExamRunnerClient({
  examId,
  examTitle,
  attemptId,
  expiresAt,
  serverTime,
  questions,
  onePerPage,
  allowBacktrack,
}: ExamRunnerProps) {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, q.answer])),
  );
  const [flagged, setFlagged] = useState<Set<string>>(
    () => new Set(questions.filter((q) => q.isFlagged).map((q) => q.id)),
  );
  const [seen, setSeen] = useState<Set<string>>(
    () => new Set([questions[0]?.id]),
  );
  const [index, setIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { queueAnswer, flushNow, status, lastSavedAt, pendingCount } =
    useExamAutosave(attemptId);

  // ── The clock ──
  // Trust the server's notion of "now", not the device's. A candidate whose
  // laptop clock is an hour slow still gets exactly their allotted time.
  const clockOffset = useRef(new Date(serverTime).getTime() - Date.now());
  const expiryMs = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const [remaining, setRemaining] = useState(
    () => expiryMs - (Date.now() + clockOffset.current),
  );

  const submittedRef = useRef(false);

  const doSubmit = useCallback(
    async (reason: "manual" | "expired") => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);

      // Drain anything still queued so the last answer counts.
      await flushNow();

      const result = await submitExamAttempt(attemptId);

      if ("error" in result && result.error) {
        toast.error(result.error);
        // Expiry is the server's call, so a rejection there is terminal either way.
        if (reason === "manual") {
          submittedRef.current = false;
          setSubmitting(false);
          return;
        }
      } else {
        toast.success(
          reason === "expired"
            ? "Time is up — your exam was submitted automatically."
            : "Your exam has been submitted.",
        );
      }

      router.replace(`/student/exams/${examId}?submitted=1`);
      router.refresh();
    },
    [attemptId, examId, flushNow, router],
  );

  useEffect(() => {
    const warned = { ten: false, five: false, one: false };

    const tick = setInterval(() => {
      const left = expiryMs - (Date.now() + clockOffset.current);
      setRemaining(left);

      const minutes = left / 60_000;
      if (!warned.ten && minutes <= 10 && minutes > 5) {
        warned.ten = true;
        toast.warning("10 minutes remaining.");
      } else if (!warned.five && minutes <= 5 && minutes > 1) {
        warned.five = true;
        toast.warning("5 minutes remaining.");
      } else if (!warned.one && minutes <= 1 && left > 0) {
        warned.one = true;
        toast.warning("1 minute remaining.");
      }

      if (left <= 0) {
        clearInterval(tick);
        void doSubmit("expired");
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [expiryMs, doSubmit]);

  // ── Integrity signals ──
  // Reported, never enforced. Leaving the tab does not end the exam.
  useEffect(() => {
    const onVisibility = () => {
      void recordExamEvent({
        attemptId,
        type: document.hidden ? "FOCUS_LOST" : "FOCUS_REGAINED",
      });
    };
    const onPaste = () => {
      void recordExamEvent({ attemptId, type: "PASTE" });
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("paste", onPaste);
    };
  }, [attemptId]);

  const setAnswer = useCallback(
    (questionId: string, answer: unknown) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));
      queueAnswer(questionId, answer, flagged.has(questionId));
    },
    [queueAnswer, flagged],
  );

  const toggleFlag = useCallback(
    (questionId: string) => {
      setFlagged((prev) => {
        const next = new Set(prev);
        if (next.has(questionId)) next.delete(questionId);
        else next.add(questionId);
        queueAnswer(questionId, answers[questionId], next.has(questionId));
        return next;
      });
    },
    [answers, queueAnswer],
  );

  const goTo = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(questions.length - 1, target));
      setIndex(clamped);
      const id = questions[clamped]?.id;
      if (id) setSeen((prev) => new Set(prev).add(id));
    },
    [questions],
  );

  const answeredCount = questions.filter((q) =>
    isAnswered(q.questionType, answers[q.id]),
  ).length;
  const unanswered = questions.length - answeredCount;

  const visible = onePerPage ? [questions[index]].filter(Boolean) : questions;
  const isUrgent = remaining <= 5 * 60_000;

  const saveLabel =
    status === "offline"
      ? `Offline — ${pendingCount} change${pendingCount === 1 ? "" : "s"} queued`
      : status === "saving"
        ? "Saving…"
        : status === "error"
          ? "Retrying…"
          : lastSavedAt
            ? `Saved ${lastSavedAt.toLocaleTimeString()}`
            : "No changes yet";

  return (
    <div className="mx-auto max-w-5xl px-4 pt-20">
      {/* Header: title, progress, clock */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{examTitle}</h1>
            <p className="text-xs text-gray-400">
              {answeredCount} of {questions.length} answered
              <span className="mx-2">·</span>
              <span
                className={cn(
                  status === "offline" || status === "error"
                    ? "text-amber-600 dark:text-amber-500"
                    : "",
                )}>
                {(status === "offline" || status === "error") && (
                  <WifiOff className="mr-1 inline size-3" />
                )}
                {saveLabel}
              </span>
            </p>
          </div>

          <div
            className={cn(
              "rounded-lg border px-4 py-2 text-center tabular-nums",
              isUrgent
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "bg-white/5",
            )}
            aria-live="polite">
            <div className="text-xl font-semibold">
              {formatRemaining(remaining)}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-gray-400">
              remaining
            </div>
          </div>
        </div>

        <Progress
          value={(answeredCount / Math.max(1, questions.length)) * 100}
          className="mt-3 h-1"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        {/* Questions */}
        <div className="space-y-6">
          {visible.map((question) => {
            const position = questions.findIndex((q) => q.id === question.id);
            return (
              <Card key={question.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Question {position + 1}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {question.points}{" "}
                          {question.points === 1 ? "point" : "points"}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-base font-medium">
                        {question.stem}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant={flagged.has(question.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFlag(question.id)}
                      aria-pressed={flagged.has(question.id)}>
                      <Bookmark className="mr-1 size-3.5" />
                      {flagged.has(question.id) ? "Marked" : "Mark for review"}
                    </Button>
                  </div>

                  {question.mediaUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {question.mediaUrls.map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={url}
                          src={url}
                          alt=""
                          className="max-h-64 rounded-lg border"
                        />
                      ))}
                    </div>
                  )}

                  <QuestionField
                    questionId={question.id}
                    questionType={question.questionType}
                    options={question.options}
                    answer={answers[question.id]}
                    disabled={submitting}
                    onChange={(value) => setAnswer(question.id, value)}
                  />
                </CardContent>
              </Card>
            );
          })}

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => goTo(index - 1)}
              disabled={
                !onePerPage || index === 0 || !allowBacktrack || submitting
              }>
              Previous
            </Button>

            {onePerPage && index < questions.length - 1 ? (
              <Button onClick={() => goTo(index + 1)} disabled={submitting}>
                Next
              </Button>
            ) : (
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={submitting}>
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Submit exam
              </Button>
            )}
          </div>
        </div>

        {/* Navigator */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                Questions
              </p>
              <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-5">
                {questions.map((q, i) => {
                  const done = isAnswered(q.questionType, answers[q.id]);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Question ${i + 1}${done ? ", answered" : ""}${
                        flagged.has(q.id) ? ", marked for review" : ""
                      }`}
                      aria-current={i === index}
                      className={cn(
                        "relative aspect-square rounded-md border text-xs font-medium transition-colors",
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : seen.has(q.id)
                            ? "bg-white/10"
                            : "bg-background",
                        i === index && "ring-2 ring-ring ring-offset-1",
                      )}>
                      {i + 1}
                      {flagged.has(q.id) && (
                        <Bookmark className="absolute -right-0.5 -top-0.5 size-2.5 fill-amber-500 text-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <dl className="mt-4 space-y-1 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-sm bg-primary" />
                  <span>{answeredCount} answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bookmark className="size-3 fill-amber-500 text-amber-500" />
                  <span>{flagged.size} marked for review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-sm border bg-background" />
                  <span>{unanswered} unanswered</span>
                </div>
              </dl>

              <Button
                className="mt-4 w-full"
                onClick={() => setConfirmOpen(true)}
                disabled={submitting}>
                Submit exam
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your exam?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {unanswered > 0 ? (
                  <p className="font-medium text-destructive">
                    {unanswered} question{unanswered === 1 ? " is" : "s are"}{" "}
                    still unanswered.
                  </p>
                ) : (
                  <p>All {questions.length} questions are answered.</p>
                )}
                {flagged.size > 0 && (
                  <p>
                    {flagged.size} question
                    {flagged.size === 1 ? " is" : "s are"} flagged for review.
                  </p>
                )}
                <p className="text-gray-400">
                  You cannot change your answers after submitting.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              Keep working
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void doSubmit("manual");
              }}
              disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
