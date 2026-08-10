"use client";

import {
  createQuestion,
  createSection,
  deleteQuestion,
  deleteSection,
  updateQuestion,
  updateSection,
  type QuestionInput,
} from "@/actions/exam-authoring";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Library, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Question = {
  id: string;
  stem: string;
  questionType: string;
  options: unknown;
  correctAnswer: unknown;
  explanation: string | null;
  points: number;
};

type Section = {
  id: string;
  title: string;
  selectionMode: string;
  drawCount: number | null;
  drawDifficulty: string | null;
  drawTopics: string[];
  drawPoints: number | null;
  instructions: string | null;
  timeLimitMinutes: number | null;
  drawBank: { id: string; title: string } | null;
  questions: Question[];
};

export type BankOption = { id: string; title: string; questionCount: number };

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True / false",
  MULTI_SELECT: "Multi-select",
  NUMERIC: "Numeric",
  FILL_IN_BLANK: "Fill in the blank",
  MATCHING: "Matching",
  SHORT_ANSWER: "Short answer",
  ESSAY: "Essay",
  CODE: "Code",
};

/** Types where the tutor authors a list of options. */
const OPTION_TYPES = ["MULTIPLE_CHOICE", "MULTI_SELECT"];

const EMPTY: QuestionInput = {
  stem: "",
  questionType: "MULTIPLE_CHOICE",
  options: ["", ""],
  correctAnswer: "",
  explanation: "",
  points: 1,
};

