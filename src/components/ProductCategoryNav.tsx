"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { ProductCategory } from "@/lib/categories";

type Props = {
  active?: string | null;
  counts?: Record<string, number>;
  categories: ProductCategory[];
  locale: "en" | "zh";
};

export function ProductCategoryNav({
  active = null,
  counts,
  categories,
  locale,
}: Props) {
  const t = useTranslations("products");

  const items: { key: string | null; label: string }[] = [
    { key: null, label: t("allCategories") },
    ...categories.map((c) => ({
      key: c.key,
      label: locale === "zh" ? c.zh : c.en,
    })),
  ];

  return (
    <div className="sticky top-16 z-40 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md">
      <nav
        className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6"
        aria-label="Product categories"
      >
        {items.map(({ key, label }) => {
          const href = key ? `/products?category=${key}` : "/products";
          const isActive = active === key || (!active && key === null);
          const count = key ? (counts?.[key] ?? 0) : undefined;

          return (
            <Link
              key={key ?? "all"}
              href={href}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-lg shadow-cyan-500/15"
                  : "border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"
              }`}
            >
              {label}
              {count != null ? (
                <span className={isActive ? "ml-1.5 opacity-80" : "ml-1.5 text-zinc-600"}>
                  ({count})
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
