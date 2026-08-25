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
  const displayName = user
    ? user.name?.trim() || user.email.split("@")[0]
    : "";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-2 text-xl font-bold tracking-tight">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 ring-1 ring-cyan-500/30">
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </span>
          <span className="truncate text-zinc-100">
            Lumina
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Tech
            </span>
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <LanguageSwitcher />

          {user ? (
            <>
              <Link
                href="/account/wishlist"
                className="hidden rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-cyan-400 sm:inline-flex"
                title={t("wishlist")}
              >
                <Heart className="h-5 w-5" />
              </Link>

              <Link
                href="/account/orders"
                className="inline-flex max-w-[11rem] items-center gap-2 rounded-full bg-cyan-500/10 py-1.5 pl-1.5 pr-3 text-sm font-semibold text-cyan-200 ring-1 ring-cyan-500/40 transition hover:bg-cyan-500/20 hover:text-cyan-50 hover:ring-cyan-400/60 sm:max-w-[14rem]"
                title={t("account")}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-sm shadow-cyan-900/40">
                  <User className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate leading-tight">{displayName}</span>
                  <span className="hidden text-[10px] font-medium leading-tight text-cyan-400/80 sm:block">
                    {t("account")}
                  </span>
                </span>
              </Link>

              <form action={logoutUserAction}>
                <button
                  type="submit"
                  className="hidden rounded-full p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 sm:inline-flex"
                  title={t("logout")}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-100 ring-1 ring-zinc-600 transition hover:bg-zinc-800 hover:ring-cyan-500/50 hover:text-cyan-200"
            >
              <User className="h-4 w-4 text-cyan-400" />
              {t("login")}
            </Link>
          )}

          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:from-cyan-500 hover:to-violet-500 sm:px-4"
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
