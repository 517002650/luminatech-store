"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import {
  accountNavActiveClass,
  accountNavInactiveClass,
} from "@/lib/dark-surface-styles";

export function AccountNav() {
  const t = useTranslations("account");
  const pathname = usePathname();

  const links = [
    { href: "/account/orders", label: t("orders") },
    { href: "/account/profile", label: t("profile") },
    { href: "/account/addresses", label: t("addresses") },
    { href: "/account/downloads", label: t("downloads") },
    { href: "/account/wishlist", label: t("wishlist") },
    { href: "/account/affiliate", label: t("affiliate") },
  ];

  return (
    <nav className="flex flex-wrap gap-2 border-b border-zinc-700/80 pb-4">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active ? accountNavActiveClass : accountNavInactiveClass
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
