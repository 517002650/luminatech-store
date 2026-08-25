"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { submitReviewAction } from "@/app/actions/user";
import { Star } from "lucide-react";
import { lightInputClass, lightPanelClass, lightPanelDashedClass } from "@/lib/form-styles";

type Props = {
  productId: string;
  slug: string;
  isLoggedIn: boolean;
  hasPurchased: boolean;
  userReview?: {
    rating: number;
    title: string;
    content: string;
    approved?: boolean;
  } | null;
};

export function ReviewForm({
  productId,
  slug,
  isLoggedIn,
  hasPurchased,
  userReview,
}: Props) {
  const t = useTranslations("reviews");
  const [rating, setRating] = useState(userReview?.rating ?? 5);

  const [state, formAction, pending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean; pending?: boolean } | null,
      formData: FormData,
    ): Promise<{ error?: string; success?: boolean; pending?: boolean } | null> => {
      formData.set("productId", productId);
      formData.set("slug", slug);
      formData.set("rating", String(rating));
      return (await submitReviewAction(formData)) ?? null;
    },
    null as { error?: string; success?: boolean; pending?: boolean } | null,
  );

  if (!isLoggedIn) {
    return (
      <div className={`${lightPanelDashedClass} text-center text-sm text-stone-600`}>
        {t("loginToReview")}{" "}
        <Link href={`/login?redirect=/products/${slug}`} className="text-amber-600 hover:underline">
          {t("login")}
        </Link>
      </div>
    );
  }

  if (!hasPurchased) {
    return (
      <div className={`${lightPanelDashedClass} text-center text-sm text-stone-600`}>
        {t("purchaseRequired")}
      </div>
    );
  }

  return (
    <form action={formAction} className={`${lightPanelClass} space-y-4`}>
      <h3 className="font-semibold">
        {userReview ? t("editReview") : t("writeReview")}
      </h3>
      <p className="text-xs text-stone-500">{t("verifiedHint")}</p>
      {state?.error && state.error !== "login_required" && (
        <p className="text-sm text-red-600">
          {state.error === "purchase_required" ||
          state.error === "incomplete"
            ? t(`errors.${state.error}`)
            : state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600">{t("submittedPending")}</p>
      )}
      {userReview && userReview.approved === false && !state?.success ? (
        <p className="text-sm text-amber-700">{t("awaitingModeration")}</p>
      ) : null}
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
          className={lightInputClass}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700">{t("content")}</label>
        <textarea
          name="content"
          required
          rows={4}
          defaultValue={userReview?.content}
          className={lightInputClass}
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
