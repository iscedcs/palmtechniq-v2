"use client";

import { startExamAttempt } from "@/actions/exam-attempt";
import type { ExamBriefing } from "@/data/exam";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, FileText, Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * The pre-exam briefing: what the candidate is walking into, and the deliberate
 * act of starting.
 *
 * The device token is generated here and kept in sessionStorage. It survives a
 * refresh — so reloading resumes cleanly — but does not survive a different
 * browser, which is what lets the server tell a reconnect apart from a second device.
 */

const DEVICE_TOKEN_KEY = (examId: string) => `exam-device-token:${examId}`;

function getDeviceToken(examId: string): string {
  const key = DEVICE_TOKEN_KEY(examId);
  let token = sessionStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem(key, token);
  }
  return token;
}

export function ExamBriefingClient({
  briefing,
  justSubmitted,
}: {
  briefing: ExamBriefing;
  justSubmitted: boolean;
}) {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Keeps the countdown to the window opening honest without a refresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const canStart =
    briefing.availability === "OPEN" || briefing.availability === "IN_PROGRESS";

  const handleStart = async () => {
    setStarting(true);

    const result = await startExamAttempt(briefing.id, {
      accessCode: accessCode.trim() || undefined,
      deviceToken: getDeviceToken(briefing.id),
    });

    if ("error" in result && result.error) {
      toast.error(result.error);
      setStarting(false);
      // The roster or the window may have moved on since this page rendered.
      router.refresh();
      return;
    }

    router.push(`/student/exams/${briefing.id}/sit`);
  };

  const minutes = Math.round(
    (briefing.durationMinutes ?? 0) * briefing.extraTimeMultiplier +
      briefing.extraTimeMinutes,
  );
  const hasAccommodation =
    briefing.extraTimeMultiplier !== 1 || briefing.extraTimeMinutes > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {justSubmitted && (
        <Alert className="mb-6 border-emerald-500/40 bg-emerald-500/5">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <AlertDescription>
            Your exam has been submitted. Results will appear here once your tutor
            releases them.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        {briefing.courseTitle && (
          <p className="text-sm text-gray-400">{briefing.courseTitle}</p>
        )}
        <h1 className="text-2xl font-semibold">{briefing.title}</h1>
        {briefing.description && (
          <p className="mt-2 text-gray-400">{briefing.description}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What to expect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-gray-400">Duration</dt>
              <dd className="mt-0.5 font-medium">{minutes} min</dd>
            </div>
            <div>
              <dt className="text-gray-400">Questions</dt>
              <dd className="mt-0.5 font-medium">{briefing.questionCount}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Total marks</dt>
              <dd className="mt-0.5 font-medium">{briefing.totalPoints}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Pass mark</dt>
              <dd className="mt-0.5 font-medium">{briefing.passingScore}%</dd>
            </div>
          </dl>

          {hasAccommodation && (
            <Alert>
              <Clock className="size-4" />
              <AlertDescription>
                You have been granted extra time for this exam. Your duration above
                already includes it.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-400">Opens</span>{" "}
              {briefing.opensAt ? new Date(briefing.opensAt).toLocaleString() : "—"}
            </p>
            <p>
              <span className="text-gray-400">Closes</span>{" "}
              {briefing.closesAt ? new Date(briefing.closesAt).toLocaleString() : "—"}
            </p>
            <p>
              <span className="text-gray-400">Attempts</span>{" "}
              {briefing.attemptsUsed} of {briefing.attemptsAllowed} used
            </p>
          </div>

          {briefing.instructions && (
            <>
              <Separator />
              <div>
                <p className="mb-1 flex items-center gap-2 text-sm font-medium">
                  <FileText className="size-4" />
                  Instructions
                </p>
                <p className="whitespace-pre-wrap text-sm text-gray-400">
                  {briefing.instructions}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* State-specific calls to action */}
      <div className="mt-6">
        {briefing.availability === "UPCOMING" && briefing.opensAt && (
          <Alert>
            <Clock className="size-4" />
            <AlertDescription>
              This exam opens on {new Date(briefing.opensAt).toLocaleString()}.
              {(() => {
                const until = new Date(briefing.opensAt).getTime() - now;
                if (until <= 0) return " Refresh to begin.";
                const hours = Math.floor(until / 3_600_000);
                const mins = Math.floor((until % 3_600_000) / 60_000);
                return ` That is in ${hours > 0 ? `${hours}h ` : ""}${mins}m.`;
              })()}
            </AlertDescription>
          </Alert>
        )}

        {briefing.availability === "MISSED" && (
          <Alert variant="destructive">
            <ShieldAlert className="size-4" />
            <AlertDescription>
              The window for this exam has closed and no attempt was recorded. Speak to
              your tutor if you believe this is wrong.
            </AlertDescription>
          </Alert>
        )}

        {briefing.availability === "SUBMITTED" && (
          <Card>
            <CardContent className="p-5">
              {briefing.resultReleased ? (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Your result</p>
                    <p className="text-2xl font-semibold">
                      {briefing.percentage?.toFixed(1)}%
                    </p>
                  </div>
                  <Badge variant={briefing.passed ? "default" : "destructive"}>
                    {briefing.passed ? "Passed" : "Not passed"}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Your submission has been received. Results will appear here once your
                  tutor releases them.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {canStart && (
          <Card>
            <CardContent className="space-y-4 p-5">
              {briefing.availability === "IN_PROGRESS" && (
                <Alert>
                  <Clock className="size-4" />
                  <AlertDescription>
                    You have an attempt in progress. Continuing returns you to it with
                    the time you have left — the clock has been running.
                  </AlertDescription>
                </Alert>
              )}

              {briefing.requiresAccessCode && (
                <div className="space-y-1.5">
                  <Label htmlFor="access-code">Access code</Label>
                  <Input
                    id="access-code"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Given by your tutor"
                    className="max-w-xs"
                    autoComplete="off"
                  />
                </div>
              )}

              <Label className="flex cursor-pointer items-start gap-3 text-sm font-normal">
                <Checkbox
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                  className="mt-0.5"
                />
                <span>
                  I confirm this is my own work and that I will not use unauthorised
                  help. Switching tabs is recorded and reviewed by my tutor.
                </span>
              </Label>

              <Button
                onClick={handleStart}
                disabled={
                  !agreed ||
                  starting ||
                  (briefing.requiresAccessCode && accessCode.trim() === "")
                }
                size="lg"
                className="w-full sm:w-auto">
                {starting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {briefing.availability === "IN_PROGRESS"
                  ? "Continue exam"
                  : "Start exam"}
              </Button>

              <p className="text-xs text-gray-400">
                Once you start, the timer runs on our servers and does not pause — even
                if you close this page.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
