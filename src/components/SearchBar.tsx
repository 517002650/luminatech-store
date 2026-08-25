"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { buildProductsHref, normalizeSearchQuery } from "@/lib/product-search";

type Variant = "header" | "hero";

type Props = {
  variant?: Variant;
  defaultValue?: string;
  autoFocus?: boolean;
  onClose?: () => void;
};

const POPULAR_KEYS = ["laser", "console", "movingHead", "fog"] as const;

export function SearchBar({
  variant = "hero",
  defaultValue = "",
  autoFocus = false,
  onClose,
}: Props) {
  const t = useTranslations("search");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function submit(next?: string) {
    const q = normalizeSearchQuery(next ?? value);
    if (!q) return;
    router.push(buildProductsHref(null, q));
    onClose?.();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit();
  }

  if (variant === "header") {
    return (
      <form onSubmit={handleSubmit} className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={tNav("searchPlaceholder")}
          aria-label={tNav("search")}
          className="h-9 w-full rounded-lg border border-white/10 bg-zinc-900/80 pl-9 pr-8 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 transition focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/15"
        />
        {value ? (
          <button
            type="button"
            onClick={() => setValue("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-500 hover:text-zinc-300"
            aria-label={t("clear")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </form>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-500/40 via-violet-500/30 to-cyan-500/40 opacity-80 blur-sm" />
        <div className="relative flex overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl shadow-cyan-500/5 backdrop-blur-sm">
          <div className="flex flex-1 items-center gap-3 px-4 sm:px-5">
            <Search className="h-5 w-5 shrink-0 text-cyan-400" />
            <input
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("placeholder")}
              aria-label={tNav("search")}
              className="min-w-0 flex-1 bg-transparent py-4 text-base text-zinc-100 outline-none placeholder:text-zinc-500 sm:py-5 sm:text-lg"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 bg-gradient-to-r from-cyan-600 to-violet-600 px-6 text-sm font-semibold text-white transition hover:from-cyan-500 hover:to-violet-500 sm:px-8 sm:text-base"
          >
            {t("submit")}
          </button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
          {t("popular")}
        </span>
        {POPULAR_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              const label = t(`suggestions.${key}`);
              setValue(label);
              submit(label);
            }}
            className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-sm text-zinc-400 transition hover:border-cyan-500/30 hover:bg-zinc-800 hover:text-cyan-300"
          >
            {t(`suggestions.${key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
