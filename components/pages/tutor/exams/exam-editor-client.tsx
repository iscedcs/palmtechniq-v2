"use client";

import { getPublishChecklist, publishExam } from "@/actions/exam";
import { updateExam } from "@/actions/exam-authoring";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { TutorExamDetail } from "@/data/tutor-exam";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  MonitorDot,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ExamQuestionsTab } from "./exam-questions-tab";
import { ExamRosterTab } from "./exam-roster-tab";

/** Datetime-local wants "YYYY-MM-DDTHH:mm" in local time, not an ISO string. */
function toLocalInput(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function ExamEditorClient({
  exam,
  banks = [],
  poolCounts = {},
}: {
  exam: TutorExamDetail;
  banks?: { id: string; title: string; questionCount: number }[];
  poolCounts?: Record<string, number>;
}) {
  const router = useRouter();

  const isDraft = exam.status === "DRAFT";
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [problems, setProblems] = useState<
    { field: string; message: string }[] | null
  >(null);

  const [form, setForm] = useState({
    title: exam.title,
    description: exam.description ?? "",
    instructions: exam.instructions ?? "",
    opensAt: toLocalInput(exam.opensAt),
    closesAt: toLocalInput(exam.closesAt),
    durationMinutes: exam.durationMinutes ?? 60,
    maxAttempts: exam.maxAttempts,
    passingScore: exam.passingScore,
    shuffleQuestions: exam.shuffleQuestions,
    shuffleOptions: exam.shuffleOptions,
    onePerPage: exam.onePerPage,
    allowBacktrack: exam.allowBacktrack,
    accessMode: exam.accessMode,
    accessCode: exam.accessCode ?? "",
    resultsPolicy: exam.resultsPolicy,
    showCorrectAnswers: exam.showCorrectAnswers,
    showExplanations: exam.showExplanations,
    isFinalAssessment: exam.isFinalAssessment,
  });

  const handleSave = async () => {
    setSaving(true);

    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description || null,
      instructions: form.instructions || null,
      passingScore: form.passingScore,
      shuffleQuestions: form.shuffleQuestions,
      shuffleOptions: form.shuffleOptions,
      onePerPage: form.onePerPage,
      allowBacktrack: form.allowBacktrack,
      accessMode: form.accessMode,
      accessCode: form.accessCode || null,
      resultsPolicy: form.resultsPolicy,
      showCorrectAnswers: form.showCorrectAnswers,
      showExplanations: form.showExplanations,
      isFinalAssessment: form.isFinalAssessment,
    };

    // The server refuses these after publish; don't even send them.
    if (isDraft) {
      payload.opensAt = form.opensAt ? new Date(form.opensAt) : null;
      payload.closesAt = form.closesAt ? new Date(form.closesAt) : null;
      payload.durationMinutes = form.durationMinutes;
      payload.maxAttempts = form.maxAttempts;
    }

    const result = await updateExam(exam.id, payload);

    if ("error" in result && result.error) toast.error(result.error);
    else toast.success("Saved");

    setSaving(false);
    router.refresh();
  };

  const handleCheck = async () => {
    const result = await getPublishChecklist(exam.id);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    setProblems(result.problems ?? []);
    if (result.ready) toast.success("This exam is ready to publish");
  };

  const handlePublish = async () => {
    setPublishing(true);

    // Save first — publishing validates what is stored, not what is on screen.
    await handleSave();

    const result = await publishExam(exam.id);

    if ("error" in result && result.error) {
      toast.error(result.error);
      setProblems(result.problems ?? null);
      setPublishing(false);
      return;
    }

    toast.success(
      `Published to ${result.candidateCount} candidate${
        result.candidateCount === 1 ? "" : "s"
      }`,
    );
    setPublishing(false);
    router.refresh();
  };

  const scopeLabel =
    exam.course?.title ??
    exam.cohort?.displayName ??
    exam.track?.name ??
    "Selected students";

  return (
    <div className="mx-auto max-w-4xl px-4 pt-20">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{exam.title}</h1>
            <Badge variant={isDraft ? "secondary" : "default"}>
              {exam.status.toLowerCase()}
            </Badge>
          </div>
          <p className="text-sm text-gray-400">{scopeLabel}</p>
        </div>

        <div className="flex gap-2">
          {!isDraft && (
            <>
              <Button asChild variant="outline">
                <Link href={`/tutor/exams/${exam.id}/monitor`}>
                  <MonitorDot className="mr-2 size-4" />
                  Monitor
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/tutor/exams/${exam.id}/grading`}>
                  <ClipboardCheck className="mr-2 size-4" />
                  Grading &amp; results
                </Link>
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
          {isDraft && (
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Rocket className="mr-2 size-4" />
              )}
              Publish
            </Button>
          )}
        </div>
      </div>

      {!isDraft && (
        <Alert className="mb-6">
          <AlertCircle className="size-4" />
          <AlertDescription>
            This exam is published. Questions, sections and the schedule are
            locked; wording, results settings and the roster can still be
            changed.
          </AlertDescription>
        </Alert>
      )}

      {problems && problems.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="size-4" />
          <AlertDescription>
            <p className="mb-1 font-medium">Not ready to publish:</p>
            <ul className="list-inside list-disc space-y-0.5">
              {problems.map((p, i) => (
                <li key={i}>{p.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {problems && problems.length === 0 && (
        <Alert className="mb-6 border-emerald-500/40 bg-emerald-500/5">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <AlertDescription>
            Everything checks out. Ready to publish.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">
            Questions (
            {exam.sections.reduce((n, s) => n + s.questions.length, 0)})
          </TabsTrigger>
          <TabsTrigger value="settings">Schedule &amp; rules</TabsTrigger>
          <TabsTrigger value="roster">
            Roster ({exam.candidates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-4">
          <ExamQuestionsTab
            examId={exam.id}
            sections={exam.sections}
            editable={isDraft}
            banks={banks}
            poolCounts={poolCounts}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Instructions</Label>
                <Textarea
                  value={form.instructions}
                  onChange={(e) =>
                    setForm({ ...form, instructions: e.target.value })
                  }
                  placeholder="Shown on the briefing page before students start."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Opens</Label>
                <Input
                  type="datetime-local"
                  value={form.opensAt}
                  disabled={!isDraft}
                  onChange={(e) =>
                    setForm({ ...form, opensAt: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Closes</Label>
                <Input
                  type="datetime-local"
                  value={form.closesAt}
                  disabled={!isDraft}
                  onChange={(e) =>
                    setForm({ ...form, closesAt: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.durationMinutes}
                  disabled={!isDraft}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-gray-400">
                  Must fit inside the window above.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Attempts allowed</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxAttempts}
                  disabled={!isDraft}
                  onChange={(e) =>
                    setForm({ ...form, maxAttempts: Number(e.target.value) })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Pass mark (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="max-w-32"
                  value={form.passingScore}
                  onChange={(e) =>
                    setForm({ ...form, passingScore: Number(e.target.value) })
                  }
                />
              </div>

              {[
                ["shuffleQuestions", "Shuffle the question order"],
                ["shuffleOptions", "Shuffle the answer options"],
                ["onePerPage", "Show one question per page"],
                ["allowBacktrack", "Allow going back to earlier questions"],
                [
                  "isFinalAssessment",
                  "This is the final assessment (issues a certificate on pass)",
                ],
              ].map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4">
                  <Label htmlFor={key} className="font-normal">
                    {label}
                  </Label>
                  <Switch
                    id={key}
                    checked={form[key as keyof typeof form] as boolean}
                    onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                  />
                </div>
              ))}

              <div className="space-y-1.5">
                <Label>Access</Label>
                <Select
                  value={form.accessMode}
                  onValueChange={(v) =>
                    setForm({ ...form, accessMode: v as never })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROSTER_ONLY">
                      Anyone on the roster
                    </SelectItem>
                    <SelectItem value="ACCESS_CODE">
                      Roster plus an access code
                    </SelectItem>
                    <SelectItem value="MANUAL_RELEASE">
                      I admit each student
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.accessMode === "ACCESS_CODE" && (
                <div className="space-y-1.5">
                  <Label>Access code</Label>
                  <Input
                    value={form.accessCode}
                    onChange={(e) =>
                      setForm({ ...form, accessCode: e.target.value })
                    }
                    placeholder="Read this out at the start"
                    className="max-w-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>When students see their score</Label>
                <Select
                  value={form.resultsPolicy}
                  onValueChange={(v) =>
                    setForm({ ...form, resultsPolicy: v as never })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMMEDIATE">
                      As soon as they submit
                    </SelectItem>
                    <SelectItem value="AFTER_CLOSE">
                      Once the exam closes
                    </SelectItem>
                    <SelectItem value="MANUAL">When I release them</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {[
                ["showCorrectAnswers", "Show correct answers with results"],
                ["showExplanations", "Show explanations with results"],
              ].map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4">
                  <Label htmlFor={key} className="font-normal">
                    {label}
                  </Label>
                  <Switch
                    id={key}
                    checked={form[key as keyof typeof form] as boolean}
                    onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {isDraft && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCheck}>
                Check readiness
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="roster" className="mt-4">
          <ExamRosterTab
            examId={exam.id}
            candidates={exam.candidates}
            scopeType={exam.scopeType}
            accessMode={exam.accessMode}
            isDraft={isDraft}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
