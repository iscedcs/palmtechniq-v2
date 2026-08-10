"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { BookOpen, Check, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatToNaira } from "@/lib/utils";
import { beginBundleCheckout } from "@/actions/bundles";

type BundleCourse = {
  id: string;
  title: string;
  thumbnail: string | null;
  listPrice: number;
};

type Bundle = {
  slug: string;
  title: string;
  description: string | null;
  price: number;
  listSum: number;
  savings: number;
  savingsPercent: number;
  tutorName: string;
  courses: BundleCourse[];
};

export default function BundleLanding({
  bundle,
  referralCode,
  isAuthenticated,
  loginUrl,
}: {
  bundle: Bundle;
  referralCode?: string;
  isAuthenticated: boolean;
  loginUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [blocked, setBlocked] = useState<string | null>(null);

  const handleCheckout = () => {
    setBlocked(null);
    startTransition(async () => {
      const result = await beginBundleCheckout(bundle.slug, referralCode);
      if (!result.ok) {
        // The session can lapse between page load and clicking pay, so handle
        // it here too rather than trusting the render-time check alone.
        if ("reason" in result && result.reason === "unauthenticated") {
          router.push(loginUrl);
          return;
        }
        setBlocked(result.error);
        toast.error(result.error);
        return;
      }
      window.location.href = result.authorizationUrl;
    });
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}>
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">
            <Sparkles className="mr-1 h-3 w-3" />
            Course bundle
          </Badge>
          <h1 className="text-3xl font-bold md:text-4xl">{bundle.title}</h1>
          <p className="mt-2 text-sm text-foreground">
            {bundle.courses.length} courses by {bundle.tutorName}
          </p>
          {bundle.description && (
            <p className="mt-4 max-w-2xl text-foreground/90">
              {bundle.description}
            </p>
          )}
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {bundle.courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                      {course.thumbnail ? (
                        <Image
                          src={course.thumbnail}
                          alt={course.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-5 w-5 text-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{course.title}</p>
                      <p className="text-sm text-foreground">
                        Sold separately for {formatToNaira(course.listPrice)}
                      </p>
                    </div>
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div>
                  <p className="text-sm text-foreground line-through">
                    {formatToNaira(bundle.listSum)}
                  </p>
                  <p className="text-3xl font-bold">
                    {formatToNaira(bundle.price)}
                  </p>
                  {bundle.savings > 0 && (
                    <p className="mt-1 text-sm font-medium text-primary">
                      Save {formatToNaira(bundle.savings)} (
                      {bundle.savingsPercent}%)
                    </p>
                  )}
                </div>

                <p className="text-xs text-foreground">
                  VAT is added at checkout. Buying the bundle enrolls you in all{" "}
                  {bundle.courses.length} courses immediately.
                </p>

                {blocked && (
                  <p className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                    <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                    {blocked}
                  </p>
                )}

                {isAuthenticated ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={pending}>
                    {pending ? "Starting checkout…" : "Get the bundle"}
                  </Button>
                ) : (
                  <>
                    <Button className="w-full" size="lg" asChild>
                      <Link href={loginUrl}>Sign in to get the bundle</Link>
                    </Button>
                    <p className="text-center text-xs text-foreground">
                      Signing in brings you straight back here. New?{" "}
                      <Link href="/signup" className="underline">
                        Create an account
                      </Link>
                      .
                    </p>
                  </>
                )}

                <p className="text-center text-[11px] text-foreground">
                  Promo codes cannot be combined with a bundle price.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
