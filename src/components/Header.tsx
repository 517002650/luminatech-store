"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Heart, LogOut, ShoppingBag, User } from "lucide-react";
import { logoutUserAction } from "@/app/actions/user";
import { CartBadge } from "./CartBadge";
import { LanguageSwitcher } from "./LanguageSwitcher";

type Props = {
  user: { id: string; email: string; name: string } | null;
};

export function Header({ user }: Props) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-stone-900">
          Lumina<span className="text-amber-600">Tech</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-stone-600 md:flex">
          <Link href="/products" className="transition hover:text-stone-900">
            {t("shop")}
          </Link>
          <Link href="/about" className="transition hover:text-stone-900">
            {t("about")}
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link
                href="/account/wishlist"
                className="hidden rounded-full p-2 text-stone-600 hover:bg-stone-100 sm:inline-flex"
                title={t("wishlist")}
              >
                <Heart className="h-5 w-5" />
              </Link>
              <Link
                href="/account/orders"
                className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 sm:flex"
              >
                <User className="h-4 w-4" />
                <span className="max-w-24 truncate">{user.name || user.email.split("@")[0]}</span>
              </Link>
              <form action={logoutUserAction}>
                <button
                  type="submit"
                  className="hidden rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800 sm:inline-flex"
                  title={t("logout")}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 sm:inline-flex"
            >
              {t("login")}
            </Link>
          )}
          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">{t("cart")}</span>
            <CartBadge />
          </Link>
        </div>
      </div>
    </header>
  );
}
