"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function MentorshipVerifyClient({
  reference,
}: {
  reference?: string;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [status, setStatus] = useState<
    "loading" | "success" | "failed" | "error"
  >("loading");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/paystack/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const json = await res.json();
        if (!mounted) return;
        if (json.ok) {
          setStatus("success");
          await update();
          setTimeout(() => router.push("/student/mentorship"), 1500);
        } else {
          setStatus(json.reason === "failed" ? "failed" : "error");
        }
      } catch {
        if (!mounted) return;
        setStatus("error");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reference, router, update]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md glass-card border-white/10">
        <CardHeader>
          <h1 className="text-xl font-semibold text-white">
            Mentorship Payment Verification
          </h1>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
              <p className="text-gray-300">Verifying your mentorship payment...</p>
            </div>
          )}
          {status === "success" && (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
              <p className="text-gray-200">
                Payment confirmed. Redirecting to mentorship dashboard...
              </p>
              <Button onClick={() => router.replace("/student/mentorship")}>
                Go to Mentorship
              </Button>
            </div>
          )}
          {status === "failed" && (
            <div className="flex flex-col items-center gap-3">
              <XCircle className="h-10 w-10 text-red-400" />
              <p className="text-gray-300">Payment failed. Please try again.</p>
              <Button variant="outline" onClick={() => router.replace("/mentorship")}>
                Back to Mentorship
              </Button>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center gap-3">
              <XCircle className="h-10 w-10 text-red-400" />
              <p className="text-gray-300">We couldn't verify this payment.</p>
              <Button variant="outline" onClick={() => router.replace("/mentorship")}>
                Back to Mentorship
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
