"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  Undo2,
  UserMinus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clearStakeholderAccount,
  createStakeholder,
  deleteStakeholder,
  setStakeholderAccount,
  setStakeholderActive,
  updateStakeholder,
} from "@/actions/admin-stakeholders";

const naira = (kobo: number) =>
  `₦${(kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

type Stakeholder = {
  id: string;
  name: string;
  role: string;
  sharePercent: number;
  priority: number;
  isActive: boolean;
  bankName: string | null;
  bankCode: string | null;
  accountName: string | null;
  accountNumber: string | null;
  recipientCode: string | null;
  notes: string | null;
  paidKobo: number;
  pendingKobo: number;
  runCount: number;
};

type Bank = { code: string; name: string };

type Validity = { ok: true } | { ok: false; total: number; message: string };

export default function StakeholdersClient({
  stakeholders,
  activeTotal,
  validity,
  staleDraft,
  banks,
  bankError,
}: {
  stakeholders: Stakeholder[];
  activeTotal: number;
  validity: Validity;
  staleDraft: { id: string; periodStart: string; computedAt: string } | null;
  banks: Bank[];
  bankError: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Stakeholder | null>(null);
  const [accountFor, setAccountFor] = useState<Stakeholder | null>(null);
  const [adding, setAdding] = useState(false);

  const active = stakeholders.filter((s) => s.isActive);
  const retired = stakeholders.filter((s) => !s.isActive);
  const missingAccount = active.filter((s) => !s.accountNumber);

  function retire(stakeholder: Stakeholder) {
    startTransition(async () => {
      const result = await setStakeholderActive(stakeholder.id, false);
      if (!result.ok) {
        toast.error(result.error, { duration: 12_000 });
        return;
      }
      toast.success(`${stakeholder.name} retired.`);
      router.refresh();
    });
  }

  function restore(stakeholder: Stakeholder) {
    startTransition(async () => {
      const result = await setStakeholderActive(stakeholder.id, true);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${stakeholder.name} restored.`);
      router.refresh();
    });
  }

  function remove(stakeholder: Stakeholder) {
    startTransition(async () => {
      const result = await deleteStakeholder(stakeholder.id);
      if (!result.ok) {
        toast.error(result.error, { duration: 12_000 });
        return;
      }
      toast.success(`${stakeholder.name} deleted.`);
      router.refresh();
    });
  }

  return (
    <div className="container mx-auto space-y-8 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-gradient mb-2 text-3xl font-bold">Stakeholders</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-400">
            Who shares the platform&apos;s revenue, at what rate, and where
            their money is sent. These are the inputs to a distribution run:
            editing a rate changes what future runs compute and never rewrites
            a run already computed.
          </p>
        </div>
        <Button onClick={() => setAdding(true)} disabled={pending}>
          <Plus className="mr-2 h-4 w-4" />
          Add stakeholder
        </Button>
      </header>

      {/* The one number that decides whether a run can be computed at all. */}
      <Card
        className={`glass-card ${
          validity.ok ? "border-green-500/30" : "border-amber-500/40"
        }`}>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-start gap-3">
            {validity.ok ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            )}
            <div>
              <p className="font-medium text-white">
                {validity.ok
                  ? "The split totals 100%. Runs can be computed."
                  : "Runs will be refused until this totals 100%."}
              </p>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-400">
                {validity.ok
                  ? `${active.length} active stakeholder${active.length === 1 ? "" : "s"}. A run splits one base, so no amount depends on the order.`
                  : validity.message}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Active total
            </p>
            <p
              className={`text-3xl font-semibold tabular-nums ${
                validity.ok ? "text-green-400" : "text-amber-400"
              }`}>
              {activeTotal}%
            </p>
          </div>
        </CardContent>
      </Card>

      {staleDraft && (
        <Notice tone="amber" icon={<AlertTriangle className="h-4 w-4" />}>
          A draft run for{" "}
          {new Date(staleDraft.periodStart).toLocaleDateString("en-NG", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}{" "}
          was computed on{" "}
          {new Date(staleDraft.computedAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          . If you change any rate here, recompute that draft on the
          Distributions tab before approving it, or it will pay the old rates.
        </Notice>
      )}

      {missingAccount.length > 0 && (
        <Notice tone="amber" icon={<Banknote className="h-4 w-4" />}>
          {missingAccount.length} active stakeholder
          {missingAccount.length === 1 ? " has" : "s have"} no payout account:{" "}
          {missingAccount.map((s) => s.name).join(", ")}. A run still computes
          their share, but there is nowhere to send it.
        </Notice>
      )}

      {bankError && (
        <Notice tone="yellow" icon={<AlertTriangle className="h-4 w-4" />}>
          Paystack&apos;s bank list could not be read ({bankError}), so accounts
          cannot be added or verified right now. Everything else on this page
          works.
        </Notice>
      )}

      <section className="space-y-3">
        <SectionHeading title="Active" count={active.length} />
        {active.length === 0 ? (
          <Card className="glass-card border-white/10">
            <CardContent className="p-10 text-center">
              <Landmark className="mx-auto mb-3 h-8 w-8 text-gray-600" />
              <p className="text-sm text-gray-400">
                The registry is empty. Seed it with{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-gray-300">
                  pnpm tsx scripts/seed-stakeholders.ts
                </code>{" "}
                or add people by hand.
              </p>
            </CardContent>
          </Card>
        ) : (
          active.map((s) => (
            <Row
              key={s.id}
              stakeholder={s}
              pending={pending}
              onEdit={() => setEditing(s)}
              onAccount={() => setAccountFor(s)}
              onRetire={() => retire(s)}
              onRestore={() => restore(s)}
              onDelete={() => remove(s)}
            />
          ))
        )}
      </section>

      {retired.length > 0 && (
        <section className="space-y-3">
          <SectionHeading title="Retired" count={retired.length} />
          <p className="text-xs text-gray-500">
            Kept so past runs still show a name. Their rates are excluded from
            the total above and from every future run.
          </p>
          {retired.map((s) => (
            <Row
              key={s.id}
              stakeholder={s}
              pending={pending}
              onEdit={() => setEditing(s)}
              onAccount={() => setAccountFor(s)}
              onRetire={() => retire(s)}
              onRestore={() => restore(s)}
              onDelete={() => remove(s)}
            />
          ))}
        </section>
      )}

      <DetailsDialog
        key={editing?.id ?? "new"}
        stakeholder={editing}
        open={adding || editing !== null}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
      />

      <AccountDialog
        key={accountFor?.id ?? "none"}
        stakeholder={accountFor}
        banks={banks}
        onClose={() => setAccountFor(null)}
      />
    </div>
  );
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
        {title}
      </h2>
      <span className="text-xs text-gray-500">{count}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function Notice({
  tone,
  icon,
  children,
}: {
  tone: "amber" | "yellow";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const styles = {
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-300/90",
    yellow: "border-yellow-500/30 bg-yellow-500/5 text-yellow-300/90",
  }[tone];
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 text-xs leading-relaxed ${styles}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p>{children}</p>
    </div>
  );
}

function Row({
  stakeholder: s,
  pending,
  onEdit,
  onAccount,
  onRetire,
  onRestore,
  onDelete,
}: {
  stakeholder: Stakeholder;
  pending: boolean;
  onEdit: () => void;
  onAccount: () => void;
  onRetire: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const hasAccount = !!s.accountNumber;

  return (
    <Card
      className={`glass-card transition-colors hover:border-white/20 ${
        s.isActive ? "border-white/10" : "border-white/5 opacity-70"
      }`}>
      <CardContent className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4 p-5">
        <div className="flex min-w-[16rem] flex-1 items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold tabular-nums text-gray-400">
            {s.priority}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-white">{s.name}</h3>
              {!s.isActive && (
                <Badge
                  variant="outline"
                  className="border-gray-500/30 bg-gray-500/10 text-gray-400">
                  Retired
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-400">{s.role}</p>

            {hasAccount ? (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-gray-400">
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-green-400" />
                <span className="text-gray-300">{s.accountName}</span>
                <span className="text-gray-500">
                  {s.bankName} · {s.accountNumber}
                </span>
              </p>
            ) : (
              <p className="mt-2 flex items-center gap-2 text-xs text-amber-400/90">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                No payout account
              </p>
            )}

            {s.notes && (
              <p className="mt-1.5 max-w-xl text-xs italic text-gray-500">
                {s.notes}
              </p>
            )}
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-x-8 text-right">
          <Figure label="Share" value={`${s.sharePercent}%`} strong />
          <Figure
            label="Paid out"
            value={naira(s.paidKobo)}
            dim={s.paidKobo === 0}
          />
          <Figure
            label="Awaiting"
            value={naira(s.pendingKobo)}
            tone={s.pendingKobo > 0 ? "amber" : undefined}
            dim={s.pendingKobo === 0}
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onAccount}
            disabled={pending}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            <Banknote className="mr-1.5 h-3.5 w-3.5" />
            {hasAccount ? "Change account" : "Add account"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            disabled={pending}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>

          <div className="flex-1" />

          {s.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetire}
              disabled={pending}
              className="text-gray-400 hover:text-white">
              <UserMinus className="mr-1.5 h-3.5 w-3.5" />
              Retire
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRestore}
              disabled={pending}
              className="text-gray-400 hover:text-white">
              <Undo2 className="mr-1.5 h-3.5 w-3.5" />
              Restore
            </Button>
          )}

          {s.runCount === 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={pending}
              className="text-red-400/80 hover:bg-red-500/10 hover:text-red-400">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Figure({
  label,
  value,
  strong,
  dim,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  dim?: boolean;
  tone?: "amber";
}) {
  const colour =
    tone === "amber" ? "text-amber-400" : dim ? "text-gray-600" : "text-white";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p
        className={`mt-0.5 font-semibold tabular-nums ${
          strong ? "text-lg" : "text-base"
        } ${colour}`}>
        {value}
      </p>
    </div>
  );
}

/** Name, role, rate and queue order. */
function DetailsDialog({
  stakeholder,
  open,
  onClose,
}: {
  stakeholder: Stakeholder | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(stakeholder?.name ?? "");
  const [role, setRole] = useState(stakeholder?.role ?? "");
  const [share, setShare] = useState(
    stakeholder ? String(stakeholder.sharePercent) : "",
  );
  const [priority, setPriority] = useState(
    stakeholder ? String(stakeholder.priority) : "",
  );
  const [notes, setNotes] = useState(stakeholder?.notes ?? "");

  const isNew = stakeholder === null;

  function submit() {
    const sharePercent = Number(share);
    const priorityNo = Number(priority);

    startTransition(async () => {
      const result = isNew
        ? await createStakeholder({
            name,
            role,
            sharePercent,
            priority: priorityNo,
          })
        : await updateStakeholder(stakeholder.id, {
            name,
            role,
            sharePercent,
            priority: priorityNo,
            notes,
          });

      if (!result.ok) {
        toast.error(result.error, { duration: 10_000 });
        return;
      }
      toast.success(isNew ? `${name.trim()} added.` : "Saved.");
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="border-white/10 bg-background text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Add a stakeholder" : `Edit ${stakeholder.name}`}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            The rate applies to future runs only. Anything already computed
            keeps the rate it was computed with.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Name" htmlFor="sh-name">
            <Input
              id="sh-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name, or the company name"
              className="border-white/10 bg-white/5 text-white"
            />
          </Field>

          <Field label="Role" htmlFor="sh-role">
            <Input
              id="sh-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Founder, Parent Company, Member..."
              className="border-white/10 bg-white/5 text-white"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Share %" htmlFor="sh-share">
              <Input
                id="sh-share"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={share}
                onChange={(e) => setShare(e.target.value)}
                className="border-white/10 bg-white/5 text-white tabular-nums"
              />
            </Field>
            <Field label="Queue order" htmlFor="sh-priority">
              <Input
                id="sh-priority"
                type="number"
                step="1"
                min="1"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="border-white/10 bg-white/5 text-white tabular-nums"
              />
            </Field>
          </div>

          <p className="text-xs leading-relaxed text-gray-500">
            Queue order decides only the sequence transfers are listed and sent
            in. Because the rates are fixed and split one base, it never changes
            anyone&apos;s amount.
          </p>

          {!isNew && (
            <Field label="Notes (optional)" htmlFor="sh-notes">
              <Textarea
                id="sh-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything worth recording about this arrangement"
                className="border-white/10 bg-white/5 text-white"
              />
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={pending || !name.trim() || !role.trim() || share === ""}>
            {pending ? "Saving..." : isNew ? "Add" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Bank details, verified before they are saved.
 *
 * The account name is not an input. It comes back from Paystack, so a wrong
 * digit surfaces here as somebody else's name instead of as a misdirected
 * transfer later.
 */
function AccountDialog({
  stakeholder,
  banks,
  onClose,
}: {
  stakeholder: Stakeholder | null;
  banks: Bank[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [bankCode, setBankCode] = useState(stakeholder?.bankCode ?? "");
  const [accountNumber, setAccountNumber] = useState(
    stakeholder?.accountNumber ?? "",
  );

  const digits = accountNumber.replace(/\s/g, "");
  const ready = bankCode !== "" && /^\d{10}$/.test(digits);

  function save() {
    if (!stakeholder) return;
    startTransition(async () => {
      const result = await setStakeholderAccount({
        id: stakeholder.id,
        bankCode,
        accountNumber: digits,
      });
      if (!result.ok) {
        toast.error(result.error, { duration: 12_000 });
        return;
      }
      toast.success(`Verified and saved: ${result.accountName}`);
      onClose();
      router.refresh();
    });
  }

  function clear() {
    if (!stakeholder) return;
    startTransition(async () => {
      const result = await clearStakeholderAccount(stakeholder.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Account removed.");
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={stakeholder !== null}
      onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="border-white/10 bg-background text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payout account</DialogTitle>
          <DialogDescription className="text-gray-400">
            {stakeholder?.name}. The account name is confirmed with the bank
            before anything is saved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Bank" htmlFor="sh-bank">
            <Select value={bankCode} onValueChange={setBankCode}>
              <SelectTrigger
                id="sh-bank"
                className="border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Choose a bank" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {banks.map((bank) => (
                  <SelectItem key={bank.code} value={bank.code}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Account number" htmlFor="sh-account">
            <Input
              id="sh-account"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value.replace(/[^\d\s]/g, ""))
              }
              placeholder="10 digits"
              maxLength={14}
              className="border-white/10 bg-white/5 text-white tabular-nums tracking-wider"
            />
          </Field>

          {stakeholder?.accountName && (
            <p className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-gray-300">
              <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
              Currently {stakeholder.accountName} at {stakeholder.bankName},{" "}
              {stakeholder.accountNumber}.
            </p>
          )}

          {banks.length === 0 && (
            <p className="text-xs text-amber-400/90">
              The bank list is empty, so an account cannot be verified. Reload
              once Paystack is reachable.
            </p>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          {stakeholder?.accountNumber ? (
            <Button
              variant="ghost"
              onClick={clear}
              disabled={pending}
              className="text-red-400/80 hover:bg-red-500/10 hover:text-red-400">
              Remove
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending || !ready}>
              {pending ? "Verifying..." : "Verify and save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-gray-200">
        {label}
      </Label>
      {children}
    </div>
  );
}
