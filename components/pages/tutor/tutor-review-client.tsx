"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  ShieldCheck,
  Award,
  BookOpen,
  GraduationCap,
  Sparkles,
  Check,
  Copy,
  Share2,
  QrCode,
  ArrowRight,
  LogIn,
  ThumbsUp,
  MessageSquare,
  User,
  HeartHandshake,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createTutorDirectReview, deleteReview, updateReview } from "@/actions/review";
import { CertificateQrModal } from "@/components/certificate/qr-code-modal";

interface TutorReviewProfileData {
  id: string;
  userId: string;
  name: string;
  username: string | null;
  avatar: string | null;
  title: string;
  expertise: string[];
  experience: number;
  totalReviews: number;
  averageRating: number;
  isVerified: boolean;
  referralCode: string | null;
  courses: {
    id: string;
    title: string;
    slug: string;
    category?: string;
    level?: string;
  }[];
  programs: {
    id: string;
    name: string;
    slug: string;
    cohort: string;
  }[];
}

interface StudentContextItem {
  type: "PROGRAM" | "COURSE" | "DIRECT";
  id: string;
  label: string;
  sublabel?: string;
}

interface ExistingReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  communicationRating?: number | null;
  clarityRating?: number | null;
  expertiseRating?: number | null;
  reviewType: string;
  verifiedContext?: string | null;
  createdAt: Date | string;
  responseText?: string | null;
  user?: {
    name: string | null;
    image: string | null;
    avatar: string | null;
  };
}

interface TutorReviewClientProps {
  tutor: TutorReviewProfileData;
  reviews: ExistingReviewItem[];
  userReview: ExistingReviewItem | null;
  studentContexts: StudentContextItem[];
  isOwnProfile: boolean;
  isLoggedIn: boolean;
  currentUserId?: string;
  currentUserRole?: string;
  currentPath: string;
}

const QUICK_TAGS = [
  "Clear & patient explanations",
  "Great real-world examples",
  "Always supportive in Q&A",
  "Practical code reviews",
  "Inspiring & motivating",
  "Deep industry expertise",
];

const RATING_LABELS: Record<number, string> = {
  1: "Needs Improvement",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Exceptional & Masterful",
};

