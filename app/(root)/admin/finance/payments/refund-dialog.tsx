"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { previewRefund, refundTransaction } from "@/actions/admin-refunds";

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

type Preview = Awaited<ReturnType<typeof previewRefund>>;

/**
 * Refunding is irreversible and moves real money, so the dialog always shows
 * what will happen before it will let anyone do it: the amount, the deadline,
 * whether the policy allows it, and anything that cannot be undone.
 */
export function RefundDialog({
  transactionId,
  reference,
  amount,
  studentName,
}: {
  transactionId: string;
  reference: string;
  amount: number;
  studentName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [reason, setReason] = useState("");
  const [override, setOverride] = useState(false);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setPreview(null);
    setReason("");
    setOverride(false);
    try {
      setPreview(await previewRefund(transactionId));
    } catch {
      toast.error("Could not check this payment");
    } finally {
      setLoading(false);
    }
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) void load();
  }

  const assessment = preview?.ok ? preview.assessment : null;
  const blocked = assessment !== null && !assessment.ok;
  // "already refunded" and "never paid" are arithmetic, not policy, so the
  // action refuses them whatever the admin ticks. Do not offer an override.
  const forcible =
    blocked &&
    assessment !== null &&
    !assessment.ok &&
    !["already_refunded", "not_paid", "nothing_to_refund"].includes(
      assessment.reason,
    );
  const refundAmount =
    assessment?.ok === true ? assessment.amount : (preview?.ok ? preview.amountPaid : amount);
  const canSubmit =
    !!preview?.ok &&
    reason.trim().length > 0 &&
    (!blocked || (forcible && override)) &&
    !pending;

  function submit() {
    startTransition(async () => {
      const result = await refundTransaction({
        transactionId,
        reason: reason.trim(),
        override: blocked && override,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `Refunded ${naira(result.amount)}${
          result.alreadyRefundedAtPaystack
            ? ". Paystack had already refunded this, so only our records changed."
            : ""
        }`,
      );

      if (result.unrecoverableTutorShare > 0) {
        toast.warning(
          `${naira(result.unrecoverableTutorShare)} had already been released to the tutor. That has to be recovered by hand.`,
          { duration: 12_000 },
        );
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Button
        variant="outline"
        size="sm"
        className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
        onClick={() => onOpenChange(true)}>
        <Undo2 className="w-3 h-3 mr-1" />
        Refund
      </Button>

      <DialogContent className="bg-dark-800 border-white/10 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Refund this payment</DialogTitle>
          <DialogDescription className="text-gray-400">
            {studentName} · {naira(amount)} · {reference}
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-gray-400">Checking...</p>}

        {preview && !preview.ok && (
          <p className="text-sm text-red-400">{preview.error}</p>
        )}

        {preview?.ok && assessment && (
          <div className="space-y-4">
            {assessment.ok ? (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 space-y-1">
                <p className="text-sm text-white">
                  Refundable: <strong>{naira(assessment.amount)}</strong>
                </p>
                {assessment.proRated && (
                  <p className="text-xs text-gray-300">
                    {assessment.proRated}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  Window closes {assessment.deadline.toDateString()}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 space-y-2">
                <p className="text-sm text-orange-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  {assessment.message}
                </p>
              </div>
            )}

            {preview.unrecoverableTutorShare > 0 && (
              <p className="text-xs text-orange-300">
                {naira(preview.unrecoverableTutorShare)} has already been
                released to the tutor. Refunding will not take it back, and it
                has to be recovered by hand.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="refund-reason" className="text-gray-200">
                Reason (required, recorded)
              </Label>
              <Textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this being refunded?"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            {forcible && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="refund-override"
                  checked={override}
                  onCheckedChange={(v) => setOverride(v === true)}
                />
                <Label
                  htmlFor="refund-override"
                  className="text-xs text-gray-300 leading-relaxed">
                  Refund anyway, outside the published policy. Use this for a
                  cohort we cancelled, a payment that went wrong, or a goodwill
                  decision. Your reason above is the only record of why.
                </Label>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit}
            className="bg-red-500/80 hover:bg-red-500 text-white">
            {pending ? "Refunding..." : `Refund ${naira(refundAmount)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
