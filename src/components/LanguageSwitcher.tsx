"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";

const labels: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(next: Locale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs font-medium">
      {(["en", "zh"] as Locale[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchLocale(code)}
          className={`rounded-md px-2.5 py-1 transition ${
            locale === code
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          {labels[code]}
        </button>
      ))}
    </div>
  );
}