export function TutorReviewClient({
  tutor,
  reviews,
  userReview: initialUserReview,
  studentContexts,
  isOwnProfile,
  isLoggedIn,
  currentUserId,
  currentUserRole,
  currentPath,
}: TutorReviewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Review Form States
  const [userReview, setUserReview] = useState<ExistingReviewItem | null>(
    initialUserReview,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState<number>(initialUserReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(
    initialUserReview?.comment || "",
  );
  const [selectedContextId, setSelectedContextId] = useState<string>(
    studentContexts[0]?.id || "general",
  );

  // Criteria ratings
  const [communicationRating, setCommunicationRating] = useState<number>(
    initialUserReview?.communicationRating || 5,
  );
  const [clarityRating, setClarityRating] = useState<number>(
    initialUserReview?.clarityRating || 5,
  );
  const [expertiseRating, setExpertiseRating] = useState<number>(
    initialUserReview?.expertiseRating || 5,
  );

  // Share & QR Modal States
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const fullShareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${currentPath}`
      : `https://www.palmtechniq.com${currentPath}`;

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopiedLink(true);
    toast.success("Review link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const selectedContext = studentContexts.find(
    (c) => c.id === selectedContextId,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || rating < 1) {
      toast.error("Please select a rating star (1 to 5).");
      return;
    }

    if (comment.trim().length < 3) {
      toast.error("Please provide a short feedback comment (at least 3 characters).");
      return;
    }

    startTransition(async () => {
      let programId: string | undefined = undefined;
      let courseId: string | undefined = undefined;
      let reviewType: "COURSE" | "PROGRAM" | "DIRECT" = "DIRECT";

      if (selectedContext?.type === "PROGRAM") {
        programId = selectedContext.id;
        reviewType = "PROGRAM";
      } else if (selectedContext?.type === "COURSE") {
        courseId = selectedContext.id;
        reviewType = "COURSE";
      }

      const res = await createTutorDirectReview({
        tutorId: tutor.id,
        courseId,
        programId,
        reviewType,
        rating,
        comment: comment.trim(),
        communicationRating,
        clarityRating,
        expertiseRating,
      });

      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }

      if (res.success && res.review) {
        toast.success("Thank you! Your review has been published.");
        setUserReview(res.review as any);
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const handleDeleteReview = () => {
    if (!userReview?.id) return;
    startTransition(async () => {
      const res = await deleteReview(userReview.id);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Your review was deleted.");
      setUserReview(null);
      setRating(5);
      setComment("");
      setIsEditing(false);
      router.refresh();
    });
  };

  const addQuickTag = (tag: string) => {
    if (!comment.includes(tag)) {
      setComment((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ============================================================ */}
        {/* 1. TUTOR PROFILE HERO BANNER */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-6 sm:p-8 overflow-hidden glass-card border border-white/10 bg-gradient-to-br from-white/[0.04] via-black/80 to-neon-purple/[0.05]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-neon-blue/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-neon-purple/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative">
                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-neon-blue/40 shadow-xl shadow-neon-blue/10">
                  <AvatarImage src={tutor.avatar || undefined} alt={tutor.name} />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-neon-blue to-neon-purple text-white">
                    {tutor.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {tutor.isVerified && (
                  <div
                    className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1.5 rounded-full shadow-lg"
                    title="Verified PalmTechnIQ Instructor">
                    <ShieldCheck className="w-4 h-4 text-black" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {tutor.name}
                  </h1>
                  {tutor.isVerified && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px]">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Verified Instructor
                    </Badge>
                  )}
                </div>

                <p className="text-gray-300 text-sm font-medium">
                  {tutor.title || "Senior Instructor & Mentor"}
                </p>

                {/* Rating & Reviews Stats */}
                <div className="flex flex-wrap items-center gap-4 text-xs pt-1 text-gray-300">
                  <div className="flex items-center gap-1 font-semibold text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm text-white">
                      {tutor.averageRating > 0
                        ? tutor.averageRating.toFixed(1)
                        : "5.0"}
                    </span>
                    <span className="text-gray-400 font-normal">
                      ({tutor.totalReviews}{" "}
                      {tutor.totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  </div>

                  <span className="text-white/20">•</span>

                  <div className="flex items-center gap-1 text-gray-300">
                    <Clock className="w-3.5 h-3.5 text-neon-blue" />
                    <span>{tutor.experience} Years Experience</span>
                  </div>

                  {tutor.courses.length > 0 && (
                    <>
                      <span className="text-white/20">•</span>
                      <div className="flex items-center gap-1 text-gray-300">
                        <BookOpen className="w-3.5 h-3.5 text-neon-purple" />
                        <span>
                          {tutor.courses.length}{" "}
                          {tutor.courses.length === 1 ? "Course" : "Courses"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Expertise Badges */}
                {tutor.expertise && tutor.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {tutor.expertise.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-gray-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Share / QR Buttons */}
            <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyShareLink}
                className="flex-1 md:flex-none border-white/20 text-gray-200 hover:text-white hover:bg-white/10 text-xs h-9">
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 mr-1.5 text-neon-blue" />
                )}
                {copiedLink ? "Copied!" : "Share Link"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setQrOpen(true)}
                className="flex-1 md:flex-none border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10 text-xs h-9">
                <QrCode className="w-3.5 h-3.5 mr-1.5" />
                QR Code
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* 2. OWN PROFILE ALERT FOR TUTOR */}
        {/* ============================================================ */}
        {isOwnProfile && (
          <div className="p-4 rounded-2xl bg-neon-blue/10 border border-neon-blue/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-neon-blue shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  You are viewing your public review page
                </p>
                <p className="text-xs text-gray-300">
                  Share this page URL or download your QR code to collect verified feedback from your students.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleCopyShareLink}
              size="sm"
              className="bg-neon-blue hover:bg-neon-blue/80 text-black font-semibold text-xs shrink-0">
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy Review Link
            </Button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. REVIEW SUBMISSION SECTION */}
        {/* ============================================================ */}
        {!isOwnProfile && (
          <div>
            {!isLoggedIn ? (
              // SIGN-IN REQUIRED CARD
              <Card className="glass-card border-white/10 bg-white/[0.02] p-8 text-center rounded-3xl space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center text-neon-blue">
                  <Star className="w-7 h-7 fill-neon-blue" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-white">
                    Share Your Feedback for {tutor.name}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Sign in as a student to rate your learning experience, course delivery, and mentorship.
                  </p>
                </div>
                <div className="pt-2 flex justify-center">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white font-semibold h-11 px-8 rounded-xl shadow-lg shadow-neon-blue/20">
                    <Link
                      href={`/login?callbackUrl=${encodeURIComponent(currentPath)}`}>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In to Leave a Review
                    </Link>
                  </Button>
                </div>
              </Card>
            ) : userReview && !isEditing ? (
              // ALREADY REVIEWED CARD
              <Card className="glass-card border-emerald-500/30 bg-emerald-500/[0.03] rounded-3xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-white">
                          Your Review is Published
                        </CardTitle>
                        <p className="text-xs text-gray-400">
                          Thank you for sharing your experience with {tutor.name}.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="border-white/20 text-gray-300 hover:text-white text-xs h-8">
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteReview}
                        disabled={isPending}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-8">
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= userReview.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-amber-400">
                      {RATING_LABELS[userReview.rating]}
                    </span>
                    {userReview.verifiedContext && (
                      <Badge className="bg-white/10 text-gray-300 text-[10px] ml-auto">
                        {userReview.verifiedContext}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-200 leading-relaxed italic">
                    &ldquo;{userReview.comment}&rdquo;
                  </p>
                </CardContent>
              </Card>
            ) : (
              // REVIEW SUBMISSION FORM
              <Card className="glass-card border-white/10 bg-white/[0.02] rounded-3xl overflow-hidden shadow-2xl">
                <CardHeader className="border-b border-white/10 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        {isEditing
                          ? `Edit Your Review for ${tutor.name}`
                          : `Leave a Review for ${tutor.name}`}
                      </CardTitle>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Your honest feedback helps fellow students and allows instructors to continuously improve.
                      </p>
                    </div>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="text-gray-400 hover:text-white text-xs">
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Learning Context Selector */}
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-neon-blue" />
                        What is your learning context with {tutor.name}?
                      </label>
                      <Select
                        value={selectedContextId}
                        onValueChange={setSelectedContextId}>
                        <SelectTrigger className="glass-card border-white/20 text-white h-11 text-xs sm:text-sm">
                          <SelectValue placeholder="Select learning context" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/10 text-white">
                          {studentContexts.map((ctx) => (
                            <SelectItem key={ctx.id} value={ctx.id}>
                              <div className="flex items-center gap-2 py-0.5">
                                <span className="font-medium text-white">
                                  {ctx.label}
                                </span>
                                {ctx.sublabel && (
                                  <span className="text-[11px] text-gray-400">
                                    ({ctx.sublabel})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Overall Star Rating */}
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs uppercase tracking-wider text-gray-300 font-semibold">
                          Overall Rating
                        </label>
                        <span className="text-xs font-bold text-amber-400">
                          {RATING_LABELS[hoverRating || rating] || "Select Rating"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1.5 transition-transform hover:scale-125 focus:outline-none">
                            <Star
                              className={`w-8 h-8 transition-colors ${
                                star <= (hoverRating || rating)
                                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                                  : "text-gray-600 hover:text-gray-400"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Criteria Sub-Ratings */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Communication */}
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                        <span className="text-xs text-gray-300 font-medium block">
                          Communication & Support
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setCommunicationRating(s)}
                              className="p-0.5 focus:outline-none">
                              <Star
                                className={`w-4 h-4 ${
                                  s <= communicationRating
                                    ? "fill-neon-blue text-neon-blue"
                                    : "text-gray-600"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Clarity */}
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                        <span className="text-xs text-gray-300 font-medium block">
                          Teaching Clarity
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setClarityRating(s)}
                              className="p-0.5 focus:outline-none">
                              <Star
                                className={`w-4 h-4 ${
                                  s <= clarityRating
                                    ? "fill-neon-purple text-neon-purple"
                                    : "text-gray-600"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Expertise */}
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                        <span className="text-xs text-gray-300 font-medium block">
                          Subject Expertise
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setExpertiseRating(s)}
                              className="p-0.5 focus:outline-none">
                              <Star
                                className={`w-4 h-4 ${
                                  s <= expertiseRating
                                    ? "fill-emerald-400 text-emerald-400"
                                    : "text-gray-600"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Written Comment Box */}
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold flex items-center justify-between">
                        <span>Your Feedback & Experience</span>
                        <span className="text-[11px] text-gray-500 font-normal">
                          Min 3 characters
                        </span>
                      </label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={`Share what you enjoyed most about learning with ${tutor.name}. Mention course structure, mentorship, coding exercises, or practical feedback...`}
                        rows={4}
                        className="glass-card border-white/20 text-white placeholder:text-gray-500 text-sm"
                        required
                      />

                      {/* Quick Tag Prompts */}
                      <div className="pt-1">
                        <span className="text-[11px] text-gray-400 block mb-1.5 font-medium">
                          Quick tags (click to add):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_TAGS.map((tag, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => addQuickTag(tag)}
                              className="px-2.5 py-1 rounded-full text-[11px] bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors">
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white font-semibold h-11 rounded-xl shadow-lg shadow-neon-blue/20">
                        {isPending ? (
                          "Submitting..."
                        ) : isEditing ? (
                          "Update My Review"
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Publish Verified Review
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. RECENT VERIFIED REVIEWS LIST */}
        {/* ============================================================ */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-neon-blue" />
              Verified Student Reviews ({reviews.length})
            </h2>
            <Badge
              variant="outline"
              className="border-white/20 text-gray-400 text-xs">
              Latest Feedback
            </Badge>
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 text-center rounded-2xl glass-card border-white/10 text-gray-400">
              <Star className="w-8 h-8 mx-auto text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-300">
                No reviews yet for {tutor.name}.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Be the first verified student to share your experience!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl glass-card border border-white/10 bg-white/[0.01] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-white/10">
                        <AvatarImage src={rev.user?.avatar || rev.user?.image || undefined} />
                        <AvatarFallback className="bg-white/10 text-white text-xs font-bold">
                          {rev.user?.name?.slice(0, 2).toUpperCase() || "ST"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">
                            {rev.user?.name || "Student"}
                          </span>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                            <ShieldCheck className="w-2.5 h-2.5 mr-1" />
                            Verified
                          </Badge>
                        </div>
                        {rev.verifiedContext && (
                          <p className="text-[11px] text-gray-400">
                            {rev.verifiedContext}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {rev.comment}
                    </p>
                  )}

                  {/* Tutor Reply */}
                  {rev.responseText && (
                    <div className="p-3 rounded-xl bg-neon-purple/5 border border-neon-purple/20 space-y-1 ml-4 sm:ml-8">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neon-purple">
                        <Award className="w-3.5 h-3.5" />
                        <span>Response from {tutor.name}</span>
                      </div>
                      <p className="text-xs text-gray-300 italic">
                        &ldquo;{rev.responseText}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. QR CODE MODAL FOR TUTOR */}
      {/* ============================================================ */}
      <CertificateQrModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        credentialId={`tutor/${tutor.referralCode || tutor.username || tutor.id}`}
        studentName={tutor.name}
        certificateTitle={`PalmTechnIQ Instructor · ${tutor.title}`}
      />
    </div>
  );
}
