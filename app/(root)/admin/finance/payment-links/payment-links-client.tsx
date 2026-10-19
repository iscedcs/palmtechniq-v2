"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Copy,
  Link2,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatToNaira } from "@/lib/utils";
import {
  createProgramPaymentLink,
  cancelProgramPaymentLink,
} from "@/actions/program-payment-links";

type ProgramOption = {
  slug: string;
  name: string;
  durationLabel: string;
  fullPrice: number;
};

type CohortOption = { value: string; label: string; startDate: string };

type LinkItem = {
  programSlug: string;
  programName: string;
  cohortName: string;
  cohortValue: string;
  listPrice: number;
  amount: number;
};

type PaymentLinkRow = {
  id: string;
  token: string;
  url: string;
  studentName: string;
  email: string;
  phone: string | null;
  note: string | null;
  amount: number;
  learningMode: string;
  status: "ACTIVE" | "PAID" | "CANCELLED" | "EXPIRED";
  createdBy: { name: string | null; email: string | null };
  createdAt: string;
  expiresAt: string | null;
  paidAt: string | null;
  items: LinkItem[];
};

type FormItem = { programSlug: string; cohortValue: string };

const EMPTY_ITEM: FormItem = { programSlug: "", cohortValue: "" };

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const defaultExpiry = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
};

const STATUS_STYLES: Record<PaymentLinkRow["status"], string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15",
  PAID: "bg-blue-500/15 text-blue-300 hover:bg-blue-500/15",
  EXPIRED: "bg-amber-500/15 text-amber-300 hover:bg-amber-500/15",
  CANCELLED: "bg-red-500/15 text-red-300 hover:bg-red-500/15",
};

