"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { verifyEmail } from "@/actions/auth";

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  useEffect(() => {
    if (token) {
      handleVerify();
    }
  }, [token]);

  const handleVerify = async () => {
    setIsVerifying(true);

    const result = await verifyEmail(token || "");

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Email verified! Redirecting to login...",
      });
      setTimeout(() => router.push("/login"), 2000);
    }

    setIsVerifying(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 rounded-xl text-center">
        <h1 className="text-3xl font-bold text-white mb-6">
          Verify Your Email
        </h1>
        {token ? (
          <p className="text-white/70 mb-6">
            {isVerifying
              ? "Verifying your email..."
              : "Click below to verify your email address."}
          </p>
        ) : (
          <p className="text-white/70 mb-6">
            Please check your email for a verification link.
          </p>
        )}
        {token && (
          <Button
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full h-12 bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 transition-all duration-300 hover-glow">
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>
        )}
      </motion.div>
    </div>
  );
}
