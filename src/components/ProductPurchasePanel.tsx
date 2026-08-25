"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";
import type { VariantPublic } from "@/lib/product-variants";
import type { Locale } from "@/i18n/routing";
import { AddToCartButton } from "@/components/AddToCartButton";
import { WishlistButton } from "@/components/WishlistButton";

type Props = {
  productId: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  image: string;
  variants: VariantPublic[];
  initialWishlisted: boolean;
};

function variantLabel(v: VariantPublic, locale: Locale) {
  if (locale === "zh") return v.nameZh || v.nameEn || v.sku;
  return v.nameEn || v.nameZh || v.sku;
}

export function ProductPurchasePanel({
  productId,
  slug,
  nameEn,
  nameZh,
  image,
  variants,
  initialWishlisted,
}: Props) {
  const t = useTranslations("product");
  const locale = useLocale() as Locale;

  const sellable = useMemo(
    () => variants.filter((v) => v.active),
    [variants],
  );

  const initial =
    sellable.find((v) => v.isDefault && v.stock > 0) ??
    sellable.find((v) => v.stock > 0) ??
    sellable.find((v) => v.isDefault) ??
    sellable[0] ??
    null;

  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const selected =
    sellable.find((v) => v.id === selectedId) ?? initial ?? null;

  const showPicker = sellable.length > 1;
  const hasNamedOptions = sellable.some(
    (v) => v.nameEn.trim() || v.nameZh.trim(),
  );

  if (!selected) {
    return (
      <div className="mt-8 max-w-sm space-y-3">
        <button
          type="button"
          disabled
          className="w-full rounded-xl bg-zinc-800 px-6 py-3 text-sm font-semibold text-zinc-500"
        >
          {t("outOfStock")}
        </button>
        <WishlistButton
          productId={productId}
          initialWishlisted={initialWishlisted}
        />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <p className="text-3xl font-bold text-zinc-50">
          {formatPrice(selected.price)}
        </p>
        {typeof selected.compareAtPrice === "number" &&
        selected.compareAtPrice > selected.price ? (
          <p className="text-lg text-zinc-500 line-through">
            {formatPrice(selected.compareAtPrice)}
          </p>
        ) : null}
      </div>

      {showPicker ? (
        <div>
          <p className="text-sm font-medium text-zinc-300">{t("selectOption")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sellable.map((v) => {
              const label = variantLabel(v, locale);
              const disabled = v.stock <= 0;
              const active = v.id === selected.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedId(v.id)}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    active
                      ? "border-cyan-400 bg-cyan-500/15 text-cyan-100"
                      : "border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-500"
                  } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {label}
                  {!hasNamedOptions ? null : (
                    <span className="ml-2 text-xs text-zinc-500">
                      {formatPrice(v.price)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm">
        <div>
          <dt className="text-zinc-500">{t("sku")}</dt>
          <dd className="font-medium text-zinc-100">{selected.sku}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">{t("stockLabel")}</dt>
          <dd className="font-medium text-zinc-100">
            {selected.stock > 0
              ? t("inStock", { count: selected.stock })
              : t("outOfStock")}
          </dd>
        </div>
      </dl>

      <div className="max-w-sm space-y-3">
        {selected.stock > 0 ? (
          <AddToCartButton
            productId={productId}
            variantId={selected.id}
            variantSku={selected.sku}
            variantNameEn={selected.nameEn}
            variantNameZh={selected.nameZh}
            slug={slug}
            nameEn={nameEn}
            nameZh={nameZh}
            price={selected.price}
            image={image}
          />
        ) : (
          <button
            type="button"
            disabled
            className="w-full rounded-xl bg-zinc-800 px-6 py-3 text-sm font-semibold text-zinc-500"
          >
            {t("outOfStock")}
          </button>
        )}
        <WishlistButton
          productId={productId}
          initialWishlisted={initialWishlisted}
        />
      </div>
    </div>
  );
}
