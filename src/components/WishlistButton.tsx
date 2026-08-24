"use client";

import { Heart } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleWishlistAction } from "@/app/actions/user";

type Props = {
  productId: string;
  initialWishlisted?: boolean;
  variant?: "icon" | "button";
};

export function WishlistButton({
  productId,
  initialWishlisted = false,
  variant = "button",
}: Props) {
  const t = useTranslations("wishlist");
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (result?.error === "login_required") {
        router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
        return;
      }
      if (result && "wishlisted" in result) {
        setWishlisted(result.wishlisted);
      }
    });
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={wishlisted ? t("remove") : t("add")}
        className="rounded-full border border-stone-200 bg-white p-2.5 text-stone-600 shadow-sm transition hover:border-amber-300 hover:text-red-500 disabled:opacity-60"
      >
        <Heart className={`h-5 w-5 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
    >
      <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
      {wishlisted ? t("remove") : t("add")}
    </button>
  );
}
