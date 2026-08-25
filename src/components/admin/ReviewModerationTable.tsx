"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setReviewApprovedAction } from "@/app/admin/actions";

type ReviewRow = {
  id: string;
  rating: number;
  title: string;
  content: string;
  approved: boolean;
  verifiedPurchase: boolean;
  createdAt: Date | string;
  productName: string;
  productSlug: string;
  author: string;
};

type Props = {
  reviews: ReviewRow[];
};

export function ReviewModerationTable({ reviews }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setApproved(id: string, approved: boolean) {
    startTransition(async () => {
      await setReviewApprovedAction(id, approved);
      router.refresh();
    });
  }

  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
        暂无评价
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-stone-500">
                {review.productName} · {review.author} · ★ {review.rating}
                {review.verifiedPurchase ? " · 已购验证" : ""}
              </p>
              <h3 className="mt-1 font-semibold text-stone-900">{review.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{review.content}</p>
              <p className="mt-2 text-xs text-stone-400">
                {new Date(review.createdAt).toLocaleString("zh-CN")} ·{" "}
                {review.approved ? (
                  <span className="text-green-700">已通过</span>
                ) : (
                  <span className="text-amber-700">待审核</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {!review.approved ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setApproved(review.id, true)}
                  className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
                >
                  通过
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setApproved(review.id, false)}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                >
                  下架
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
