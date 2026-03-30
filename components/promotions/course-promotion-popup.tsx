"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Users,
  Clock,
  ArrowRight,
  Megaphone,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NairaSign } from "@/components/shared/naira-sign-icon";
import { trackPromotionClick } from "@/actions/promotions";
import Link from "next/link";
import Image from "next/image";

type PromotionData = {
  id: string;
  headline: string | null;
  description: string | null;
  ctaText: string | null;
  promoPrice: number | null;
  originalPrice: number | null;
  endDate: string | Date;
  course: {
    id: string;
    title: string;
    slug: string | null;
    thumbnail: string | null;
    description: string;
    currentPrice: number | null;
    basePrice: number | null;
    price: number;
    salePrice: number | null;
    level: string;
    totalLessons: number;
    duration: number | null;
    tutor: {
      user: { name: string; avatar: string | null };
    };
    enrollments: { id: string }[];
    reviews: { rating: number }[];
  };
};

const DISMISSED_KEY = "ptq_promo_dismissed";

/** Dismisses for 1 hour – popup shows again on next visit after that */
function isDismissed(promoId: string): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as { id: string; until: number };
    if (data.id === promoId && Date.now() < data.until) return true;
    // Expired or different promo – clear
    localStorage.removeItem(DISMISSED_KEY);
    return false;
  } catch {
    return false;
  }
}

function dismissPromo(promoId: string) {
  const until = Date.now() + 60 * 60 * 1000; // 1 hour
  localStorage.setItem(DISMISSED_KEY, JSON.stringify({ id: promoId, until }));
}

export default function CoursePromotionPopup({
  promotion,
}: {
  promotion: PromotionData | null;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!promotion) return;

    // Check if user dismissed this promotion recently (within 1 hour)
    if (isDismissed(promotion.id)) return;

    // Show after a short delay for better UX
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [promotion]);

  if (!promotion) return null;

  const course = promotion.course;
  const displayPrice =
    promotion.promoPrice ??
    course.salePrice ??
    course.currentPrice ??
    course.price;
  const originalPrice =
    promotion.originalPrice ??
    (course.basePrice && course.basePrice > displayPrice
      ? course.basePrice
      : null);
  const hasPrice = displayPrice > 0;
  const avgRating =
    course.reviews.length > 0
      ? (
          course.reviews.reduce((s, r) => s + r.rating, 0) /
          course.reviews.length
        ).toFixed(1)
      : null;
  const enrollmentCount = course.enrollments.length;
  const courseUrl = `/courses/${course.id}`;
  const endDate = new Date(promotion.endDate);
  const daysLeft = Math.max(
    0,
    Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  function handleDismiss() {
    dismissPromo(promotion!.id);
    setVisible(false);
  }

  async function handleClick() {
    await trackPromotionClick(promotion!.id);
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 border border-gray-700/50 rounded-2xl shadow-2xl">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>

              {/* Promoted badge */}
              <div className="absolute top-3 left-3 z-10">
                <Badge className="bg-orange-600/90 text-white border-0 text-xs gap-1">
                  <Megaphone className="w-3 h-3" />
                  Featured
                </Badge>
              </div>

              {/* Thumbnail */}
              {course.thumbnail && (
                <div className="relative h-44 w-full">
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                </div>
              )}

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Headline */}
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {promotion.headline || course.title}
                  </h2>
                  {promotion.description && (
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                      {promotion.description}
                    </p>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {avgRating && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-yellow-400" />
                      {avgRating}
                      <span className="text-gray-500">
                        ({course.reviews.length})
                      </span>
                    </span>
                  )}
                  {enrollmentCount > 0 && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <Users className="w-4 h-4" />
                      {enrollmentCount.toLocaleString()} enrolled
                    </span>
                  )}
                  {course.totalLessons > 0 && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <BookOpen className="w-4 h-4" />
                      {course.totalLessons} lessons
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className="border-gray-600 text-gray-400 text-xs">
                    {course.level}
                  </Badge>
                </div>

                {/* Tutor */}
                <div className="flex items-center gap-2">
                  {course.tutor.user.avatar ? (
                    <Image
                      src={course.tutor.user.avatar}
                      alt={course.tutor.user.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300">
                      {course.tutor.user.name[0]}
                    </div>
                  )}
                  <span className="text-gray-400 text-sm">
                    {course.tutor.user.name}
                  </span>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  {hasPrice ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white flex items-center">
                        <NairaSign className="text-sm" />
                        {displayPrice.toLocaleString()}
                      </span>
                      {originalPrice && originalPrice > displayPrice && (
                        <span className="text-sm text-gray-500 line-through flex items-center">
                          <NairaSign className="text-xs" />
                          {originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div />
                  )}

                  <Link href={courseUrl} onClick={handleClick}>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-1">
                      {promotion.ctaText || "Enroll Now"}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                {/* Offer timer hint */}
                {daysLeft > 0 && daysLeft <= 7 && (
                  <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    Offer ends in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
