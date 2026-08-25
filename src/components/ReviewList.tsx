import { Star } from "lucide-react";
import { lightReviewCardClass } from "@/lib/form-styles";
import { ProductRating } from "@/components/ProductRating";

type ReviewItem = {
  id: string;
  rating: number;
  title: string;
  content: string;
  createdAt: Date;
  authorName: string;
  verifiedPurchase?: boolean;
};

type Props = {
  reviews: ReviewItem[];
  avg: number;
  count: number;
  verifiedLabel?: string;
};

export function ReviewList({ reviews, avg, count, verifiedLabel }: Props) {
  if (count === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <ProductRating avg={avg} count={count} size="md" />
      </div>
      <div className="space-y-4">
        {reviews.map((review) => (
          <article
            key={review.id}
            className={lightReviewCardClass}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
                    />
                  ))}
                </div>
                <span className="font-medium">{review.authorName}</span>
                {review.verifiedPurchase && verifiedLabel ? (
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-700 ring-1 ring-cyan-500/20">
                    {verifiedLabel}
                  </span>
                ) : null}
              </div>
              <time className="text-xs text-stone-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </time>
            </div>
            <h4 className="mt-2 font-semibold">{review.title}</h4>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{review.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
