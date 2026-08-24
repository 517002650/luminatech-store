"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";

export function AccountNav() {
  const t = useTranslations("account");
  const pathname = usePathname();

  const links = [
    { href: "/account/orders", label: t("orders") },
    { href: "/account/downloads", label: t("downloads") },
    { href: "/account/wishlist", label: t("wishlist") },
  ];

  return (
    <nav className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40"
                : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
