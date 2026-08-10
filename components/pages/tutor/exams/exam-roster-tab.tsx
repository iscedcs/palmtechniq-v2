"use client";

import {
  addCandidateByEmail,
  admitCandidate,
  removeCandidate,
  updateAccommodation,
} from "@/actions/exam-authoring";
import { resyncRoster } from "@/actions/exam";
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
import { Loader2, RefreshCw, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Candidate = {
  id: string;
  status: string;
  excludedAt: Date | null;
  admittedAt: Date | null;
  extraTimeMultiplier: number;
  extraTimeMinutes: number;
  extraAttempts: number;
  user: { id: string; name: string; email: string };
  attempts: { id: string; status: string; submittedAt: Date | null }[];
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> =
  {
    INVITED: "secondary",
    IN_PROGRESS: "default",
    SUBMITTED: "outline",
    MISSED: "destructive",
    EXCUSED: "outline",
  };

export function ExamRosterTab({
  examId,
  candidates,
  scopeType,
  accessMode,
  isDraft,
}: {
  examId: string;
  candidates: Candidate[];
  scopeType: string;
  accessMode: string;
  isDraft: boolean;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [accommodating, setAccommodating] = useState<Candidate | null>(null);
  const [extraMinutes, setExtraMinutes] = useState(0);
  const [extraAttempts, setExtraAttempts] = useState(0);

  const handleAdd = async () => {
    setBusy(true);
    const result = await addCandidateByEmail(examId, email);
    if ("error" in result && result.error) toast.error(result.error);
    else {
      toast.success(`${result.name} added to the roster`);
      setEmail("");
    }
    setBusy(false);
  };

  const handleResync = async () => {
    setBusy(true);
    const result = await resyncRoster(examId);
    if ("error" in result && result.error) toast.error(result.error);
    else
      toast.success(
        result.added === 0
          ? "Roster is already up to date"
          : `Added ${result.added} new candidate${result.added === 1 ? "" : "s"}`,
      );
    setBusy(false);
  };

  const handleSaveAccommodation = async () => {
    if (!accommodating) return;
    setBusy(true);
    const result = await updateAccommodation(accommodating.id, {
      extraTimeMinutes: extraMinutes,
      extraAttempts: extraAttempts,
    });
    if ("error" in result && result.error) toast.error(result.error);
    else toast.success("Accommodation saved");
    setAccommodating(null);
    setBusy(false);
  };

  const active = candidates.filter((c) => !c.excludedAt);

  return (
    <div className="space-y-4">
      {isDraft && (
        <Card>
          <CardContent className="p-4 text-sm text-gray-400">
            {scopeType === "AD_HOC"
              ? "Add the students who should sit this exam. Nothing is seeded automatically for a hand-picked exam."
              : "The roster is built from this exam's scope when you publish. You can add extra people by hand at any time."}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-5">
          <div className="min-w-56 flex-1 space-y-1.5">
            <Label htmlFor="add-email">Add someone by email</Label>
            <Input
              id="add-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              type="email"
            />
          </div>
          <Button onClick={handleAdd} disabled={busy || !email.includes("@")}>
            <UserPlus className="mr-2 size-4" />
            Add
          </Button>
          {scopeType !== "AD_HOC" && !isDraft && (
            <Button variant="outline" onClick={handleResync} disabled={busy}>
              <RefreshCw className="mr-2 size-4" />
              Re-sync from scope
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="mb-3 text-sm text-gray-400">
            {active.length} candidate{active.length === 1 ? "" : "s"}
          </p>

          {candidates.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-400">
              Nobody on the roster yet.
            </p>
          ) : (
            <ul className="divide-y">
              {candidates.map((candidate) => {
                const hasAccommodation =
                  candidate.extraTimeMinutes > 0 ||
                  candidate.extraTimeMultiplier !== 1 ||
                  candidate.extraAttempts > 0;

                return (
                  <li
                    key={candidate.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{candidate.user.name}</span>
                        <Badge variant={STATUS_VARIANT[candidate.status] ?? "secondary"}>
                          {candidate.status.toLowerCase().replace("_", " ")}
                        </Badge>
                        {candidate.excludedAt && (
                          <Badge variant="destructive">excluded</Badge>
                        )}
                        {hasAccommodation && <Badge variant="outline">extra time</Badge>}
                      </div>
                      <p className="text-xs text-gray-400">{candidate.user.email}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {accessMode === "MANUAL_RELEASE" && !candidate.admittedAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const result = await admitCandidate(candidate.id);
                            if ("error" in result && result.error)
                              toast.error(result.error);
                            else toast.success(`${candidate.user.name} admitted`);
                          }}>
                          Admit
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAccommodating(candidate);
                          setExtraMinutes(candidate.extraTimeMinutes);
                          setExtraAttempts(candidate.extraAttempts);
                        }}>
                        Accommodate
                      </Button>
                      {!candidate.excludedAt && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            const result = await removeCandidate(candidate.id);
                            if ("error" in result && result.error)
                              toast.error(result.error);
                            else toast.success("Removed from roster");
                          }}>
                          <X className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!accommodating}
        onOpenChange={(open) => !open && setAccommodating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accommodation for {accommodating?.user.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Extra time (minutes)</Label>
              <Input
                type="number"
                min={0}
                value={extraMinutes}
                onChange={(e) => setExtraMinutes(Number(e.target.value))}
              />
              <p className="text-xs text-gray-400">
                Added on top of the standard duration for this candidate only.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Extra attempts</Label>
              <Input
                type="number"
                min={0}
                value={extraAttempts}
                onChange={(e) => setExtraAttempts(Number(e.target.value))}
              />
              <p className="text-xs text-gray-400">
                Also how you grant a makeup sitting after a missed exam.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAccommodating(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAccommodation} disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
