"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Clock,
  Star,
  Globe,
  Smartphone,
  Monitor,
  Infinity,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatToNaira } from "@/lib/utils";

type PricingInput = {
  basePrice: number; // e.g. ₦50,000
  currentPrice: number; // e.g. ₦35,000
  discountPercent?: number; // optional if you store it; otherwise computed
  vatRate?: number; // e.g. 0.075 (7.5%)
  currency?: "NGN" | string;
};
interface CheckoutCoursePageProps {
  instructor: any;
  rating?: number;
  duration?: number | null;
  title?: string;
  subtitle?: string;
  totalLesson?: number | null;
  courseId?: string;
  pricing: PricingInput;
}

export default function CheckoutCoursePage({
  instructor,
  rating,
  duration,
  title,
  subtitle,
  totalLesson,
  courseId,
  pricing,
  onProceed,
}: CheckoutCoursePageProps & { onProceed: () => Promise<void> }) {
  const router = useRouter();
  const [applyingCode, setApplyingCode] = useState(false);
  const [coupon, setCoupon] = useState("");
  console.log({ instructor, rating, duration });

  const { subtotal, discountAmt, vatAmt, total, discountPercent } =
    useMemo(() => {
      const base = Math.max(0, pricing.basePrice || 0);
      const current = Math.max(0, pricing.currentPrice || 0);

      // If discount % not provided, derive from base/current
      const derivedPct =
        base > 0 && current < base
          ? Math.round(((base - current) / base) * 100)
          : 0;

      const pct = pricing.discountPercent ?? (derivedPct > 0 ? derivedPct : 0);
      const discountAmt =
        base > current ? base - current : Math.round((base * pct) / 100);

      const subtotal = current; // the price user pays before VAT (if you charge VAT)
      const vatRate = pricing.vatRate ?? 0;
      const vatAmt = Math.round(subtotal * vatRate);
      const total = subtotal + vatAmt;

      return { subtotal, discountAmt, vatAmt, total, discountPercent: pct };
    }, [pricing]);

  // const onProceed = () => {
  //   // Next step: we’ll replace this with a server action that:
  //   // 1) creates an Order row (PENDING) and 2) initializes Paystack to get an authorization_url
  //   router.push(`/courses/${courseId}/pay`); // placeholder route for next step
  // };

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push(`/courses/${courseId}`)}
              className="text-gray-400 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Details */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}>
                <h1 className="text-4xl font-bold text-gradient mb-2">
                  Checkout
                </h1>
                <p className="text-gray-400 mb-8">
                  Review your order and continue to payment
                </p>

                <Card className="glass-card border-white/10 hover-glow">
                  <CardHeader>
                    <h2 className="text-xl font-semibold text-white">Course</h2>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm leading-tight mb-1">
                          {title}
                        </h3>
                        <p className="text-xs text-gray-400">{subtitle}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              {instructor?.avatar ? (
                                <AvatarImage
                                  src={instructor.avatar}
                                  alt={instructor.user?.name || "Tutor"}
                                />
                              ) : null}
                              <AvatarFallback className="text-[10px]">
                                {instructor?.user?.name?.[0] || "T"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-gray-300">
                              {instructor?.user?.name || "PalmTechnIQ Tutor"}
                            </span>
                          </div>

                          {typeof rating === "number" && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-300">
                                {rating.toFixed(1)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-300">
                              {duration ? `${duration} mins` : "self-paced"}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-300">
                              {totalLesson ?? 0} lessons
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div>
                      <h4 className="text-white font-semibold mb-3">
                        What’s included
                      </h4>
                      <ul className="grid sm:grid-cols-2 gap-2 text-xs text-gray-300">
                        <li className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-neon-blue" /> Desktop
                          access
                        </li>
                        <li className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-neon-blue" />{" "}
                          Mobile access
                        </li>
                        <li className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-neon-blue" /> Online,
                          self-paced
                        </li>
                        <li className="flex items-center gap-2">
                          <Infinity className="w-4 h-4 text-neon-blue" />{" "}
                          Lifetime access
                        </li>
                      </ul>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="flex items-center justify-center space-x-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 text-sm font-semibold">
                        30-day money-back guarantee
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right: Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="glass-card border-white/10 hover-glow">
                  <CardHeader>
                    <h2 className="text-2xl font-bold text-white">
                      Order Summary
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price</span>
                        <span className="text-white">
                          {formatToNaira(pricing.basePrice)}
                        </span>
                      </div>

                      {discountPercent > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            Discount ({discountPercent}%)
                          </span>
                          <span className="text-green-400">
                            −{formatToNaira(discountAmt)}
                          </span>
                        </div>
                      )}

                      <Separator className="bg-white/10 my-2" />

                      <div className="flex justify-between">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="text-white">
                          {formatToNaira(subtotal)}
                        </span>
                      </div>

                      {pricing.vatRate ? (
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            VAT (
                            {Math.round((pricing.vatRate || 0) * 1000) / 10}%)
                          </span>
                          <span className="text-white">
                            {formatToNaira(vatAmt)}
                          </span>
                        </div>
                      ) : null}

                      <div className="flex justify-between text-base font-semibold pt-1">
                        <span className="text-white">Total</span>
                        <span className="text-white">
                          {formatToNaira(total)}
                        </span>
                      </div>
                    </div>

                    {/* (Optional) Coupon UI – non-blocking for now */}
                    <div className="mt-2">
                      <div className="flex gap-2">
                        <input
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                          placeholder="Promo code"
                          className="w-full rounded-md bg-transparent border border-white/15 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                        <Button
                          variant="outline"
                          disabled={!coupon || applyingCode}
                          onClick={() => {
                            // next step: call a server action to validate and recalc totals
                            setApplyingCode(true);
                            setTimeout(() => setApplyingCode(false), 600);
                          }}
                          className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                          Apply
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={async () => {
                        onProceed();
                      }}
                      className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white text-lg py-4 disabled:opacity-50">
                      Proceed to Checkout
                    </Button>

                    <p className="text-[11px] text-gray-400 text-center">
                      By continuing, you agree to our Terms and acknowledge our
                      Refund Policy.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