export default function PaymentLinksClient({
  links,
  programs,
  cohorts,
}: {
  links: PaymentLinkRow[];
  programs: ProgramOption[];
  cohorts: CohortOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(links.length === 0);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const [studentName, setStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [learningMode, setLearningMode] = useState("VIRTUAL");
  const [expiresAt, setExpiresAt] = useState(defaultExpiry());
  const [items, setItems] = useState<FormItem[]>([{ ...EMPTY_ITEM }]);

  const selectedListSum = items.reduce((sum, item) => {
    const program = programs.find((p) => p.slug === item.programSlug);
    return sum + (program?.fullPrice ?? 0);
  }, 0);

  const amountNumber = Number(amount);
  const amountValid =
    Number.isInteger(amountNumber) && amountNumber > 0;
  const formValid =
    studentName.trim().length >= 2 &&
    /.+@.+\..+/.test(email) &&
    amountValid &&
    selectedListSum > 0 &&
    amountNumber <= selectedListSum &&
    items.length > 0 &&
    items.every((item) => item.programSlug && item.cohortValue);

  const updateItem = (index: number, patch: Partial<FormItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const resetForm = () => {
    setStudentName("");
    setEmail("");
    setPhone("");
    setNote("");
    setAmount("");
    setLearningMode("VIRTUAL");
    setExpiresAt(defaultExpiry());
    setItems([{ ...EMPTY_ITEM }]);
  };

  const handleRecreate = (row: PaymentLinkRow) => {
    setStudentName(row.studentName);
    setEmail(row.email);
    setPhone(row.phone ?? "");
    setNote(row.note ?? "");
    setAmount(String(row.amount));
    setLearningMode(row.learningMode);
    setExpiresAt(defaultExpiry());
    setItems(
      row.items.map((item) => ({
        programSlug: item.programSlug,
        cohortValue: item.cohortValue,
      })),
    );
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createProgramPaymentLink({
        studentName: studentName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        note: note.trim() || undefined,
        amount: amountNumber,
        expiresAt: expiresAt || undefined,
        learningMode: learningMode as "VIRTUAL" | "PHYSICAL",
        items: items.map((item) => ({
          programSlug: item.programSlug,
          cohortValue: item.cohortValue,
        })),
      });

      if (!result.ok) {
        toast.error(result.error ?? "Could not create the payment link");
        return;
      }

      try {
        await navigator.clipboard.writeText(result.url);
        toast.success("Payment link created and copied to your clipboard", {
          description: result.url,
        });
      } catch {
        toast.success("Payment link created", { description: result.url });
      }
      resetForm();
      setShowForm(false);
      router.refresh();
    });
  };

  const handleCancel = (id: string) => {
    startTransition(async () => {
      const result = await cancelProgramPaymentLink(id);
      setConfirmCancelId(null);
      if (!result.ok) {
        toast.error(result.error ?? "Could not cancel the link");
        return;
      }
      toast.success("Payment link cancelled");
      router.refresh();
    });
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy — copy it manually", { description: url });
    }
  };

  return (
    <div className="container mx-auto space-y-6 px-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Payment Links</h1>
            <p className="text-sm text-gray-400">
              Negotiated multi-program offers. One link, one payment — the 25%
              instructor share still accrues per program.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm((s) => !s)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {showForm ? "Hide form" : <><Plus className="mr-2 h-4 w-4" />New link</>}
        </Button>
      </div>

      {showForm && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Create a payment link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-300">Student name</Label>
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Chiamaka Obi"
                  className="bg-black/30 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Email (payer + student)</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="bg-black/30 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Phone (optional)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="bg-black/30 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Negotiated total (₦)</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="150000"
                  className="bg-black/30 border-white/10 text-white"
                />
                {selectedListSum > 0 && (
                  <p
                    className={`text-xs ${
                      amountValid && amountNumber <= selectedListSum
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}>
                    Combined list price {formatToNaira(selectedListSum)}
                    {amountValid && amountNumber <= selectedListSum && (
                      <>
                        {" "}
                        — client saves{" "}
                        {formatToNaira(selectedListSum - amountNumber)}
                      </>
                    )}
                    {amountNumber > selectedListSum &&
                      " — cannot exceed the list total"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Learning mode</Label>
                <Select value={learningMode} onValueChange={setLearningMode}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIRTUAL">Virtual</SelectItem>
                    <SelectItem value="PHYSICAL">Physical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Expires (optional)</Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="bg-black/30 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Programs</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add program
                </Button>
              </div>
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end">
                  <div className="space-y-2">
                    {index === 0 && (
                      <Label className="text-gray-400 text-xs">Program</Label>
                    )}
                    <Select
                      value={item.programSlug}
                      onValueChange={(value) =>
                        updateItem(index, { programSlug: value })
                      }>
                      <SelectTrigger className="bg-black/30 border-white/10 text-white">
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem
                            key={program.slug}
                            value={program.slug}>
                            {program.name} · {program.durationLabel} ·{" "}
                            {formatToNaira(program.fullPrice)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    {index === 0 && (
                      <Label className="text-gray-400 text-xs">Cohort</Label>
                    )}
                    <Select
                      value={item.cohortValue}
                      onValueChange={(value) =>
                        updateItem(index, { cohortValue: value })
                      }>
                      <SelectTrigger className="bg-black/30 border-white/10 text-white">
                        <SelectValue placeholder="Select cohort" />
                      </SelectTrigger>
                      <SelectContent>
                        {cohorts.map((cohort) => (
                          <SelectItem key={cohort.value} value={cohort.value}>
                            {cohort.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={items.length === 1}
                    onClick={() =>
                      setItems((prev) => prev.filter((_, i) => i !== index))
                    }
                    aria-label="Remove program">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Internal note (optional)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Mrs. Obi finalized ₦150k for her son — two crash courses, starts October cohort."
                className="bg-black/30 border-white/10 text-white"
                rows={2}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleCreate}
                disabled={!formValid || pending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {pending ? "Creating…" : "Create link"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white text-lg">
            Links ({links.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">
              No payment links yet. Create one for your next negotiated deal.
            </p>
          ) : (
            <div className="space-y-3">
              {links.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-medium">
                          {row.studentName}
                        </p>
                        <Badge className={STATUS_STYLES[row.status]}>
                          {row.status === "ACTIVE"
                            ? "Awaiting payment"
                            : row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">
                        {row.email}
                        {row.phone ? ` · ${row.phone}` : ""} · created{" "}
                        {formatDate(row.createdAt)} by{" "}
                        {row.createdBy.name ?? row.createdBy.email ?? "—"}
                        {row.expiresAt
                          ? ` · expires ${formatDate(row.expiresAt)}`
                          : ""}
                        {row.paidAt ? ` · paid ${formatDate(row.paidAt)}` : ""}
                      </p>
                    </div>
                    <p className="text-white font-semibold">
                      {formatToNaira(row.amount)}
                    </p>
                  </div>

                  <div className="mt-3 space-y-1">
                    {row.items.map((item, i) => (
                      <p key={i} className="text-gray-300 text-sm">
                        {item.programName}
                        <span className="text-gray-500">
                          {" "}
                          · {item.cohortName} ·{" "}
                        </span>
                        <span className="text-gray-400">
                          {formatToNaira(item.amount)}
                        </span>
                        <span className="text-gray-600 text-xs">
                          {" "}
                          (list {formatToNaira(item.listPrice)})
                        </span>
                      </p>
                    ))}
                  </div>

                  {row.note && (
                    <p className="text-gray-500 text-xs mt-2 italic">
                      Note: {row.note}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyUrl(row.url)}>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Copy link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecreate(row)}>
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Recreate
                    </Button>
                    {row.status === "ACTIVE" &&
                      (confirmCancelId === row.id ? (
                        <>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={pending}
                            onClick={() => handleCancel(row.id)}>
                            <Ban className="mr-1.5 h-3.5 w-3.5" />
                            Confirm cancel
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmCancelId(null)}>
                            Keep link
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmCancelId(row.id)}>
                          <Ban className="mr-1.5 h-3.5 w-3.5 text-red-400" />
                          Cancel
                        </Button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-gray-500 text-xs flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5 shrink-0" />
        Instructors accrue 25% of each program&apos;s negotiated share and are
        paid from the Programs tab after the refund window. Links are never
        edited — cancel and recreate to change a quote.
      </p>
      <p className="text-gray-600 text-xs flex items-center gap-2">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        Settled links appear under Finance → Programs for the cohort earnings
        release.
      </p>
    </div>
  );
}
