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
} from "lucide-react";
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

      const mappedReviews = result.reviews.map((review) => {
        const name = review.user?.name || "Student";
        const initials = name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
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
          course: review.course?.title || "Course",
          rating: review.rating,
          createdAt: new Date(review.createdAt),
          date: new Date(review.createdAt).toLocaleDateString(),
          review: review.comment || "",
          helpful: review.reactions.filter((r) => r.type === "HELPFUL").length,
          likes: review.reactions.filter((r) => r.type === "LIKE").length,
          reports: review.reactions.filter((r) => r.type === "REPORT").length,
          response: review.responseText
            ? {
                text: review.responseText,
                date: review.respondedAt
                  ? new Date(review.respondedAt).toLocaleDateString()
                  : "Just now",
              }
            : null,
          verified: true,
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
          : review
      )
    );
    setPendingReplies(newPending);
    setResponseRate(
      totalReviews > 0
        ? Math.round(((totalReviews - newPending) / totalReviews) * 100)
        : 0
    );
    setReplyingTo(null);
    setReplyText("");
    toast.success("Response sent");
  };

  const handleReaction = async (
    reviewId: string,
    type: "HELPFUL" | "LIKE" | "REPORT"
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
      })
    );

    toast.success(result.added ? "Updated" : "Removed");
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-500"
        }`}
      />
    ));
  };

  const StatCard = ({ icon: Icon, title, value, change, color }: any) => (
    <motion.div whileHover={{ scale: 1.05, rotateY: 5 }} className="group">
      <Card className="glass-card hover-glow border-white/10 overflow-hidden relative">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">{title}</p>
              <p className="text-3xl font-bold text-white mt-2">{value}</p>
              {change && (
                <div
                  className={`flex items-center mt-2 text-sm ${
                    change > 0 ? "text-green-400" : "text-red-400"
                  }`}>
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {change > 0 ? "+" : ""}
                  {change}% this month
                </div>
              )}
            </div>
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${color} p-4 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-full h-full text-white" />
            </div>
          </div>
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}
          />
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-12 relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-20" />
          <motion.div
            className="absolute top-20 right-20 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"
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

          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Reviews & <span className="text-gradient">Feedback</span>
                </h1>
                <p className="text-xl text-gray-300">
                  Manage student reviews and build your reputation
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setFiltersOpen(true)}
                  className="gap-2 border-white/20 text-white hover:bg-white/10 bg-transparent">
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                </Button>
                <Button
                  onClick={() => setInsightsOpen(true)}
                  className="gap-2 bg-gradient-to-r from-neon-purple to-pink-400 text-white">
                  <Award className="w-4 h-4" />
                  Review Insights
                </Button>
              </div>
            </motion.div>
            <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
              <DialogContent className="bg-black/95 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Advanced Filters</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Refine reviews by date and rating.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">From</label>
                      <Input
                        type="date"
                        value={filterFrom}
                        onChange={(e) => setFilterFrom(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">To</label>
                      <Input
                        type="date"
                        value={filterTo}
                        onChange={(e) => setFilterTo(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">
                        Minimum rating
                      </label>
                      <Select value={minRating} onValueChange={setMinRating}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
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
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Sort by</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10">
                          <SelectItem value="newest">Newest</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                          <SelectItem value="highest">Highest rating</SelectItem>
                          <SelectItem value="lowest">Lowest rating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={insightsOpen} onOpenChange={setInsightsOpen}>
              <DialogContent className="bg-black/95 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Review Insights</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Snapshot of your review performance.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 text-sm text-gray-300">
                  <div className="flex items-center justify-between">
                    <span>Average rating</span>
                    <span className="text-white font-semibold">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total reviews</span>
                    <span className="text-white font-semibold">
                      {totalReviews}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Response rate</span>
                    <span className="text-white font-semibold">
                      {responseRate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pending replies</span>
                    <span className="text-white font-semibold">
                      {pendingReplies}
                    </span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Rating Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={ratingTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis domain={[3.5, 5]} stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rating"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Rating Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ratingDistribution} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" />
                      <YAxis dataKey="stars" type="category" stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Reviews Section */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Student Reviews</CardTitle>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search reviews..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64 bg-white/5 border-white/10 text-white placeholder-gray-400"
                      />
                    </div>
                    <Select
                      value={selectedRating}
                      onValueChange={setSelectedRating}>
                      <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
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
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3 bg-white/5 backdrop-blur-sm border border-white/10">
                    <TabsTrigger
                      value="all"
                      className="gap-2 text-white data-[state=active]:bg-white/10">
                      <MessageSquare className="w-4 h-4" />
                      All Reviews ({reviews.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="pending"
                      className="gap-2 text-white data-[state=active]:bg-white/10">
                      <Clock className="w-4 h-4" />
                      Pending ({pendingReplies})
                    </TabsTrigger>
                    <TabsTrigger
                      value="responded"
                      className="gap-2 text-white data-[state=active]:bg-white/10">
                      <CheckCircle className="w-4 h-4" />
                      Responded ({reviews.length - pendingReplies})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6">
                      {loading ? (
                        <div className="text-center py-12 text-gray-400">
                          Loading reviews...
                        </div>
                      ) : (
                        filteredReviews.map((review) => (
                        <div
                          key={review.id}
                          className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                          {/* Review Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarImage
                                  src={
                                    review.student.avatar ||
                                    generateRandomAvatar()
                                  }
                                />
                                <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                                  {review.student.initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-white">
                                    {review.student.name}
                                  </h4>
                                  {review.verified && (
                                    <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400">
                                  {review.course}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex">
                                    {renderStars(review.rating)}
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {review.date}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/10">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Review Content */}
                          <div className="mb-4">
                            <p className="text-gray-300 leading-relaxed">
                              {review.review}
                            </p>
                          </div>

                          {/* Review Actions */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <Button
                                variant="ghost"
                                size="sm"
                              onClick={() =>
                                handleReaction(review.id, "HELPFUL")
                              }
                                className="gap-2 text-white hover:bg-white/10">
                                <ThumbsUp className="w-4 h-4" />
                                Helpful ({review.helpful})
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                              onClick={() => handleReaction(review.id, "LIKE")}
                                className="gap-2 text-white hover:bg-white/10">
                                <Heart className="w-4 h-4" />
                              Like ({review.likes})
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                              onClick={() =>
                                handleReaction(review.id, "REPORT")
                              }
                                className="gap-2 text-white hover:bg-white/10">
                                <Flag className="w-4 h-4" />
                              Report ({review.reports})
                              </Button>
                            </div>
                            {!review.response && (
                              <Button
                                onClick={() => setReplyingTo(review.id)}
                                className="gap-2 bg-gradient-to-r from-neon-blue to-neon-purple"
                                size="sm">
                                <Reply className="w-4 h-4" />
                                Reply
                              </Button>
                            )}
                          </div>

                          {/* Existing Response */}
                          {review.response && (
                            <div className="bg-blue-500/10 border-l-4 border-blue-400 p-4 rounded-r-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                                    SC
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm text-white">
                                  Your Response
                                </span>
                                <span className="text-xs text-gray-400">
                                  {review.response.date}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300">
                                {review.response.text}
                              </p>
                            </div>
                          )}

                          {/* Reply Form */}
                          {replyingTo === review.id && (
                            <div className="mt-4 p-4 bg-white/5 rounded-lg">
                              <Textarea
                                placeholder="Write your response..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="mb-3 bg-white/5 border-white/10 text-white placeholder-gray-400"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleReply(review.id)}
                                  className="gap-2 bg-gradient-to-r from-neon-blue to-neon-purple"
                                  size="sm">
                                  <Send className="w-4 h-4" />
                                  Send Reply
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setReplyingTo(null)}
                                  size="sm"
                                  className="border-white/20 text-white hover:bg-white/10 bg-transparent">
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
    </div>
  );
}