export function ExamQuestionsTab({
  examId,
  sections,
  editable,
  banks = [],
  poolCounts = {},
}: {
  examId: string;
  sections: Section[];
  editable: boolean;
  banks?: BankOption[];
  /** sectionId -> how many bank questions currently match its draw filters. */
  poolCounts?: Record<string, number>;
}) {
  const router = useRouter();
  const poolFor = (section: Section) => poolCounts[section.id] ?? 0;

  /** Persist a change to a drawing section's filters. */
  const saveDraw = async (section: Section, patch: Record<string, unknown>) => {
    const result = await updateSection(section.id, {
      title: section.title,
      instructions: section.instructions,
      sortOrder: 0,
      timeLimitMinutes: section.timeLimitMinutes,
      selectionMode: "RANDOM_DRAW",
      drawBankId: section.drawBank?.id ?? null,
      drawCount: section.drawCount,
      drawDifficulty: section.drawDifficulty,
      drawTopics: section.drawTopics ?? [],
      drawPoints: section.drawPoints,
      ...patch,
    });
    if ("error" in result && result.error) toast.error(result.error);
    else router.refresh();
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [noBanksOpen, setNoBanksOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [targetSection, setTargetSection] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuestionInput>(EMPTY);

  const openNew = (sectionId: string) => {
    setTargetSection(sectionId);
    setEditingId(null);
    setDraft(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (sectionId: string, question: Question) => {
    setTargetSection(sectionId);
    setEditingId(question.id);
    setDraft({
      stem: question.stem,
      questionType: question.questionType,
      options: question.options ?? ["", ""],
      correctAnswer: question.correctAnswer ?? "",
      explanation: question.explanation ?? "",
      points: question.points,
    });
    setDialogOpen(true);
  };

  const handleAddSection = async () => {
    setBusy(true);
    const result = await createSection(examId, {
      title: `Section ${String.fromCharCode(65 + sections.length)}`,
      selectionMode: "FIXED",
      sortOrder: sections.length,
      drawTopics: [],
    });
    if ("error" in result && result.error) toast.error(result.error);
    setBusy(false);
  };

  const handleSave = async () => {
    if (!targetSection) return;
    setBusy(true);

    const result = editingId
      ? await updateQuestion(editingId, draft)
      : await createQuestion(targetSection, draft);

    if ("error" in result && result.error) {
      toast.error(result.error);
      setBusy(false);
      return;
    }

    toast.success(editingId ? "Question updated" : "Question added");
    setDialogOpen(false);
    setBusy(false);
  };

  const handleDelete = async (questionId: string) => {
    const result = await deleteQuestion(questionId);
    if ("error" in result && result.error) toast.error(result.error);
    else toast.success("Question removed");
  };

  const options = Array.isArray(draft.options) ? (draft.options as string[]) : [];
  const showOptions = OPTION_TYPES.includes(draft.questionType);
  const isMulti = draft.questionType === "MULTI_SELECT";
  const selected = Array.isArray(draft.correctAnswer)
    ? (draft.correctAnswer as string[])
    : [];

  return (
    <div className="space-y-4">
      {sections.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-medium">No sections yet</p>
            <p className="mt-1 text-sm text-gray-400">
              Questions live inside sections. Add one to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {sections.map((section) => (
        <Card key={section.id}>
          <CardContent className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium">{section.title}</h3>
                <p
                  className={cn(
                    "text-xs",
                    section.selectionMode === "RANDOM_DRAW" && !section.drawCount
                      ? "text-amber-500"
                      : "text-gray-400",
                  )}>
                  {section.selectionMode === "RANDOM_DRAW"
                    ? section.drawCount
                      ? `Each candidate answers ${section.drawCount}, drawn at random from ${
                          section.drawBank?.title ?? "a bank"
                        }`
                      : "Set how many questions each candidate should answer"
                    : `${section.questions.length} question${
                        section.questions.length === 1 ? "" : "s"
                      } · ${section.questions.reduce((s, q) => s + q.points, 0)} points`}
                </p>
              </div>

              {editable && (
                <div className="flex gap-2">
                  <Select
                    value={section.selectionMode}
                    onValueChange={(v) => {
                      // Switching to a draw with no banks anywhere used to fail
                      // schema validation and leave a toast with no way forward.
                      // Explain it instead, and offer the door.
                      if (v === "RANDOM_DRAW" && banks.length === 0) {
                        setNoBanksOpen(true);
                        return;
                      }
                      void saveDraw(section, { selectionMode: v });
                    }}>
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed questions</SelectItem>
                      <SelectItem value="RANDOM_DRAW">Draw from a bank</SelectItem>
                    </SelectContent>
                  </Select>
                  {section.selectionMode === "FIXED" && (
                    <Button size="sm" variant="outline" onClick={() => openNew(section.id)}>
                      <Plus className="mr-1 size-3.5" />
                      Add question
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const result = await deleteSection(section.id);
                      if ("error" in result && result.error) toast.error(result.error);
                    }}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {section.selectionMode === "RANDOM_DRAW" ? (
              <div className="space-y-3">
                {!section.drawBank ? (
                  // Not an error — an expected step. Say what to do next.
                  <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                    <p className="text-sm font-medium">Pick a bank to draw from</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Choose one below and set how many questions each candidate
                      should get. Everyone sits a different selection, cut from the
                      same material.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => router.push("/tutor/question-banks")}>
                      <Library className="mr-1.5 size-3.5" />
                      Manage question banks
                    </Button>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-gray-400">
                    Every candidate gets a different set drawn from the bank when they
                    start. The exact pool is frozen at publish.
                  </p>
                )}

                {editable && (
                  <div className="grid gap-3 sm:grid-cols-[1fr_110px_130px]">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Draw from</Label>
                      <Select
                        value={section.drawBank?.id ?? ""}
                        onValueChange={(v) =>
                          void saveDraw(section, { drawBankId: v })
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.length === 0 ? (
                            <button
                              type="button"
                              className="w-full p-2 text-left text-xs text-primary hover:underline"
                              onClick={() => router.push("/tutor/question-banks")}>
                              No banks yet — create one →
                            </button>
                          ) : (
                            banks.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.title}{" "}
                                {b.questionCount === 0
                                  ? "(empty)"
                                  : `(${b.questionCount})`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        How many{" "}
                        <span className="text-gray-400">
                          {section.drawBank ? `of ${poolFor(section)}` : ""}
                        </span>
                      </Label>
                      {/*
                        No default. This used to show "1" before the tutor had
                        chosen, and a blur saved it — producing a 100-question
                        pool that handed each candidate a single question.
                        Empty forces a deliberate number, and publish blocks
                        until there is one.
                      */}
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 20"
                        defaultValue={section.drawCount ?? ""}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          void saveDraw(section, {
                            drawCount: v === "" ? null : Number(v),
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Difficulty</Label>
                      <Select
                        value={section.drawDifficulty ?? "ANY"}
                        onValueChange={(v) =>
                          void saveDraw(section, {
                            drawDifficulty: v === "ANY" ? null : v,
                          })
                        }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ANY">Any</SelectItem>
                          <SelectItem value="EASY">Easy</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HARD">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Tell them now if the bank cannot satisfy the draw, rather than
                    letting publish be the first time they find out. */}
                {section.drawBank && section.drawCount ? (
                  <p
                    className={cn(
                      "text-xs",
                      poolFor(section) < section.drawCount
                        ? "text-destructive"
                        : "text-gray-400",
                    )}>
                    {poolFor(section)} question
                    {poolFor(section) === 1 ? "" : "s"} in {section.drawBank.title} match
                    {poolFor(section) < section.drawCount
                      ? ` — not enough to draw ${section.drawCount}.`
                      : `. Drawing ${section.drawCount}.`}
                  </p>
                ) : null}
              </div>
            ) : (
              <ol className="space-y-2">
                {section.questions.map((question, i) => (
                  <li
                    key={question.id}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-400">{i + 1}.</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {TYPE_LABELS[question.questionType] ?? question.questionType}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {question.points} pt
                        </span>
                      </div>
                      <p className="truncate text-sm">{question.stem}</p>
                    </div>

                    {editable && (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(section.id, question)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(question.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
                {section.questions.length === 0 && (
                  <li className="rounded-lg border border-dashed p-4 text-center text-sm text-gray-400">
                    No questions in this section yet.
                  </li>
                )}
              </ol>
            )}
          </CardContent>
        </Card>
      ))}

      {editable && (
        <Button variant="outline" onClick={handleAddSection} disabled={busy}>
          <Plus className="mr-2 size-4" />
          Add section
        </Button>
      )}

      {/* No banks yet — explain, and offer the way there. */}
      <Dialog open={noBanksOpen} onOpenChange={setNoBanksOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>You do not have a question bank yet</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <p className="text-gray-400">
              Drawing at random needs a bank to draw from — a reusable pool of
              questions that any exam can pull from.
            </p>
            <div className="rounded-lg border p-3">
              <p className="mb-1 font-medium">Why bother?</p>
              <ul className="list-inside list-disc space-y-1 text-gray-400">
                <li>Import your questions once, use them in every exam</li>
                <li>Every candidate sits a different paper, cut from the same pool</li>
                <li>
                  Bring in a CSV, a Moodle GIFT or Aiken export, or just paste a list
                </li>
              </ul>
            </div>
            <p className="text-gray-400">
              Create one, put some questions in it, then come back and this section
              can draw from it.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNoBanksOpen(false)}>
              Keep fixed questions
            </Button>
            <Button onClick={() => router.push("/tutor/question-banks")}>
              <Library className="mr-2 size-4" />
              Create a question bank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question editor */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit question" : "New question"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={draft.questionType}
                  onValueChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      questionType: v,
                      // Reset the answer — its shape differs per type, and carrying
                      // one over would silently produce an unmarkable question.
                      options: OPTION_TYPES.includes(v) ? ["", ""] : null,
                      correctAnswer: v === "MULTI_SELECT" ? [] : "",
                    }))
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Points</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.points}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, points: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Question</Label>
              <Textarea
                value={draft.stem}
                onChange={(e) => setDraft((d) => ({ ...d, stem: e.target.value }))}
                placeholder="What do you want to ask?"
              />
            </div>

            {showOptions && (
              <div className="space-y-2">
                <Label>Options {isMulti ? "(tick every correct one)" : "(tick the correct one)"}</Label>
                {options.map((option, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type={isMulti ? "checkbox" : "radio"}
                      name="correct-option"
                      checked={
                        isMulti ? selected.includes(option) : draft.correctAnswer === option
                      }
                      disabled={!option.trim()}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          correctAnswer: isMulti
                            ? e.target.checked
                              ? [...selected, option]
                              : selected.filter((s) => s !== option)
                            : option,
                        }))
                      }
                    />
                    <Input
                      value={option}
                      onChange={(e) => {
                        const next = [...options];
                        const old = next[i];
                        next[i] = e.target.value;
                        setDraft((d) => ({
                          ...d,
                          options: next,
                          // Keep the answer pointing at the renamed option.
                          correctAnswer: isMulti
                            ? selected.map((s) => (s === old ? e.target.value : s))
                            : d.correctAnswer === old
                              ? e.target.value
                              : d.correctAnswer,
                        }));
                      }}
                      placeholder={`Option ${i + 1}`}
                    />
                    {options.length > 2 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            options: options.filter((_, j) => j !== i),
                          }))
                        }>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDraft((d) => ({ ...d, options: [...options, ""] }))
                  }>
                  <Plus className="mr-1 size-3.5" />
                  Add option
                </Button>
              </div>
            )}

            {draft.questionType === "TRUE_FALSE" && (
              <div className="space-y-1.5">
                <Label>Correct answer</Label>
                <Select
                  value={String(draft.correctAnswer)}
                  onValueChange={(v) =>
                    setDraft((d) => ({ ...d, correctAnswer: v === "true" }))
                  }>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(draft.questionType === "NUMERIC" ||
              draft.questionType === "FILL_IN_BLANK") && (
              <div className="space-y-1.5">
                <Label>
                  {draft.questionType === "NUMERIC"
                    ? "Correct value"
                    : "Accepted answers (comma separated)"}
                </Label>
                <Input
                  value={
                    Array.isArray(draft.correctAnswer)
                      ? (draft.correctAnswer as string[]).join(", ")
                      : String(draft.correctAnswer ?? "")
                  }
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      correctAnswer:
                        d.questionType === "NUMERIC"
                          ? Number(e.target.value)
                          : e.target.value.split(",").map((s) => s.trim()),
                    }))
                  }
                  placeholder={
                    draft.questionType === "NUMERIC" ? "e.g. 443" : "e.g. network, layer 3"
                  }
                />
              </div>
            )}

            {["ESSAY", "CODE", "SHORT_ANSWER"].includes(draft.questionType) && (
              <p className="rounded-lg border border-dashed p-3 text-sm text-gray-400">
                This type is marked by hand. It will appear in your grading queue
                after the exam.
              </p>
            )}

            <div className="space-y-1.5">
              <Label>Explanation (optional)</Label>
              <Textarea
                value={draft.explanation ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, explanation: e.target.value }))
                }
                placeholder="Shown to students after results, if you enable it."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={busy || !draft.stem.trim()}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingId ? "Save changes" : "Add question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
