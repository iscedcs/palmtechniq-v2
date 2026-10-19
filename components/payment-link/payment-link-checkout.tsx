"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { beginProgramPaymentLinkCheckout } from "@/actions/program-payment-links";
import { formatNaira } from "@/data/programs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, GraduationCap, Calendar, Mail } from "lucide-react";

type Item = {
  programName: string;
  cohortName: string;
  listPrice: number;
  amount: number;
};

type Props = {
  token: string;
  studentName: string;
  email: string;
  amount: number;
  currency: string;
  expiresAt: string | null;
  items: Item[];
};

export function PaymentLinkCheckout(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const listSum = props.items.reduce((sum, item) => sum + item.listPrice, 0);

  const pay = () => {
    setError(null);
    startTransition(async () => {
      const result = await beginProgramPaymentLinkCheckout(props.token);
      // On success the action redirects to Paystack, so reaching here means
      // something rejected the checkout.
      if (!result.ok) {
        if (result.error === "already_paid") {
          router.refresh();
          return;
        }
        setError(result.error || "Could not start the payment. Please try again.");
      }
    });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-8">
      <Badge className="mb-4 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
        Reserved program offer
      </Badge>

      <h1 className="text-2xl font-semibold text-white mb-1">
        Program enrollment for {props.studentName}
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        This offer was prepared for you by the PalmTechnIQ admissions team.
      </p>

      <div className="space-y-3 mb-6">
        {props.items.map((item, i) => (
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
            <div className="text-right shrink-0">
              <p className="text-gray-500 text-xs line-through">
                {formatNaira(item.listPrice)}
              </p>
              <p className="text-white text-sm font-semibold">
                {formatNaira(item.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-4 mb-6">
        <div>
          <p className="text-gray-400 text-xs line-through">
            List total {formatNaira(listSum)}
          </p>
          <p className="text-gray-300 text-sm">Negotiated total</p>
        </div>
        <p className="text-3xl font-bold text-white">
          {formatNaira(props.amount)}
        </p>
      </div>

      <div className="flex items-center gap-2 text-gray-400 text-xs mb-6">
        <Mail className="w-3.5 h-3.5 shrink-0" />
        <span>
          Enrollment and account details will be sent to{" "}
          <span className="text-gray-200">{props.email}</span>
        </span>
      </div>

      {props.expiresAt && (
        <p className="text-amber-300/80 text-xs mb-4">
          This offer is valid until{" "}
          {new Date(props.expiresAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
      )}

      {error && (
        <p className="text-red-400 text-sm mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          {error}
        </p>
      )}

      <Button
        onClick={pay}
        disabled={pending}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Starting secure checkout…
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Pay {formatNaira(props.amount)} securely
          </>
        )}
      </Button>

      <p className="text-gray-500 text-xs text-center mt-4">
        You will be redirected to Paystack to complete the payment. One payment
        covers every program listed above.
      </p>
    </div>
  );
}
