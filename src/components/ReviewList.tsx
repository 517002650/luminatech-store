import { Star } from "lucide-react";
import { ProductRating } from "@/components/ProductRating";

type ReviewItem = {
  id: string;
  rating: number;
  title: string;
  content: string;
  createdAt: Date;
  authorName: string;
};

type Props = {
  reviews: ReviewItem[];
  avg: number;
  count: number;
};

export function ReviewList({ reviews, avg, count }: Props) {
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
            className="rounded-xl border border-stone-200 bg-white p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
                    />
                  ))}
                </div>
                <span className="font-medium text-stone-900">{review.authorName}</span>
              </div>
              <time className="text-xs text-stone-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </time>
            </div>
            <h4 className="mt-2 font-semibold text-stone-800">{review.title}</h4>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{review.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
