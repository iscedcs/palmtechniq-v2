"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, ThumbsUp, Heart, Flag } from "lucide-react";
import { getAverageRating, getRatingCount } from "@/lib/reviews";
import ReviewForm from "./review-form";
import { Button } from "@/components/ui/button";
import { toggleReviewReaction } from "@/actions/review";
import { toast } from "sonner";
import { useEffect, useState } from "react";

type ReviewReactionType = "HELPFUL" | "LIKE" | "REPORT";

export default function ReviewsTab({
  reviews,
  courseId,
  isEnrolled,
}: {
  reviews: any[];
  courseId: string;
  isEnrolled: boolean;
}) {
  const [items, setItems] = useState(reviews);

  useEffect(() => {
    setItems(reviews);
  }, [reviews]);

  const averageRating = getAverageRating(items);
  const ratingCount = getRatingCount(items);

  const handleReaction = async (reviewId: string, type: ReviewReactionType) => {
    const result = await toggleReviewReaction(reviewId, type);
    if ("error" in result) {
      if (result.error === "Unauthorized") {
        toast.error("Please sign in to react to reviews.");
      } else {
        toast.error(result.error);
      }
      return;
    }

    setItems((prev: any[]) =>
      prev.map((review) => {
        if (review.id !== reviewId) return review;
        const delta = result.added ? 1 : -1;
        const next = review.reactions ? [...review.reactions] : [];
        if (result.added) {
          next.push({ type });
        } else {
          const idx = next.findIndex((r: any) => r.type === type);
          if (idx >= 0) next.splice(idx, 1);
        }
        return {
          ...review,
          reactions: next,
          _reactionCounts: {
            helpful: Math.max(0, (review._reactionCounts?.helpful ?? 0) + (type === "HELPFUL" ? delta : 0)),
            like: Math.max(0, (review._reactionCounts?.like ?? 0) + (type === "LIKE" ? delta : 0)),
            report: Math.max(0, (review._reactionCounts?.report ?? 0) + (type === "REPORT" ? delta : 0)),
          },
        };
      })
    );

    toast.success(result.added ? "Updated" : "Removed");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 space-y-6">
      <Card className="glass-card border-white/10">
        <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Student Reviews</h3>
            <p className="text-gray-400 text-sm">
              {ratingCount} review{ratingCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-yellow-400">
            <Star className="w-5 h-5 fill-current" />
            <span className="text-white font-semibold">
              {averageRating.toFixed(1)}
            </span>
          </div>
        </CardContent>
      </Card>

      <ReviewForm courseId={courseId} isEnrolled={isEnrolled} />

      {items.length === 0 ? (
        <Card className="glass-card border-white/10">
          <CardContent className="p-8 text-center">
            <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Student Reviews
            </h3>
            <p className="text-gray-300">
              No reviews yet. Be the first to review!
            </p>
          </CardContent>
        </Card>
      ) : (
        items.map((review: any, index: number) => {
          const helpfulCount =
            review._reactionCounts?.helpful ??
            (review.reactions?.filter((r: any) => r.type === "HELPFUL").length ||
              0);
          const likeCount =
            review._reactionCounts?.like ??
            (review.reactions?.filter((r: any) => r.type === "LIKE").length ||
              0);
          const reportCount =
            review._reactionCounts?.report ??
            (review.reactions?.filter((r: any) => r.type === "REPORT").length ||
              0);

          return (
          <Card
            key={index}
            id={`review-${review.id}`}
            className="glass-card border-white/10">
            <CardContent className="p-6 flex items-start space-x-4">
              {/* Avatar */}
              <Avatar className="w-12 h-12">
                <AvatarImage
                  src={
                    review.user?.avatar ||
                    review.user?.image ||
                    "/placeholder.svg"
                  }
                />
                <AvatarFallback>
                  {review.user?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>

              {/* Review Details */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-semibold">
                    {review.user?.name || "Anonymous"}
                  </h4>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Stars */}
                <div className="flex items-center mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "text-yellow-400 fill-current"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-gray-300">{review.comment}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction(review.id, "HELPFUL")}
                    className="gap-2 text-white hover:bg-white/10">
                    <ThumbsUp className="w-4 h-4" />
                    Helpful ({helpfulCount})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction(review.id, "LIKE")}
                    className="gap-2 text-white hover:bg-white/10">
                    <Heart className="w-4 h-4" />
                    Like ({likeCount})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction(review.id, "REPORT")}
                    className="gap-2 text-white hover:bg-white/10">
                    <Flag className="w-4 h-4" />
                    Report ({reportCount})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
        })
      )}
    </motion.div>
  );
}
