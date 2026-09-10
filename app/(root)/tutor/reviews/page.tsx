"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Reply,
  Filter,
  Search,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  Send,
  Heart,
  Flag,
  MoreHorizontal,
  Copy,
  QrCode,
  Share2,
  Sparkles,
  Check,
} from "lucide-react";
import { CertificateQrModal } from "@/components/certificate/qr-code-modal";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { generateRandomAvatar } from "@/lib/utils";
import {
  getTutorReviewsOverview,
  respondToReview,
  toggleReviewReaction,
} from "@/actions/review";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ReviewItem = {
  id: string;
  student: {
    name: string;
    avatar: string;
    initials: string;
  };
  course: string;
  rating: number;
  createdAt: Date;
  date: string;
  review: string;
  helpful: number;
  likes: number;
  reports: number;
  response: { text: string; date: string } | null;
  verified: boolean;
  verifiedContext?: string;
  reviewType?: string;
};

type RatingTrend = { month: string; rating: number };
type RatingDistribution = { stars: number; count: number };

export default function TutorReviewsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [responseRate, setResponseRate] = useState(0);
  const [recentGrowth, setRecentGrowth] = useState(0);
  const [pendingReplies, setPendingReplies] = useState(0);
  const [ratingTrends, setRatingTrends] = useState<RatingTrend[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<
    RatingDistribution[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [tutorId, setTutorId] = useState("");
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [minRating, setMinRating] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadReviews = async () => {
      setLoading(true);
      const result = await getTutorReviewsOverview();
      if (!isMounted) return;
      if ("error" in result) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      setTutorId(result.tutorId || "");
      setUsername(result.username || "");
      setReferralCode(result.referralCode || "");

      const mappedReviews = result.reviews.map((review: any) => {
        const name = review.user?.name || "Student";
        const initials = name
          .split(" ")
          .map((part: string) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        const courseOrProgram = review.program?.name
          ? `Program: ${review.program.name}`
          : review.course?.title ||
            review.verifiedContext ||
            "Tutoring & Mentorship";

        return {
          id: review.id,
          student: {
            name,
            avatar:
              review.user?.avatar ||
              review.user?.image ||
              generateRandomAvatar(),
            initials,
          },
          course: courseOrProgram,
          rating: review.rating,
          createdAt: new Date(review.createdAt),
          date: new Date(review.createdAt).toLocaleDateString(),
          review: review.comment || "",
          helpful: review.reactions.filter((r: any) => r.type === "HELPFUL")
            .length,
          likes: review.reactions.filter((r: any) => r.type === "LIKE").length,
          reports: review.reactions.filter((r: any) => r.type === "REPORT")
            .length,
          response: review.responseText
            ? {
                text: review.responseText,
                date: review.respondedAt
                  ? new Date(review.respondedAt).toLocaleDateString()
                  : "Just now",
              }
            : null,
          verified: true,
          verifiedContext:
            review.verifiedContext ||
            (review.program
              ? `Verified Program Student · ${review.program.name}`
              : review.course
                ? `Verified Course Student · ${review.course.title}`
                : "Verified Platform Student"),
          reviewType: review.reviewType || "COURSE",
        };
      });

      setReviews(mappedReviews);
      setAverageRating(result.averageRating);
      setTotalReviews(result.totalReviews);
      setRatingDistribution(result.ratingDistribution);
      setRatingTrends(result.ratingTrends);
      setResponseRate(result.responseRate);
      setPendingReplies(result.pendingReplies ?? 0);
      setRecentGrowth(result.recentGrowth);
      setLoading(false);
    };
    loadReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredReviews = reviews
    .filter((review) => {
      const matchesSearch =
        review.review.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.course.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating =
        selectedRating === "all" || review.rating.toString() === selectedRating;
      const matchesMinRating =
        minRating === "all" || review.rating >= Number(minRating);
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "pending" && !review.response) ||
        (activeTab === "responded" && review.response);
      const fromDate = filterFrom ? new Date(filterFrom) : null;
      const toDate = filterTo ? new Date(filterTo) : null;
      const matchesFrom = fromDate ? review.createdAt >= fromDate : true;
      const matchesTo = toDate ? review.createdAt <= toDate : true;

      return (
        matchesSearch &&
        matchesRating &&
        matchesMinRating &&
        matchesTab &&
        matchesFrom &&
        matchesTo
      );
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
      if (sortBy === "highest") {
        return b.rating - a.rating;
      }
      if (sortBy === "lowest") {
        return a.rating - b.rating;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  const handleReply = async (reviewId: string) => {
    if (replyText.trim().length < 3) {
      toast.error("Response must be at least 3 characters.");
      return;
    }

    const result = await respondToReview(reviewId, replyText.trim());
    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    const newPending = Math.max(0, pendingReplies - 1);

    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              response: {
                text: replyText.trim(),
                date: new Date().toLocaleDateString(),
              },
            }
          : review,
      ),
    );
    setPendingReplies(newPending);
    setResponseRate(
      totalReviews > 0
        ? Math.round(((totalReviews - newPending) / totalReviews) * 100)
        : 0,
    );
    setReplyingTo(null);
    setReplyText("");
    toast.success("Response sent");
  };

  const handleReaction = async (
    reviewId: string,
    type: "HELPFUL" | "LIKE" | "REPORT",
  ) => {
    const result = await toggleReviewReaction(reviewId, type);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    setReviews((prev) =>
      prev.map((review) => {
        if (review.id !== reviewId) return review;
        const delta = result.added ? 1 : -1;
        if (type === "HELPFUL") {
          return { ...review, helpful: Math.max(0, review.helpful + delta) };
        }
        if (type === "LIKE") {
          return { ...review, likes: Math.max(0, review.likes + delta) };
        }
        return { ...review, reports: Math.max(0, review.reports + delta) };
      }),
    );

    toast.success(result.added ? "Updated" : "Removed");
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-500"
        }`}
      />
    ));
  };

  const StatCard = ({ icon: Icon, title, value, change, color }: any) => (
    <motion.div whileHover={{ scale: 1.02 }} className="group">
      <Card className="glass-card hover-glow border-white/10 overflow-hidden relative">
        <CardContent className="p-3.5 sm:p-5 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-gray-400 text-xs sm:text-sm font-medium truncate">
                {title}
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-1 sm:mt-2">
                {value}
              </p>
              {change && (
                <div
                  className={`flex items-center mt-1 sm:mt-2 text-xs sm:text-sm truncate ${
                    change > 0 ? "text-green-400" : "text-red-400"
                  }`}>
                  <TrendingUp className="w-3.5 h-3.5 mr-1 shrink-0" />
                  {change > 0 ? "+" : ""}
                  {change}%{" "}
                  <span className="hidden sm:inline ml-1">this month</span>
                </div>
              )}
            </div>
            <div
              className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r ${color} p-2.5 sm:p-3.5 md:p-4 group-hover:scale-110 transition-transform duration-300 shrink-0 flex items-center justify-center`}>
              <Icon className="w-full h-full text-white" />
            </div>
          </div>
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl sm:rounded-2xl pointer-events-none`}
          />
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16 sm:pt-20">
        {/* Hero Section */}
        <section className="py-6 sm:py-10 md:py-12 relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
          <motion.div
            className="absolute top-20 right-20 w-72 sm:w-96 h-72 sm:h-96 bg-neon-purple/10 rounded-full blur-3xl pointer-events-none"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3">
                  Reviews & <span className="text-gradient">Feedback</span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-300">
                  Manage student reviews and build your reputation
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setFiltersOpen(true)}
                  className="gap-2 border-white/20 text-white hover:bg-white/10 bg-transparent flex-1 sm:flex-initial text-xs sm:text-sm h-9 sm:h-10">
                  <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Advanced Filters
                </Button>
                <Button
                  onClick={() => setInsightsOpen(true)}
                  className="gap-2 bg-gradient-to-r from-neon-purple to-pink-400 text-white flex-1 sm:flex-initial text-xs sm:text-sm h-9 sm:h-10">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Review Insights
                </Button>
              </div>
            </motion.div>
            <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
              <DialogContent className="bg-black/95 border-white/10 text-white max-w-[92vw] sm:max-w-lg p-4 sm:p-6 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    Advanced Filters
                  </DialogTitle>
                  <DialogDescription className="text-gray-400 text-xs sm:text-sm">
                    Refine reviews by date and rating.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 sm:gap-4 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm text-gray-300">
                        From
                      </label>
                      <Input
                        type="date"
                        value={filterFrom}
                        onChange={(e) => setFilterFrom(e.target.value)}
                        className="bg-white/5 border-white/10 text-white text-xs sm:text-sm h-9 sm:h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm text-gray-300">
                        To
                      </label>
                      <Input
                        type="date"
                        value={filterTo}
                        onChange={(e) => setFilterTo(e.target.value)}
                        className="bg-white/5 border-white/10 text-white text-xs sm:text-sm h-9 sm:h-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm text-gray-300">
                        Minimum rating
                      </label>
                      <Select value={minRating} onValueChange={setMinRating}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs sm:text-sm h-9 sm:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10">
                          <SelectItem value="all">All ratings</SelectItem>
                          <SelectItem value="5">5 stars</SelectItem>
                          <SelectItem value="4">4 stars</SelectItem>
                          <SelectItem value="3">3 stars</SelectItem>
                          <SelectItem value="2">2 stars</SelectItem>
                          <SelectItem value="1">1 star</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm text-gray-300">
                        Sort by
                      </label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs sm:text-sm h-9 sm:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10">
                          <SelectItem value="newest">Newest</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                          <SelectItem value="highest">
                            Highest rating
                          </SelectItem>
                          <SelectItem value="lowest">Lowest rating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={insightsOpen} onOpenChange={setInsightsOpen}>
              <DialogContent className="bg-black/95 border-white/10 text-white max-w-[92vw] sm:max-w-lg p-4 sm:p-6 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    Review Insights
                  </DialogTitle>
                  <DialogDescription className="text-gray-400 text-xs sm:text-sm">
                    Snapshot of your review performance.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 text-xs sm:text-sm text-gray-300 mt-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                    <span>Average rating</span>
                    <span className="text-white font-semibold">
                      {averageRating.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                    <span>Total reviews</span>
                    <span className="text-white font-semibold">
                      {totalReviews}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                    <span>Response rate</span>
                    <span className="text-white font-semibold">
                      {responseRate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                    <span>Pending replies</span>
                    <span className="text-white font-semibold">
                      {pendingReplies}
                    </span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Share Review Link & QR Code Banner */}
            {tutorId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-6 sm:mb-8">
                <Card className="glass-card border-neon-purple/40 bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-transparent p-4 sm:p-6 rounded-2xl sm:rounded-3xl relative overflow-hidden shadow-2xl">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-5">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/40 text-[11px] sm:text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Shareable Review Link & QR
                        </Badge> */}
                        <span className="text-[11px] sm:text-xs text-gray-400">
                          Invite students from Courses, Cohorts & Workshops
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Collect Verified Reviews from Your Students
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                        Share your custom link or QR code with students after
                        class. Students who log in can rate your mentorship and
                        post verified feedback.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
                      <div className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-neon-blue truncate w-full sm:max-w-xs select-all">
                        {typeof window !== "undefined"
                          ? `${window.location.origin}/tutors/${username || referralCode || tutorId}/review`
                          : `/tutors/${username || referralCode || tutorId}/review`}
                      </div>

                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const url = `${window.location.origin}/tutors/${username || referralCode || tutorId}/review`;
                            navigator.clipboard.writeText(url);
                            setCopiedShareLink(true);
                            toast.success("Review link copied to clipboard!");
                            setTimeout(() => setCopiedShareLink(false), 2000);
                          }}
                          className="border-white/20 text-white hover:bg-white/10 text-xs h-9 sm:h-10 shrink-0 w-full sm:w-auto">
                          {copiedShareLink ? (
                            <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 mr-1.5 text-neon-blue" />
                          )}
                          {copiedShareLink ? "Copied" : "Copy Link"}
                        </Button>

                        <Button
                          type="button"
                          onClick={() => setQrModalOpen(true)}
                          className="bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white text-xs h-9 sm:h-10 shrink-0 font-semibold shadow-lg shadow-neon-blue/20 w-full sm:w-auto">
                          <QrCode className="w-3.5 h-3.5 mr-1.5" />
                          Download QR
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
              <StatCard
                icon={Star}
                title="Average Rating"
                value={averageRating}
                change={null}
                color="from-yellow-500 to-orange-500"
              />
              <StatCard
                icon={MessageSquare}
                title="Total Reviews"
                value={totalReviews}
                change={recentGrowth}
                color="from-neon-blue to-neon-purple"
              />
              <StatCard
                icon={Reply}
                title="Response Rate"
                value={`${responseRate}%`}
                change={null}
                color="from-neon-green to-emerald-400"
              />
              <StatCard
                icon={Clock}
                title="Pending Replies"
                value={pendingReplies}
                change={null}
                color="from-neon-orange to-yellow-400"
              />
            </motion.div>

            {/* Analytics Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="glass-card border-white/10 min-w-0 overflow-hidden">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                  <CardTitle className="text-white text-base sm:text-lg">
                    Rating Trends
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                  <div className="w-full h-[220px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={ratingTrends}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="month"
                          stroke="#9CA3AF"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          domain={[3.5, 5]}
                          stroke="#9CA3AF"
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0, 0, 0, 0.85)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="rating"
                          stroke="#8b5cf6"
                          strokeWidth={3}
                          dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10 min-w-0 overflow-hidden">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                  <CardTitle className="text-white text-base sm:text-lg">
                    Rating Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                  <div className="w-full h-[220px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={ratingDistribution}
                        layout="horizontal"
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          type="number"
                          stroke="#9CA3AF"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          dataKey="stars"
                          type="category"
                          stroke="#9CA3AF"
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0, 0, 0, 0.85)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#f59e0b"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Reviews Section */}
            <Card className="glass-card border-white/10 overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <CardTitle className="text-base sm:text-xl text-white">
                    Student Reviews
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search reviews..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-full bg-white/5 border-white/10 text-white placeholder-gray-400 text-xs sm:text-sm h-9 sm:h-10"
                      />
                    </div>
                    <Select
                      value={selectedRating}
                      onValueChange={setSelectedRating}>
                      <SelectTrigger className="w-full sm:w-36 bg-white/5 border-white/10 text-white text-xs sm:text-sm h-9 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 backdrop-blur-sm border-white/10">
                        <SelectItem
                          value="all"
                          className="text-white hover:bg-white/10">
                          All Ratings
                        </SelectItem>
                        <SelectItem
                          value="5"
                          className="text-white hover:bg-white/10">
                          5 Stars
                        </SelectItem>
                        <SelectItem
                          value="4"
                          className="text-white hover:bg-white/10">
                          4 Stars
                        </SelectItem>
                        <SelectItem
                          value="3"
                          className="text-white hover:bg-white/10">
                          3 Stars
                        </SelectItem>
                        <SelectItem
                          value="2"
                          className="text-white hover:bg-white/10">
                          2 Stars
                        </SelectItem>
                        <SelectItem
                          value="1"
                          className="text-white hover:bg-white/10">
                          1 Star
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="space-y-4 sm:space-y-6">
                  <TabsList className="grid w-full grid-cols-3 bg-white/5 backdrop-blur-sm border border-white/10 h-auto p-1 rounded-xl">
                    <TabsTrigger
                      value="all"
                      className="gap-1.5 sm:gap-2 text-white data-[state=active]:bg-white/10 text-xs sm:text-sm py-2 px-1 sm:px-3">
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="truncate">
                        <span className="hidden sm:inline">All Reviews</span>
                        <span className="sm:hidden">All</span> ({reviews.length}
                        )
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="pending"
                      className="gap-1.5 sm:gap-2 text-white data-[state=active]:bg-white/10 text-xs sm:text-sm py-2 px-1 sm:px-3">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="truncate">
                        Pending ({pendingReplies})
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="responded"
                      className="gap-1.5 sm:gap-2 text-white data-[state=active]:bg-white/10 text-xs sm:text-sm py-2 px-1 sm:px-3">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="truncate">
                        <span className="hidden sm:inline">Responded</span>
                        <span className="sm:hidden">Replied</span> (
                        {reviews.length - pendingReplies})
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value={activeTab}
                    className="space-y-4 sm:space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-4 sm:space-y-6">
                      {loading ? (
                        <div className="text-center py-12 text-gray-400">
                          Loading reviews...
                        </div>
                      ) : (
                        filteredReviews.map((review) => (
                          <div
                            key={review.id}
                            className="bg-white/5 rounded-xl p-4 sm:p-6 backdrop-blur-sm border border-white/5">
                            {/* Review Header */}
                            <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                                <Avatar className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 mt-0.5">
                                  <AvatarImage
                                    src={
                                      review.student.avatar ||
                                      generateRandomAvatar()
                                    }
                                  />
                                  <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white text-xs sm:text-sm">
                                    {review.student.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <h4 className="font-semibold text-white text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
                                      {review.student.name}
                                    </h4>
                                    {review.verified && (
                                      <Badge className="text-[10px] sm:text-xs bg-green-500/20 text-green-400 border-green-500/30 px-1.5 py-0.5">
                                        <CheckCircle className="w-3 h-3 mr-1 shrink-0" />
                                        Verified
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-400 truncate max-w-[220px] sm:max-w-md">
                                    {review.course}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <div className="flex">
                                      {renderStars(review.rating)}
                                    </div>
                                    <span className="text-xs sm:text-sm text-gray-500">
                                      {review.date}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/10 h-8 w-8 p-0 shrink-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Review Content */}
                            <div className="mb-3 sm:mb-4">
                              <p className="text-xs sm:text-sm md:text-base text-gray-300 leading-relaxed break-words">
                                {review.review}
                              </p>
                            </div>

                            {/* Review Actions */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                              <div className="flex flex-wrap items-center gap-1 sm:gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleReaction(review.id, "HELPFUL")
                                  }
                                  className="gap-1.5 text-xs text-white hover:bg-white/10 h-8 px-2 sm:px-3">
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  <span>Helpful</span>
                                  <span className="text-gray-400">
                                    ({review.helpful})
                                  </span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleReaction(review.id, "LIKE")
                                  }
                                  className="gap-1.5 text-xs text-white hover:bg-white/10 h-8 px-2 sm:px-3">
                                  <Heart className="w-3.5 h-3.5" />
                                  <span>Like</span>
                                  <span className="text-gray-400">
                                    ({review.likes})
                                  </span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleReaction(review.id, "REPORT")
                                  }
                                  className="gap-1.5 text-xs text-white hover:bg-white/10 h-8 px-2 sm:px-3">
                                  <Flag className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">
                                    Report
                                  </span>
                                  <span className="text-gray-400">
                                    ({review.reports})
                                  </span>
                                </Button>
                              </div>
                              {!review.response && (
                                <Button
                                  onClick={() => setReplyingTo(review.id)}
                                  className="gap-1.5 bg-gradient-to-r from-neon-blue to-neon-purple text-xs h-8 px-3 ml-auto"
                                  size="sm">
                                  <Reply className="w-3.5 h-3.5" />
                                  Reply
                                </Button>
                              )}
                            </div>

                            {/* Existing Response */}
                            {review.response && (
                              <div className="mt-3 bg-blue-500/10 border-l-4 border-blue-400 p-3 sm:p-4 rounded-r-lg">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Avatar className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
                                    <AvatarFallback className="text-[10px] bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                                      SC
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-xs sm:text-sm text-white">
                                    Your Response
                                  </span>
                                  <span className="text-[10px] sm:text-xs text-gray-400 ml-auto">
                                    {review.response.date}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed break-words">
                                  {review.response.text}
                                </p>
                              </div>
                            )}

                            {/* Reply Form */}
                            {replyingTo === review.id && (
                              <div className="mt-3 p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                                <Textarea
                                  placeholder="Write your response..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  className="mb-3 bg-white/5 border-white/10 text-white placeholder-gray-400 text-xs sm:text-sm"
                                  rows={3}
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => handleReply(review.id)}
                                    className="gap-1.5 bg-gradient-to-r from-neon-blue to-neon-purple text-xs h-8 px-3"
                                    size="sm">
                                    <Send className="w-3.5 h-3.5" />
                                    Send Reply
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setReplyingTo(null)}
                                    size="sm"
                                    className="border-white/20 text-white hover:bg-white/10 bg-transparent text-xs h-8 px-3">
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </motion.div>

                    {!loading && filteredReviews.length === 0 && (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-400 mb-2">
                          No reviews found
                        </h3>
                        <p className="text-gray-500">
                          Try adjusting your filters or search terms.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <CertificateQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        credentialId={`tutor/${referralCode || tutorId}`}
        certificateTitle="PalmTechnIQ Tutor Review Portal"
      />
    </div>
  );
}
