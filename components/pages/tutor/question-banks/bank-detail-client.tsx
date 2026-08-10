"use client";

import {
  deleteBankQuestion,
  exportBank,
  revokeShare,
  shareBank,
  undoQuestionImport,
} from "@/actions/question-bank";
import type { BankDetail } from "@/data/question-bank";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Download, Trash2, Undo2, Upload, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ImportDialog } from "./import-dialog";

const TYPE_LABEL: Record<string, string> = {
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

export function BankDetailClient({ bank }: { bank: BankDetail }) {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [shareEmail, setShareEmail] = useState("");
  const [shareAccess, setShareAccess] = useState<"VIEW" | "EDIT">("VIEW");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bank.questions.filter((question) => {
      if (q && !question.stem.toLowerCase().includes(q)) return false;
      if (topicFilter !== "all" && !question.topics.includes(topicFilter)) return false;
      if (difficultyFilter !== "all" && question.difficulty !== difficultyFilter) {
        return false;
      }
      return true;
    });
  }, [bank.questions, search, topicFilter, difficultyFilter]);

  const handleExport = async () => {
    const result = await exportBank(bank.id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bank.title.replace(/[^\w-]+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported");
  };

  const handleShare = async () => {
    setBusy(true);
    const result = await shareBank(bank.id, shareEmail, shareAccess);
    setBusy(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(`Shared with ${result.name}`);
    setShareEmail("");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-20">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/tutor/question-banks"
            className="text-sm text-gray-400 hover:underline">
            ← All banks
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{bank.title}</h1>
          <p className="text-sm text-gray-400">
            {bank.questions.length} question{bank.questions.length === 1 ? "" : "s"}
            {!bank.isOwner && ` · shared by ${bank.ownerName}`}
            {!bank.canEdit && " · view only"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
          {bank.canEdit && (
            <Button onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 size-4" />
              Import questions
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {(["EASY", "MEDIUM", "HARD"] as const).map((level) => (
          <Card key={level}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                {level.toLowerCase()}
              </p>
              <p className="text-2xl font-semibold">{bank.difficultyCounts[level]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Questions ({bank.questions.length})</TabsTrigger>
          <TabsTrigger value="imports">Imports ({bank.batches.length})</TabsTrigger>
          {bank.isOwner && <TabsTrigger value="sharing">Sharing</TabsTrigger>}
        </TabsList>

        {/* ── Questions ── */}
        <TabsContent value="questions" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions…"
              className="max-w-xs"
            />
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any difficulty</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
            {bank.topics.length > 0 && (
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any topic</SelectItem>
                  {bank.topics.map((t) => (
                    <SelectItem key={t.topic} value={t.topic}>
                      {t.topic} ({t.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-gray-400">
                {bank.questions.length === 0
                  ? "This bank is empty. Import your questions to get started."
                  : "No questions match those filters."}
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {filtered.map((q) => (
                <li key={q.id} className="rounded-lg border p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {TYPE_LABEL[q.questionType] ?? q.questionType}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        q.difficulty === "HARD" && "text-amber-500",
                      )}>
                      {q.difficulty.toLowerCase()}
                    </Badge>
                    <span className="text-xs text-gray-400">{q.points} pt</span>
                    {q.usedInExams > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        used in {q.usedInExams} exam{q.usedInExams === 1 ? "" : "s"}
                      </Badge>
                    )}
                    {q.topics.map((t) => (
                      <span key={t} className="text-[10px] text-gray-400">
                        #{t}
                      </span>
                    ))}

                    {bank.canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto"
                        onClick={async () => {
                          const result = await deleteBankQuestion(q.id);
                          if ("error" in result) toast.error(result.error);
                          else {
                            toast.success(
                              result.archived
                                ? "Archived — it is used by an exam, so the record is kept"
                                : "Deleted",
                            );
                            router.refresh();
                          }
                        }}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm">{q.stem}</p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* ── Imports ── */}
        <TabsContent value="imports" className="mt-4">
          {bank.batches.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-gray-400">
                Nothing imported yet.
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {bank.batches.map((batch) => (
                <li
                  key={batch.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{batch.sourceFormat.toUpperCase()}</Badge>
                      {batch.sourceName && (
                        <span className="text-sm font-medium">{batch.sourceName}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {batch.importedCount} imported
                      {batch.skippedCount > 0 && `, ${batch.skippedCount} skipped`} ·{" "}
                      {batch.importedBy} · {new Date(batch.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {bank.canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const result = await undoQuestionImport(batch.id);
                        if ("error" in result) toast.error(result.error);
                        else {
                          toast.success(
                            result.kept > 0
                              ? `Removed ${result.removed}; kept ${result.kept} already used by an exam`
                              : `Removed ${result.removed} questions`,
                          );
                          router.refresh();
                        }
                      }}>
                      <Undo2 className="mr-1 size-3.5" />
                      Undo
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* ── Sharing ── */}
        {bank.isOwner && (
          <TabsContent value="sharing" className="mt-4 space-y-4">
            <Card>
              <CardContent className="flex flex-wrap items-end gap-3 p-5">
                <div className="min-w-56 flex-1 space-y-1.5">
                  <Label>Share with a tutor</Label>
                  <Input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="tutor@example.com"
                  />
                </div>
                <Select
                  value={shareAccess}
                  onValueChange={(v) => setShareAccess(v as "VIEW" | "EDIT")}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEW">Can draw from it</SelectItem>
                    <SelectItem value="EDIT">Can also edit</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleShare} disabled={busy || !shareEmail.includes("@")}>
                  <UserPlus className="mr-2 size-4" />
                  Share
                </Button>
              </CardContent>
            </Card>

            {bank.shares.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <ul className="divide-y">
                    {bank.shares.map((share) => (
                      <li
                        key={share.id}
                        className="flex items-center justify-between gap-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{share.name}</p>
                          <p className="text-xs text-gray-400">{share.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {share.access === "EDIT" ? "can edit" : "can draw"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              const result = await revokeShare(share.id);
                              if ("error" in result) toast.error(result.error);
                              else {
                                toast.success("Access removed");
                                router.refresh();
                              }
                            }}>
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      <ImportDialog bankId={bank.id} open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
