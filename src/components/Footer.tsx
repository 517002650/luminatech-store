"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} LuminaTech. {t("rights")}
        </p>
        <div className="flex flex-wrap gap-6">
          <Link href="/privacy" className="hover:text-stone-800">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="hover:text-stone-800">
            {t("terms")}
          </Link>
          <Link href="/contact" className="hover:text-stone-800">
            {t("contact")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
