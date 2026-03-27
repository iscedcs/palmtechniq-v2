import { EnrollmentVerification } from "@/components/enrollment/enrollment-verification";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Payment Verification — PalmTechnIQ",
  description: "Verifying your enrollment payment.",
};

function VerificationFallback() {
  return (
    <div className="text-center py-20">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">
        Loading verification...
      </h2>
    </div>
  );
}

export default function VerifyEnrollmentPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24 pb-16">
      <Suspense fallback={<VerificationFallback />}>
        <EnrollmentVerification />
      </Suspense>
    </main>
  );
}
