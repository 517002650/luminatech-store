"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";

export function AccountNav() {
  const t = useTranslations("account");
  const pathname = usePathname();

  const links = [
    { href: "/account/orders", label: t("orders") },
    { href: "/account/wishlist", label: t("wishlist") },
  ];

  return (
    <nav className="flex flex-wrap gap-2 border-b border-stone-200 pb-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            pathname.startsWith(link.href)
              ? "bg-stone-900 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
