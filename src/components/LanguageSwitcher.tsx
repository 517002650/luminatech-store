"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";

const OPTIONS: { code: Locale; labelKey: "langZh" | "langEn"; short: string }[] = [
  { code: "zh", labelKey: "langZh", short: "中文" },
  { code: "en", labelKey: "langEn", short: "EN" },
];

export function LanguageSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const current = OPTIONS.find((o) => o.code === locale) ?? OPTIONS[0];

  function switchLocale(next: Locale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
        aria-haspopup="listbox"
        aria-label={t("language")}
      >
        <Globe className="h-4 w-4 opacity-80" />
        <span className="hidden sm:inline">{current.short}</span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-zinc-500 transition group-hover:rotate-180 group-hover:text-zinc-300 sm:inline" />
      </button>

      <div
        role="listbox"
        aria-label={t("language")}
        className="invisible absolute right-0 top-full z-50 mt-2 min-w-[10rem] origin-top-right scale-95 opacity-0 transition duration-150 group-hover:visible group-hover:scale-100 group-hover:opacity-100 group-focus-within:visible group-focus-within:scale-100 group-focus-within:opacity-100"
      >
        <div className="overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900/95 p-1 shadow-xl shadow-black/50 backdrop-blur-md">
          {OPTIONS.map(({ code, labelKey }) => {
            const active = locale === code;
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => switchLocale(code)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  active
                    ? "bg-white/8 font-semibold text-white"
                    : "text-zinc-300 hover:bg-white/5 hover:text-zinc-50"
                }`}
              >
                <span>{t(labelKey)}</span>
                {active ? <Check className="h-4 w-4 shrink-0 text-cyan-400" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
