"use client";

import { createExam } from "@/actions/exam-authoring";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type ScopeOptions = {
  courses: { id: string; title: string }[];
  cohorts: { id: string; displayName: string }[];
  tracks: { id: string; name: string }[];
};

type ScopeType = "COURSE" | "PROGRAM_COHORT" | "BOOTCAMP_TRACK" | "AD_HOC";

export function NewExamClient({ options }: { options: ScopeOptions }) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scopeType, setScopeType] = useState<ScopeType>("COURSE");
  const [scopeId, setScopeId] = useState("");
  const [saving, setSaving] = useState(false);

  const scopeChoices =
    scopeType === "COURSE"
      ? options.courses.map((c) => ({ id: c.id, label: c.title }))
      : scopeType === "PROGRAM_COHORT"
        ? options.cohorts.map((c) => ({ id: c.id, label: c.displayName }))
        : scopeType === "BOOTCAMP_TRACK"
          ? options.tracks.map((t) => ({ id: t.id, label: t.name }))
          : [];

  const needsScopeId = scopeType !== "AD_HOC";

  const handleCreate = async () => {
    setSaving(true);

    const payload: Record<string, unknown> = {
      title,
      description: description || null,
      scopeType,
    };
    if (scopeType === "COURSE") payload.courseId = scopeId;
    if (scopeType === "PROGRAM_COHORT") payload.cohortId = scopeId;
    if (scopeType === "BOOTCAMP_TRACK") payload.trackId = scopeId;

    const result = await createExam(payload);

    if ("error" in result && result.error) {
      toast.error(result.error);
      setSaving(false);
      return;
    }

    toast.success("Exam created. Add your questions next.");
    router.push(`/tutor/exams/${result.examId}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-20">
      <h1 className="mb-1 text-2xl font-semibold">New exam</h1>
      <p className="mb-6 text-sm text-gray-400">
        Name it and choose who sits it. Questions, schedule and rules come next.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">The basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Networking Fundamentals — Midterm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A sentence your students will see before starting."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Who sits this exam</Label>
            <Select
              value={scopeType}
              onValueChange={(v) => {
                setScopeType(v as ScopeType);
                setScopeId("");
              }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COURSE">Everyone on a course</SelectItem>
                <SelectItem value="PROGRAM_COHORT">
                  A programme cohort
                </SelectItem>
                <SelectItem value="BOOTCAMP_TRACK">A bootcamp track</SelectItem>
                <SelectItem value="AD_HOC">Students I pick myself</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">
              The roster is built from this when you publish, and you can adjust
              it by hand afterwards.
            </p>
          </div>

          {needsScopeId && (
            <div className="space-y-1.5">
              <Label>
                {scopeType === "COURSE"
                  ? "Course"
                  : scopeType === "PROGRAM_COHORT"
                    ? "Cohort"
                    : "Track"}
              </Label>
              {scopeChoices.length === 0 ? (
                <p className="rounded-lg border border-dashed p-3 text-sm text-gray-400">
                  Nothing available to choose here yet.
                </p>
              ) : (
                <Select value={scopeId} onValueChange={setScopeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeChoices.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => router.push("/tutor/exams")}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                saving || title.trim().length < 3 || (needsScopeId && !scopeId)
              }>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create exam
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
