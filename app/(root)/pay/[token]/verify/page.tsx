import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PaymentLinkVerification } from "@/components/payment-link/payment-link-verification";

export const metadata: Metadata = {
  title: "Payment Verification — PalmTechnIQ",
  description: "Verifying your program payment.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

function VerificationFallback() {
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

export default function PaymentLinkVerifyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-2xl">
        <Suspense fallback={<VerificationFallback />}>
          <PaymentLinkVerification />
        </Suspense>
      </div>
    </main>
  );
}
