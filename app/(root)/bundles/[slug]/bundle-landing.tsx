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
import { ShareMenu } from "@/components/shared/share-menu";
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
  shareUrl,
  shareIsAttributed,
}: {
  bundle: Bundle;
  referralCode?: string;
  isAuthenticated: boolean;
  loginUrl: string;
  shareUrl: string;
  shareIsAttributed: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [blocked, setBlocked] = useState<string | null>(null);

  const shareText =
    bundle.savings > 0
      ? `${bundle.courses.length} courses for ${formatToNaira(bundle.price)} — save ${bundle.savingsPercent}% on PalmTechnIQ.`
      : `${bundle.courses.length} courses for ${formatToNaira(bundle.price)} on PalmTechnIQ.`;

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
    <div className="min-h-screen bg-background pt-24 pb-16 overflow-x-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 w-full min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10 border-primary/20">
                <Sparkles className="mr-1 h-3 w-3" />
                Course bundle
              </Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words text-white">
                {bundle.title}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-gray-400">
                {bundle.courses.length}{" "}
                {bundle.courses.length === 1 ? "course" : "courses"} by{" "}
                {bundle.tutorName}
              </p>
            </div>

            <div className="shrink-0 pt-1">
              <ShareMenu
                url={shareUrl}
                title={bundle.title}
                text={shareText}
                className="border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"
              />
            </div>
          </div>

          {bundle.description && (
            <p className="mt-4 max-w-2xl text-sm sm:text-base text-gray-300">
              {bundle.description}
            </p>
          )}
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px] w-full min-w-0">
          <div className="space-y-3 min-w-0">
            {bundle.courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}>
                <Card className="overflow-hidden border-white/10 bg-white/[0.03] backdrop-blur-sm">
                  <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 min-w-0">
                    <div className="relative h-14 w-20 sm:h-16 sm:w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                      {course.thumbnail ? (
                        <Image
                          src={course.thumbnail}
                          alt={course.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 80px, 96px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm sm:text-base font-medium text-white">
                        {course.title}
                      </p>
                      <p className="truncate text-xs sm:text-sm text-gray-400 mt-0.5">
                        Sold separately for {formatToNaira(course.listPrice)}
                      </p>
                    </div>
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-primary" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start w-full min-w-0">
            <Card className="border-white/10 bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400 line-through">
                    {formatToNaira(bundle.listSum)}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {formatToNaira(bundle.price)}
                  </p>
                  {bundle.savings > 0 && (
                    <p className="mt-1 text-xs sm:text-sm font-medium text-neon-green">
                      Save {formatToNaira(bundle.savings)} (
                      {bundle.savingsPercent}%)
                    </p>
                  )}
                </div>

                <p className="text-xs text-gray-400">
                  VAT is added at checkout. Buying the bundle enrolls you in all{" "}
                  {bundle.courses.length}{" "}
                  {bundle.courses.length === 1 ? "course" : "courses"}{" "}
                  immediately.
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
                    <p className="text-center text-xs text-gray-400">
                      Signing in brings you straight back here. New?{" "}
                      <Link href="/signup" className="underline text-white hover:text-primary">
                        Create an account
                      </Link>
                      .
                    </p>
                  </>
                )}

                <p className="text-center text-[11px] text-gray-500">
                  Promo codes cannot be combined with a bundle price.
                </p>

                <div className="border-t border-white/10 pt-4">
                  <ShareMenu
                    url={shareUrl}
                    title={bundle.title}
                    text={shareText}
                    label="Share this bundle"
                    className="w-full justify-center border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"
                  />
                  {shareIsAttributed && (
                    <p className="mt-2 text-center text-[11px] text-gray-500">
                      Your referral code is attached, so sales from your link
                      are credited to you.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
