"use client";

import {
  commitQuestionImport,
  getImportTemplate,
  previewQuestionImport,
} from "@/actions/question-bank";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * The import wizard: choose a source, then fix what did not parse, then commit.
 *
 * The middle step is the reason this feature exists. A tutor whose file has
 * three bad rows out of two hundred must be able to correct those three here,
 * with the original text in front of them — not re-upload and guess.
 */

type ReviewRow = {
  rowNumber: number;
  raw: string;
  question: Record<string, unknown>;
  errors: string[];
  valid: boolean;
};

type Step = "source" | "review";

const TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "MULTI_SELECT",
  "NUMERIC",
  "FILL_IN_BLANK",
  "MATCHING",
  "SHORT_ANSWER",
  "ESSAY",
  "CODE",
];

export function ImportDialog({
  bankId,
  open,
  onOpenChange,
}: {
  bankId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("source");
  const [text, setText] = useState("");
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [format, setFormat] = useState<string>("");
  const [showOnlyProblems, setShowOnlyProblems] = useState(true);

  const reset = () => {
    setStep("source");
    setText("");
    setSourceName(null);
    setRows([]);
    setFormat("");
    setShowOnlyProblems(true);
  };

  const handleFile = async (file: File) => {
    // Read as text — CSV and the plain-text formats are all we accept, and this
    // keeps a parser dependency out of the bundle.
    const content = await file.text();
    setText(content);
    setSourceName(file.name);
    toast.success(`Loaded ${file.name}`);
  };

  const handlePreview = async () => {
    setBusy(true);
    const result = await previewQuestionImport({ bankId, text });
    setBusy(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    setRows(result.rows as ReviewRow[]);
    setFormat(result.format);
    setStep("review");

    if (result.invalidRows > 0) {
      toast.warning(
        `${result.validRows} ready, ${result.invalidRows} need attention.`,
      );
    } else {
      toast.success(`${result.validRows} questions ready to import.`);
    }
  };

  /** Re-validate one row locally as the tutor edits it. */
  const updateRow = (rowNumber: number, patch: Record<string, unknown>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber !== rowNumber) return r;
        const question = { ...r.question, ...patch };
        const errors = validateLocally(question);
        return { ...r, question, errors, valid: errors.length === 0 };
      }),
    );
  };

  const handleCommit = async () => {
    const valid = rows.filter((r) => r.valid);
    const skipped = rows.filter((r) => !r.valid);

    if (valid.length === 0) {
      toast.error("Nothing is ready to import yet");
      return;
    }

    setBusy(true);
    const result = await commitQuestionImport({
      bankId,
      rows: valid.map((r) => r.question) as never,
      sourceFormat: format || "paste",
      sourceName,
      totalRows: rows.length,
      skippedRows: skipped.map((r) => ({
        rowNumber: r.rowNumber,
        errors: r.errors,
        raw: r.raw,
      })),
    });
    setBusy(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    const parts = [`Imported ${result.imported}`];
    if (result.duplicates > 0) parts.push(`${result.duplicates} already in the bank`);
    if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
    toast.success(parts.join(" · "));

    reset();
    onOpenChange(false);
    router.refresh();
  };

  const downloadTemplate = async () => {
    const result = await getImportTemplate();
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "question-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = rows.filter((r) => r.valid).length;
  const problemCount = rows.length - validCount;
  const visible = showOnlyProblems && problemCount > 0 ? rows.filter((r) => !r.valid) : rows;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {step === "source" ? "Import questions" : "Review before importing"}
          </DialogTitle>
        </DialogHeader>

        {step === "source" && (
          <div className="space-y-4">
            <Alert>
              <FileUp className="size-4" />
              <AlertDescription>
                Paste your questions or upload a file. CSV, Moodle GIFT, Aiken and
                plain lists are all understood — the format is detected for you.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => fileInput.current?.click()}>
                <Upload className="mr-2 size-4" />
                Choose a file
              </Button>
              <Button variant="ghost" onClick={downloadTemplate}>
                <Download className="mr-2 size-4" />
                Download CSV template
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,.txt,.gift,.aiken,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </div>

            {sourceName && (
              <p className="text-sm text-gray-400">
                Loaded <span className="font-medium">{sourceName}</span>
              </p>
            )}

            <div className="space-y-1.5">
              <Label>Or paste here</Label>
              <Textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setSourceName(null);
                }}
                placeholder={
                  "question,type,options,correct\nWhich protocol is ordered?,mcq,TCP|UDP,TCP\n\n…or Aiken, or GIFT, or just one question per line."
                }
                className="min-h-48 font-mono text-xs"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handlePreview} disabled={busy || !text.trim()}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                Preview
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{format.toUpperCase()}</Badge>
              <span className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="size-4 text-emerald-500" />
                {validCount} ready
              </span>
              {problemCount > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-amber-500">
                  <AlertTriangle className="size-4" />
                  {problemCount} need attention
                </span>
              )}
              {problemCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowOnlyProblems(!showOnlyProblems)}>
                  {showOnlyProblems ? "Show all rows" : "Show only problems"}
                </Button>
              )}
            </div>

            {problemCount > 0 && (
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  Fix these below, or import the {validCount} good ones and leave the
                  rest — nothing is saved until you press Import.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {visible.map((row) => (
                <div
                  key={row.rowNumber}
                  className={cn(
                    "rounded-lg border p-3",
                    row.valid ? "border-emerald-500/30" : "border-amber-500/50 bg-amber-500/5",
                  )}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="text-xs text-gray-400">Row {row.rowNumber}</span>
                    {row.valid ? (
                      <Badge variant="outline" className="text-emerald-500">
                        ready
                      </Badge>
                    ) : (
                      <Badge variant="destructive">{row.errors[0]}</Badge>
                    )}
                  </div>

                  {!row.valid && (
                    <p className="mb-2 truncate rounded bg-white/5 p-2 font-mono text-[11px] text-gray-400">
                      {row.raw}
                    </p>
                  )}

                  <div className="grid gap-2 sm:grid-cols-[1fr_150px_90px]">
                    <Input
                      value={String(row.question.stem ?? "")}
                      onChange={(e) => updateRow(row.rowNumber, { stem: e.target.value })}
                      placeholder="Question text"
                    />
                    <Select
                      value={String(row.question.questionType ?? "MULTIPLE_CHOICE")}
                      onValueChange={(v) => updateRow(row.rowNumber, { questionType: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.toLowerCase().replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={Number(row.question.points ?? 1)}
                      onChange={(e) =>
                        updateRow(row.rowNumber, { points: Number(e.target.value) })
                      }
                    />
                  </div>

                  {!row.valid && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <Input
                        value={
                          Array.isArray(row.question.options)
                            ? (row.question.options as string[]).join(" | ")
                            : ""
                        }
                        onChange={(e) =>
                          updateRow(row.rowNumber, {
                            options: e.target.value
                              .split("|")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="Options, separated by |"
                      />
                      <Input
                        value={
                          Array.isArray(row.question.correctAnswer)
                            ? (row.question.correctAnswer as string[]).join(" | ")
                            : String(row.question.correctAnswer ?? "")
                        }
                        onChange={(e) => {
                          const type = String(row.question.questionType);
                          const raw = e.target.value;
                          const value =
                            type === "TRUE_FALSE"
                              ? raw.trim().toLowerCase() === "true"
                              : type === "NUMERIC"
                                ? Number(raw)
                                : type === "MULTI_SELECT" || type === "FILL_IN_BLANK"
                                  ? raw.split("|").map((s) => s.trim()).filter(Boolean)
                                  : raw;
                          updateRow(row.rowNumber, { correctAnswer: value });
                        }}
                        placeholder="Correct answer"
                      />
                    </div>
                  )}

                  {row.errors.length > 1 && (
                    <ul className="mt-2 list-inside list-disc text-xs text-amber-500">
                      {row.errors.slice(1).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("source")} disabled={busy}>
                Back
              </Button>
              <Button onClick={handleCommit} disabled={busy || validCount === 0}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                Import {validCount}
                {problemCount > 0 ? ` (skip ${problemCount})` : ""}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Mirror of the server's validation, for instant feedback while editing.
 *
 * The server re-validates on commit — this copy exists so a fix feels immediate,
 * never so the server can trust it.
 */
function validateLocally(q: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const stem = String(q.stem ?? "").trim();
  if (!stem) errors.push("No question text");

  const type = String(q.questionType ?? "");
  const options = Array.isArray(q.options) ? (q.options as unknown[]) : [];
  const points = Number(q.points ?? 1);
  if (!Number.isFinite(points) || points < 0) errors.push("Marks must be zero or more");

  if (type === "MULTIPLE_CHOICE" || type === "MULTI_SELECT") {
    if (options.length < 2) {
      errors.push("Needs at least two options");
    } else {
      const answers = Array.isArray(q.correctAnswer)
        ? (q.correctAnswer as unknown[])
        : [q.correctAnswer];
      const cleaned = answers.filter((a) => a !== null && a !== undefined && a !== "");
      if (cleaned.length === 0) {
        errors.push("No correct answer");
      } else {
        const texts = options.map((o) => String(o).toLowerCase());
        const missing = cleaned.filter((a) => !texts.includes(String(a).toLowerCase()));
        if (missing.length > 0) {
          errors.push(`Correct answer "${missing[0]}" is not one of the options`);
        }
      }
    }
  }

  if (type === "TRUE_FALSE" && typeof q.correctAnswer !== "boolean") {
    errors.push("Correct answer must be true or false");
  }

  if (type === "NUMERIC" && !Number.isFinite(Number(q.correctAnswer))) {
    errors.push("Correct answer must be a number");
  }

  if (type === "FILL_IN_BLANK") {
    const accepted = Array.isArray(q.correctAnswer)
      ? (q.correctAnswer as unknown[])
      : [q.correctAnswer];
    if (accepted.filter((a) => String(a ?? "").trim()).length === 0) {
      errors.push("Needs at least one accepted answer");
    }
  }

  return errors;
}
