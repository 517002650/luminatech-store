"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Heart, LogOut, ShoppingBag, Sparkles, User } from "lucide-react";
import { logoutUserAction } from "@/app/actions/user";
import { CartBadge } from "./CartBadge";
import { LanguageSwitcher } from "./LanguageSwitcher";

type Props = {
  user: { id: string; email: string; name: string } | null;
};

export function Header({ user }: Props) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 ring-1 ring-cyan-500/30">
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </span>
          <span className="text-zinc-100">
            Lumina<span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Tech</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
          <Link href="/products" className="transition hover:text-cyan-400">
            {t("shop")}
          </Link>
          <Link href="/about" className="transition hover:text-cyan-400">
            {t("about")}
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link
                href="/account/wishlist"
                className="hidden rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-cyan-400 sm:inline-flex"
                title={t("wishlist")}
              >
                <Heart className="h-5 w-5" />
              </Link>
              <Link
                href="/account/orders"
                className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 sm:flex"
              >
                <User className="h-4 w-4" />
                <span className="max-w-24 truncate">{user.name || user.email.split("@")[0]}</span>
              </Link>
              <form action={logoutUserAction}>
                <button
                  type="submit"
                  className="hidden rounded-full p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 sm:inline-flex"
                  title={t("logout")}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 sm:inline-flex"
            >
              {t("login")}
            </Link>
          )}
          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:from-cyan-500 hover:to-violet-500"
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
