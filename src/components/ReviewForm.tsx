"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { submitReviewAction } from "@/app/actions/user";
import { Star } from "lucide-react";
import { useState } from "react";

type Props = {
  productId: string;
  slug: string;
  isLoggedIn: boolean;
  userReview?: { rating: number; title: string; content: string } | null;
};

export function ReviewForm({ productId, slug, isLoggedIn, userReview }: Props) {
  const t = useTranslations("reviews");
  const [rating, setRating] = useState(userReview?.rating ?? 5);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      formData.set("productId", productId);
      formData.set("slug", slug);
      formData.set("rating", String(rating));
      return (await submitReviewAction(formData)) ?? null;
    },
    null,
  );

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-600">
        {t("loginToReview")}{" "}
        <Link href={`/login?redirect=/products/${slug}`} className="text-amber-600 hover:underline">
          {t("login")}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-stone-200 bg-stone-50 p-6 space-y-4">
      <h3 className="font-semibold text-stone-900">
        {userReview ? t("editReview") : t("writeReview")}
      </h3>
      {state?.error && state.error !== "login_required" && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600">{t("submitted")}</p>
      )}
      <div>
        <label className="text-sm font-medium text-stone-700">{t("rating")}</label>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              className="p-0.5"
            >
              <Star
                className={`h-6 w-6 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700">{t("title")}</label>
        <input
          name="title"
          required
          defaultValue={userReview?.title}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700">{t("content")}</label>
        <textarea
          name="content"
          required
          rows={4}
          defaultValue={userReview?.content}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
