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
import {
  previewProgramRefund,
  refundProgramEnrollment,
} from "@/actions/admin-program-refunds";

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

type Preview = Awaited<ReturnType<typeof previewProgramRefund>>;

/** One paid installment as the dialog renders it. */
type Line = {
  installmentNo: number;
  amount: number;
  hasReference: boolean;
  assessment: { ok: boolean; message?: string };
};

/**
 * Refunding a program enrollment, installment by installment.
 *
 * Each payment has its own refund window, so the dialog lists them separately
 * rather than presenting one figure: a first installment can be out of time
 * while a second is still inside it.
 */
export function ProgramRefundDialog({
  enrollmentId,
  studentName,
}: {
  enrollmentId: string;
  studentName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [reason, setReason] = useState("");
  const [override, setOverride] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    setLoading(true);
    setPreview(null);
    setReason("");
    setOverride(false);
    try {
      setPreview(await previewProgramRefund(enrollmentId));
    } catch {
      toast.error("Could not check this enrollment");
    } finally {
      setLoading(false);
    }
  }

  const lines = preview?.ok ? preview.lines : [];
  const blocked = lines.length > 0 && lines.every((l: Line) => !l.assessment.ok);
  const someBlocked = lines.some((l: Line) => !l.assessment.ok);
  const canSubmit =
    !!preview?.ok &&
    lines.length > 0 &&
    reason.trim().length > 0 &&
    (!blocked || override) &&
    !pending;

  function submit() {
    startTransition(async () => {
      const result = await refundProgramEnrollment({
        enrollmentId,
        reason: reason.trim(),
        override,
      });

      if (!result.ok) {
        toast.error(result.error, { duration: 12_000 });
        return;
      }

      toast.success(
        `Refunded ${naira(result.refundedAmount)}${
          result.enrollmentCancelled ? " and cancelled the enrollment" : ""
        }`,
      );

      for (const outcome of result.outcomes.filter(
        (o) => o.status === "failed",
      )) {
        toast.error(`Installment ${outcome.installmentNo}: ${outcome.detail}`, {
          duration: 15_000,
        });
      }

      if (result.unrecoverableInstructorShare > 0) {
        toast.warning(
          `${naira(result.unrecoverableInstructorShare)} had already been released to the instructor and has to be recovered by hand.`,
          { duration: 12_000 },
        );
      }

      if (result.alreadyDistributedPeriods.length > 0) {
        toast.warning(
          `This money was already distributed to stakeholders for ${result.alreadyDistributedPeriods.join(", ")}. Those runs are frozen and cannot be netted off.`,
          { duration: 15_000 },
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
        className="border-white/10 bg-white/5 hover:bg-white/10 text-white h-7 text-xs"
        onClick={(e) => {
          e.stopPropagation();
          void onOpenChange(true);
        }}>
        <Undo2 className="w-3 h-3 mr-1" />
        Refund
      </Button>

      <DialogContent className="bg-dark-800 border-white/10 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Refund this enrollment</DialogTitle>
          <DialogDescription className="text-gray-400">
            {preview?.ok
              ? `${studentName} · ${preview.enrollment.programName} · ${preview.enrollment.cohort}`
              : studentName}
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-gray-400">Checking...</p>}

        {preview && !preview.ok && (
          <p className="text-sm text-red-400">{preview.error}</p>
        )}

        {preview?.ok && (
          <div className="space-y-4">
            {lines.length === 0 ? (
              <p className="text-sm text-gray-400">
                No installment on this enrollment has been paid, so there is
                nothing to refund.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {lines.map((line: Line) => (
                    <div
                      key={line.installmentNo}
                      className={`rounded-lg border p-3 text-sm ${
                        line.assessment.ok && line.hasReference
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-orange-500/30 bg-orange-500/5"
                      }`}>
                      <div className="flex justify-between gap-3">
                        <span className="text-white">
                          Installment {line.installmentNo}
                        </span>
                        <strong className="text-white">
                          {naira(line.amount)}
                        </strong>
                      </div>
                      {!line.hasReference && (
                        <p className="text-xs text-orange-300 mt-1">
                          No Paystack reference recorded, so this cannot be
                          refunded automatically.
                        </p>
                      )}
                      {!line.assessment.ok && (
                        <p className="text-xs text-orange-300 mt-1">
                          {line.assessment.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-300">
                  Refundable now: <strong>{naira(preview.refundableNow)}</strong>{" "}
                  of {naira(preview.enrollment.amountPaid)} paid.
                </p>

                {preview.unrecoverableInstructorShare > 0 && (
                  <p className="text-xs text-orange-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    {naira(preview.unrecoverableInstructorShare)} has already
                    been released to the instructor. Refunding will not take it
                    back.
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="program-refund-reason" className="text-gray-200">
                    Reason (required, recorded)
                  </Label>
                  <Textarea
                    id="program-refund-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why is this being refunded?"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                {someBlocked && (
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="program-refund-override"
                      checked={override}
                      onCheckedChange={(v) => setOverride(v === true)}
                    />
                    <Label
                      htmlFor="program-refund-override"
                      className="text-xs text-gray-300 leading-relaxed">
                      Refund the installments the policy would refuse too. Use
                      this for a cohort we cancelled or postponed, or a goodwill
                      decision. Your reason is the only record of why.
                    </Label>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Unpaid installments are cancelled. If nothing paid remains,
                  the enrollment is cancelled and its cohort seat is freed.
                </p>
              </>
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
            {pending ? "Refunding..." : "Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
