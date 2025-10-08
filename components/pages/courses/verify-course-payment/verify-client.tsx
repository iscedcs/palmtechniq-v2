"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyClient({ reference }: { reference?: string }) {
  const router = useRouter();
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
          setTimeout(() => router.push("/student"), 1500);
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
  }, [reference, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md glass-card border-white/10">
        <CardHeader>
          <h1 className="text-xl font-semibold text-white">
            Payment Verification
          </h1>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
              <p className="text-gray-300">Verifying your payment…</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
              <p className="text-gray-200">Payment confirmed! Redirecting…</p>
              <Button
                onClick={() => router.replace("/student")}
                className="mt-2">
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center gap-3">
              <XCircle className="h-10 w-10 text-red-400" />
              <p className="text-gray-300">Payment failed. Please try again.</p>
              <Button variant="outline" onClick={() => router.replace("/")}>
                Back Home
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3">
              <XCircle className="h-10 w-10 text-red-400" />
              <p className="text-gray-300">We couldn’t verify your payment.</p>
              <Button variant="outline" onClick={() => router.replace("/")}>
                Back Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
