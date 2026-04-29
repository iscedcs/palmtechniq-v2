export type RatingSource = {
  rating?: number | null;
};

export const getRatingCount = (reviews: RatingSource[] = []) =>
  reviews.filter((review) => typeof review.rating === "number").length;

export const getAverageRating = (reviews: RatingSource[] = []) => {
  const valid = reviews.filter((review) => typeof review.rating === "number");
  if (valid.length === 0) return 0;
  const total = valid.reduce((sum, review) => sum + (review.rating ?? 0), 0);
  return total / valid.length;
};
