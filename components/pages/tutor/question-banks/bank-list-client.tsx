"use client";

import { createBank } from "@/actions/question-bank";
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
import { Textarea } from "@/components/ui/textarea";
import { Library, Loader2, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Bank = {
  id: string;
  title: string;
  description: string | null;
  courseTitle: string | null;
  ownerName: string;
  isOwn: boolean;
  canEdit: boolean;
  questionCount: number;
  shareCount: number;
  updatedAt: Date;
};

export function BankListClient({ banks }: { banks: Bank[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    setBusy(true);
    const result = await createBank({ title, description });
    setBusy(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Bank created. Import your questions next.");
    router.push(`/tutor/question-banks/${result.bankId}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-20">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Question banks</h1>
          <p className="text-sm text-gray-400">
            Reusable pools of questions. Import once, draw from them in any exam.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 size-4" />
          New bank
        </Button>
      </div>

      {banks.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Library className="mx-auto mb-3 size-10 text-gray-400" />
            <h2 className="font-medium">No question banks yet</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-400">
              A bank holds questions you can reuse across exams. Create one, import
              your existing questions from a spreadsheet or your old platform, then
              draw from it whenever you set an exam.
            </p>
            <Button className="mt-4" onClick={() => setOpen(true)}>
              Create your first bank
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {banks.map((bank) => (
            <Card key={bank.id}>
              <CardContent className="p-5">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{bank.title}</h2>
                  {!bank.isOwn && (
                    <Badge variant="secondary">shared by {bank.ownerName}</Badge>
                  )}
                  {!bank.canEdit && <Badge variant="outline">view only</Badge>}
                </div>

                {bank.description && (
                  <p className="mb-2 line-clamp-2 text-sm text-gray-400">
                    {bank.description}
                  </p>
                )}

                <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                  <span>
                    {bank.questionCount} question{bank.questionCount === 1 ? "" : "s"}
                  </span>
                  {bank.courseTitle && <span>{bank.courseTitle}</span>}
                  {bank.shareCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="size-3" />
                      shared with {bank.shareCount}
                    </span>
                  )}
                </div>

                <Button asChild variant="outline" size="sm">
                  <Link href={`/tutor/question-banks/${bank.id}`}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New question bank</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Networking — all topics"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is in this bank?"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={busy || title.trim().length < 2}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
