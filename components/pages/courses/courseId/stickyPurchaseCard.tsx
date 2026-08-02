"use client";

import { toggleWishlist } from "@/actions/wishlist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle, Heart, Play, Share2, ShoppingCart } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatDurationMinutes } from "@/lib/utils";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

export default function StickyPurchaseCard({
  currentPrice,
  originalPrice,
  discount,
  duration,
  lessons,
  level,
  language,
  certificate,
  isEnrolled,
  isInCart,
  courseId,
  courseTitle,
  courseDescription,
  courseThumbnail,
  flashSaleEnd,
  isFlashSale,
}: {
  currentPrice: number;
  originalPrice?: number;
  discount?: number;
  duration: number | string;
  lessons: number;
  level: string;
  language: string;
  certificate: boolean;
  isEnrolled: boolean;
  isInCart: boolean;
  courseId: string;
  courseTitle?: string;
  courseDescription?: string;
  courseThumbnail?: string;
  /** The datetime when the flash sale / promo ends */
  flashSaleEnd?: Date | string;
  /** Whether a flash sale / promo is currently active */
  isFlashSale?: boolean;
}) {
  const { status } = useSession();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ── Live countdown for flash sale / active promotion ──
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!isFlashSale || !flashSaleEnd) return;
    const end = new Date(flashSaleEnd).getTime();
    function tick() {
      const diff = end - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(
        [
          d > 0 ? `${d}d` : null,
          `${h.toString().padStart(2, "0")}h`,
          `${m.toString().padStart(2, "0")}m`,
          `${s.toString().padStart(2, "0")}s`,
        ]
          .filter(Boolean)
          .join(" "),
      );
    }
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [isFlashSale, flashSaleEnd]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/wishlist/check?courseId=${courseId}`);
        const data = await res.json();
        setIsWishlisted(data.exists);
      } catch (error) {
        console.error("Wishlist check failed:", error);
      }
    })();
  }, [courseId]);

  const handleWishlist = async () => {
    if (status === "unauthenticated") {
      toast("Sign in to manage wishlist", {
        description: "You need to log in to save courses.",
      });
      return;
    }

    startTransition(async () => {
      const res = await toggleWishlist(courseId);
      if (res.success) {
        setIsWishlisted((prev) => !prev);
        toast.success(res.message);
      } else {
        toast.error(res.message || "Something went wrong");
      }
    });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/courses/${courseId}`;
    const shareTitle = courseTitle || "Check out this course!";
    const shareText = courseDescription
      ? `${courseTitle} - ${courseDescription.slice(0, 100)}${courseDescription.length > 100 ? "..." : ""}`
      : `I found this amazing course on PalmTechnIQ — check it out!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Course link copied to clipboard!");
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Course link copied to clipboard!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="sticky top-24">
      <Card className="glass-card border-white/10 hover-glow">
        <CardContent className="p-6">
          {isEnrolled && (
            <div className="text-center mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-semibold">You're enrolled!</p>
            </div>
          )}

          {/* Flash sale countdown banner */}
          {isFlashSale && timeLeft && !isEnrolled && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mb-4 px-3 py-2 rounded-lg bg-highlight-maroon/60 border border-orange-500/30 text-orange-400 text-sm font-medium">
              <span>Flash Sale ends in</span>
              <span className="font-mono font-bold tracking-wide">
                {timeLeft}
              </span>
            </motion.div>
          )}

          {/* Pricing */}
          {!isEnrolled && (
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-3xl font-bold text-white">
                  ₦{currentPrice.toLocaleString()}
                </span>
                {originalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    ₦{originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {discount && discount > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {discount}% OFF
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4 mb-6">
            <Button
              onClick={() => console.log("Enroll clicked")}
              className="w-full text-white text-lg py-3 bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 transition">
              {isEnrolled ? (
                <Link
                  href={`/courses/${courseId}/learn`}
                  className="flex items-center justify-center w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Start Learning
                </Link>
              ) : isInCart ? (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Go to Cart
                </>
              ) : (
                <Link
                  href={`/courses/${courseId}/checkout`}
                  className="flex mx-auto items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Enroll Now
                </Link>
              )}
            </Button>

            {!isEnrolled && (
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
                disabled={isPending}
                onClick={handleWishlist}>
                <Heart
                  className={`w-4 h-4 mr-2 ${
                    isWishlisted ? "fill-current text-red-400" : ""
                  }`}
                />
                {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              </Button>
            )}
          </div>

          {/* Course Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Duration</span>
              <span className="text-white">{formatDurationMinutes(duration)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Lessons</span>
              <span className="text-white">{lessons}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Level</span>
              <span className="text-white">{level}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Language</span>
              <span className="text-white">{language}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Certificate</span>
              <span className="text-white">{certificate ? "Yes" : "No"}</span>
            </div>
          </div>

          {/* Share Button */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
              onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Course
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
