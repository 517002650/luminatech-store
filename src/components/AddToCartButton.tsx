"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/store/cart";

type AddToCartButtonProps = {
  productId: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  price: number;
  image: string;
};

export function AddToCartButton({
  productId,
  slug,
  nameEn,
  nameZh,
  price,
  image,
}: AddToCartButtonProps) {
  const t = useTranslations("product");
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem({ productId, slug, nameEn, nameZh, price, image });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="btn-primary w-full"
    >
      {added ? t("addedToCart") : t("addToCart")}
    </button>
  );
}
