"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyProgramPaymentLink } from "@/actions/program-payment-links";
import { formatNaira } from "@/data/programs";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Loader2,
  GraduationCap,
  Calendar,
  Mail,
} from "lucide-react";
import { trackPurchase } from "@/lib/fbpixel";

type VerificationState =
  | { status: "loading" }
  | {
      status: "success";
      studentName: string;
      items: { programName: string; cohortName: string; amount: number }[];
    }
  | { status: "error"; message: string };

export function PaymentLinkVerification() {
  const searchParams = useSearchParams();
  const reference = searchParams?.get("reference") ?? null;
  const [state, setState] = useState<VerificationState>({ status: "loading" });

  useEffect(() => {
    if (!reference) {
      setState({ status: "error", message: "No payment reference found" });
      return;
    }

    verifyProgramPaymentLink(reference)
      .then((result) => {
        if (result.ok) {
          // Every success path — fresh settlement, early already-PAID, or a
          // lost settlement race — carries the same payload, so this renders
          // once and stops. No reloads: re-running would resolve to the same
          // already-settled state.
          const items = (result as any).items ?? [];
          const total = items.reduce(
            (sum: number, item: { amount: number }) => sum + item.amount,
            0,
          );
          trackPurchase({
            content_name: "Program Enrollment (Payment Link)",
            content_type: "product",
            currency: "NGN",
            value: total ?? 0,
          });
          setState({
            status: "success",
            studentName: (result as any).studentName ?? "",
            items,
          });
        } else {
          const reason = (result as any).reason;
          setState({
            status: "error",
            message:
              reason === "amount_mismatch" || reason === "no_enrollments"
                ? "We received the payment but could not attach it to the programs automatically. Please contact us so we can fix it right away."
                : "Payment was not successful. If you were charged, please contact us.",
          });
        }
      })
      .catch((err) => {
        console.error("Payment link verification error:", err);
        setState({
          status: "error",
          message: "Verification failed. Please contact us if you were charged.",
        });
      });
  }, [reference]);

  if (state.status === "loading") {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          Verifying your payment…
        </h2>
        <p className="text-gray-400">Please keep this page open.</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          Payment not confirmed
        </h2>
        <p className="text-gray-400 mb-6">{state.message}</p>
        <Button asChild variant="outline">
          <Link href="/contact">Contact us</Link>
        </Button>
      </div>
    );
  }

  if (state.items.length === 0) {
    // Defensive: the server now always returns the program list on success,
    // but never render a broken confirmation if that invariant is violated.
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
        <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-white mb-2">
          Payment confirmed
        </h2>
        <p className="text-gray-300 mb-6">
          Thank you{state.studentName ? `, ${state.studentName}` : ""}. Your
          enrollment details are being sent to your email.
        </p>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/login">Log in to your dashboard</Link>
        </Button>
      </div>
    );
  }

  const total = state.items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-8">
      <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
      <h2 className="text-2xl font-semibold text-white text-center mb-2">
        You&apos;re enrolled!
      </h2>
      <p className="text-gray-300 text-center mb-6">
        Payment confirmed for {state.studentName}. Your program
        {state.items.length > 1 ? "s are" : " is"} ready:
      </p>

      <div className="space-y-3 mb-6">
        {state.items.map((item, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-4 rounded-lg border border-white/10 bg-black/30 p-4">
            <div className="flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-white font-medium">{item.programName}</p>
                <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {item.cohortName}
                </p>
              </div>
            </div>
            <p className="text-white text-sm font-semibold shrink-0">
              {formatNaira(item.amount)}
            </p>
          </div>
        ))}
      </div>

      <p className="text-gray-300 text-sm text-center mb-6">
        Total paid:{" "}
        <span className="text-white font-semibold">{formatNaira(total)}</span>
      </p>

      <div className="rounded-lg border border-white/10 bg-black/30 p-4 flex items-start gap-3 mb-6">
        <Mail className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
        <p className="text-gray-300 text-sm">
          Your login details and enrollment confirmation are on their way to your
          inbox. If this is your first time, the email includes a temporary
          password and a link to set your own.
        </p>
      </div>

      <div className="flex justify-center">
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/login">Log in to your dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
