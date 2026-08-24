"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-bold text-zinc-100">
              Lumina<span className="text-cyan-400">Tech</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-zinc-500">{t("tagline")}</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="transition hover:text-cyan-400">
              {t("privacy")}
            </Link>
            <Link href="/terms" className="transition hover:text-zinc-300">
              {t("terms")}
            </Link>
            <Link href="/contact" className="transition hover:text-zinc-300">
              {t("contact")}
            </Link>
          </div>
        </div>
        <p className="mt-8 border-t border-zinc-800 pt-8 text-sm text-zinc-600">
          © {new Date().getFullYear()} LuminaTech. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
