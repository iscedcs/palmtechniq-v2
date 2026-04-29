"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Megaphone,
  Plus,
  Eye,
  MousePointerClick,
  Clock,
  CheckCircle,
  Ban,
  XCircle,
  Info,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NairaSign } from "@/components/shared/naira-sign-icon";
import { toast } from "sonner";
import {
  requestTutorPromotion,
  getTutorPromotions,
  verifyPromotionPayment,
} from "@/actions/promotions";

type Promotion = {
  id: string;
  courseId: string;
  type: string;
  status: string;
  headline: string | null;
  description: string | null;
  ctaText: string | null;
  promoPrice: number | null;
  originalPrice: number | null;
  paystackReference: string | null;
  startDate: string | Date;
  endDate: string | Date;
  fee: number;
  feePaid: boolean;
  impressions: number;
  clicks: number;
  createdAt: string | Date;
  course: {
    id: string;
    title: string;
    slug: string | null;
    thumbnail: string | null;
  };
};

type CourseOption = {
  id: string;
  title: string;
  slug: string | null;
  thumbnail: string | null;
  currentPrice: number | null;
  price: number;
};

const statusConfig: Record<
  string,
  { icon: React.ReactNode; className: string }
> = {
  ACTIVE: {
    icon: <CheckCircle className="w-4 h-4" />,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  PENDING: {
    icon: <Clock className="w-4 h-4" />,
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  PENDING_PAYMENT: {
    icon: <CreditCard className="w-4 h-4" />,
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  EXPIRED: {
    icon: <XCircle className="w-4 h-4" />,
    className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  },
  REJECTED: {
    icon: <Ban className="w-4 h-4" />,
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  CANCELLED: {
    icon: <Ban className="w-4 h-4" />,
    className: "bg-red-500/10 text-red-400 border-red-400/20",
  },
};

export default function TutorPromotionsClient({
  initialPromotions,
  courses,
  promotionFee,
  defaultDays,
}: {
  initialPromotions: Promotion[];
  courses: CourseOption[];
  promotionFee: number;
  defaultDays: number;
}) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const searchParams = useSearchParams();

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [ctaText, setCtaText] = useState("Enroll Now");
  const [durationDays, setDurationDays] = useState(String(defaultDays));
  const [promoPrice, setPromoPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");

  // Verify payment on redirect from Paystack
  useEffect(() => {
    const ref = searchParams?.get("verify");
    if (!ref) return;
    setVerifying(true);
    verifyPromotionPayment(ref)
      .then((res) => {
        if (res && "success" in res && res.success) {
          toast.success(
            res.alreadyPaid
              ? "Payment already verified"
              : "Payment confirmed! Your promotion is pending admin approval.",
          );
          refreshPromotions();
        } else {
          toast.error(
            (res as { error: string }).error || "Verification failed",
          );
        }
      })
      .finally(() => setVerifying(false));
    // Clean the URL
    window.history.replaceState({}, "", "/tutor/promotions");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (!selectedCourseId) {
      toast.error("Please select a course");
      return;
    }
    setLoading(true);
    const res = await requestTutorPromotion({
      courseId: selectedCourseId,
      headline: headline || undefined,
      description: description || undefined,
      ctaText: ctaText || undefined,
      promoPrice: promoPrice ? parseFloat(promoPrice) : undefined,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      durationDays: parseInt(durationDays) || defaultDays,
    });
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else if (res && "paymentUrl" in res && res.paymentUrl) {
      toast.success("Redirecting to payment...");
      window.location.href = res.paymentUrl;
    } else {
      toast.success("Promotion request submitted!");
      setShowCreate(false);
      resetForm();
      refreshPromotions();
    }
  }

  function resetForm() {
    setSelectedCourseId("");
    setHeadline("");
    setDescription("");
    setCtaText("Enroll Now");
    setDurationDays(String(defaultDays));
    setPromoPrice("");
    setOriginalPrice("");
  }

  async function refreshPromotions() {
    const res = await getTutorPromotions();
    if (res && "promotions" in res) {
      setPromotions(res.promotions ?? []);
    }
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <Megaphone className="w-7 h-7 text-primary" />
              Promote Your Courses
            </h1>
            <p className="text-gray-400 mt-1">
              Boost visibility by promoting your courses to all learners
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-primary hover:bg-secondary text-white">
            <Plus className="w-4 h-4 mr-2" />
            Request Promotion
          </Button>
        </div>

        {/* Fee notice */}
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-gray-300">
              <p>
                Promoted courses appear as a featured popup when users visit the
                courses page. A fee of{" "}
                <strong className="text-white">
                  <NairaSign className="text-xs" />
                  {promotionFee.toLocaleString()}
                </strong>{" "}
                applies per promotion. You&apos;ll be redirected to pay
                immediately after submitting your request. Once paid, the admin
                team will review and schedule your promotion.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment verification indicator */}
        {verifying && (
          <Card className="bg-orange-500/5 border-orange-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-orange-400 animate-spin shrink-0" />
              <p className="text-sm text-gray-300">
                Verifying your payment, please wait...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Promotions list */}
        {promotions.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="py-16 text-center">
              <Megaphone className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                You haven&apos;t created any promotions yet.
              </p>
              <Button
                className="mt-4 bg-orange-600 hover:bg-orange-700"
                onClick={() => setShowCreate(true)}>
                Create Your First Promotion
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {promotions.map((promo) => {
              const start = new Date(promo.startDate);
              const end = new Date(promo.endDate);
              const config = statusConfig[promo.status] || statusConfig.PENDING;
              const ctr =
                promo.impressions > 0
                  ? ((promo.clicks / promo.impressions) * 100).toFixed(1)
                  : "0";

              return (
                <Card key={promo.id} className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">
                          {promo.course.title}
                        </h3>
                        {promo.headline &&
                          promo.headline !== promo.course.title && (
                            <p className="text-gray-400 text-sm mt-0.5">
                              &ldquo;{promo.headline}&rdquo;
                            </p>
                          )}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
                          <span>
                            {start.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                            })}{" "}
                            –{" "}
                            {end.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {promo.impressions.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="w-3.5 h-3.5" />
                            {promo.clicks.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({ctr}% CTR)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={config.className}>
                          <span className="mr-1">{config.icon}</span>
                          {promo.status === "PENDING_PAYMENT"
                            ? "Awaiting Payment"
                            : promo.status}
                        </Badge>
                        {promo.fee > 0 && (
                          <Badge
                            variant="outline"
                            className={
                              promo.feePaid
                                ? "border-green-500/20 text-green-400"
                                : "border-red-500/20 text-red-400"
                            }>
                            <NairaSign className="text-xs" />
                            {promo.fee.toLocaleString()}
                            {!promo.feePaid && " (unpaid)"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {promo.status === "PENDING_PAYMENT" &&
                      promo.paystackReference && (
                        <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-3">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={verifying}
                            onClick={async () => {
                              setVerifying(true);
                              const res = await verifyPromotionPayment(
                                promo.paystackReference!,
                              );
                              setVerifying(false);
                              if (res && "success" in res && res.success) {
                                toast.success(
                                  "Payment verified! Your promotion is now pending admin approval.",
                                );
                                refreshPromotions();
                              } else {
                                toast.error(
                                  (res as { error: string }).error ||
                                    "Could not verify payment",
                                );
                              }
                            }}>
                            {verifying ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-1" />
                            )}
                            Verify Payment
                          </Button>
                          <p className="text-xs text-gray-500">
                            Already paid? Click to verify and complete your
                            promotion request.
                          </p>
                        </div>
                      )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ─── Create Dialog ──────────────────────────────────────────────── */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" />
                Request Course Promotion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Course</Label>
                <Select
                  value={selectedCourseId}
                  onValueChange={(val) => {
                    setSelectedCourseId(val);
                    const c = courses.find((x) => x.id === val);
                    if (c) {
                      setHeadline(c.title);
                      setOriginalPrice(String(c.currentPrice ?? c.price ?? ""));
                    }
                  }}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Choose a course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Promotion Headline</Label>
                <Input
                  placeholder="Catchy headline..."
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Why should someone enroll?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (days)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>
                    Promo Price (<NairaSign className="text-xs" />)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Special promo price"
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                  <p className="text-gray-500 text-xs">
                    Price shown on the popup ad. Leave empty to hide price.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>
                    Original Price (<NairaSign className="text-xs" />)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Crossed-out price"
                    value={originalPrice}
                    disabled
                    className="bg-gray-800 border-gray-700 opacity-60 cursor-not-allowed"
                  />
                  <p className="text-gray-500 text-xs">
                    Auto-filled from course price (read-only)
                  </p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-3 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Promotion Fee:</span>
                  <span className="text-white font-medium">
                    <NairaSign className="text-xs" />
                    {promotionFee.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You&apos;ll be redirected to Paystack for payment
                </p>
              </div>

              <Button
                className="w-full bg-primary hover:bg-secondary"
                onClick={handleSubmit}
                disabled={loading || !selectedCourseId}>
                {loading ? "Processing..." : "Submit & Pay"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
