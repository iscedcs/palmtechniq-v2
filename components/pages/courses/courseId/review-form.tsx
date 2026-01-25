"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createReview, deleteReview, getMyReview, updateReview } from "@/actions/review";
import { useRouter } from "next/navigation";

const EDIT_WINDOW_DAYS = 7;

const canEditReview = (createdAt?: Date | string | null) => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const cutoff = new Date(created);
  cutoff.setDate(cutoff.getDate() + EDIT_WINDOW_DAYS);
  return new Date() <= cutoff;
};

export default function ReviewForm({
  courseId,
  isEnrolled,
}: {
  courseId: string;
  isEnrolled: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loadingReview, setLoadingReview] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoadingReview(true);
      const result = await getMyReview(courseId);
      if (!isMounted) return;
      if (result.review) {
        setReviewId(result.review.id);
        setRating(result.review.rating);
        setComment(result.review.comment || "");
        setCreatedAt(result.review.createdAt?.toString() ?? null);
      }
      setLoadingReview(false);
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const editAllowed = useMemo(() => canEditReview(createdAt), [createdAt]);

  const handleSubmit = () => {
    if (!isEnrolled) {
      toast.error("Only enrolled students can leave a review.");
      return;
    }
    if (rating < 1) {
      toast.error("Please select a rating.");
      return;
    }
    if (comment.trim().length < 3) {
      toast.error("Please add a short comment.");
      return;
    }

    startTransition(async () => {
      const payload = { courseId, rating, comment: comment.trim() };
      const result = reviewId
        ? await updateReview({ reviewId, rating, comment: comment.trim() })
        : await createReview(payload);

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(reviewId ? "Review updated" : "Review submitted");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!reviewId) return;
    startTransition(async () => {
      const result = await deleteReview(reviewId);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Review deleted");
      setReviewId(null);
      setRating(0);
      setComment("");
      setCreatedAt(null);
      router.refresh();
    });
  };

  if (!isEnrolled) {
    return (
      <Card className="glass-card border-white/10">
        <CardContent className="p-5 text-sm text-gray-300">
          Enroll to leave a review.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-white/10">
      <CardContent className="p-5 space-y-4">
        <div>
          <h4 className="text-white font-semibold">Your review</h4>
          {reviewId && !editAllowed ? (
            <p className="text-xs text-gray-400">
              You can no longer edit this review.
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            const filled = value <= rating;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                disabled={loadingReview || (reviewId ? !editAllowed : false)}
                className="disabled:opacity-50">
                <Star
                  className={`w-5 h-5 ${filled ? "text-yellow-400 fill-current" : "text-gray-600"}`}
                />
              </button>
            );
          })}
        </div>

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about the course..."
          disabled={loadingReview || (reviewId ? !editAllowed : false)}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isPending || loadingReview || (reviewId ? !editAllowed : false)}
            className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
            {reviewId ? "Update review" : "Submit review"}
          </Button>
          {reviewId ? (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isPending || loadingReview || !editAllowed}
              className="border-white/20 text-white hover:bg-white/10">
              Delete
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
