"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Heart, LogOut, ShoppingBag, Sparkles, User } from "lucide-react";
import { logoutUserAction } from "@/app/actions/user";
import { CartBadge } from "./CartBadge";
import { HeaderSearch } from "./HeaderSearch";
import { LanguageSwitcher } from "./LanguageSwitcher";

type Props = {
  user: { id: string; email: string; name: string } | null;
};

const iconBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/5 hover:text-white";

export function Header({ user }: Props) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const displayName = user
    ? user.name?.trim() || user.email.split("@")[0]
    : "";

  const navLinks = [
    { href: "/products", label: t("shop") },
    { href: "/about", label: t("about") },
    { href: "/account/affiliate", label: t("affiliate"), highlight: true },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/75 backdrop-blur-xl">
      <div className="relative mx-auto flex h-[3.75rem] max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="LuminaTech"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/25 to-violet-500/20 ring-1 ring-white/10 transition group-hover:ring-cyan-400/40">
            <Sparkles className="h-4 w-4 text-cyan-300" />
          </span>
          <span className="hidden text-[1.05rem] font-semibold tracking-tight text-zinc-50 sm:inline">
            Lumina
            <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
              Tech
            </span>
          </span>
        </Link>

        {/* Primary nav — centered cluster after brand */}
        <nav className="ml-1 hidden items-center gap-0.5 sm:flex">
          {navLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            const highlight = "highlight" in link && link.highlight;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  highlight
                    ? active
                      ? "bg-gradient-to-r from-cyan-500/30 to-violet-500/30 text-cyan-100 ring-1 ring-cyan-400/40"
                      : "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-200 ring-1 ring-cyan-400/30 hover:from-cyan-500/30 hover:to-violet-500/30"
                    : active
                      ? "bg-white/5 text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <HeaderSearch />

        {/* Tools — one visual system */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <LanguageSwitcher />

          {user ? (
            <>
              <Link
                href="/account/wishlist"
                className={`${iconBtn} hidden sm:inline-flex`}
                title={t("wishlist")}
                aria-label={t("wishlist")}
              >
                <Heart className="h-[1.15rem] w-[1.15rem]" />
              </Link>

              <Link
                href="/account/orders"
                className="ml-0.5 inline-flex max-w-[9.5rem] items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 text-sm text-zinc-200 transition hover:bg-white/5 hover:text-white"
                title={`${displayName} · ${t("account")}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-200 ring-1 ring-white/10">
                  <User className="h-3.5 w-3.5" />
                </span>
                <span className="hidden min-w-0 truncate font-medium lg:inline">
                  {displayName}
                </span>
              </Link>

              <form action={logoutUserAction} className="hidden sm:block">
                <button
                  type="submit"
                  className={iconBtn}
                  title={t("logout")}
                  aria-label={t("logout")}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="ml-0.5 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-zinc-200 transition hover:bg-white/5 hover:text-white"
            >
              <User className="h-4 w-4 text-zinc-400" />
              <span className="hidden sm:inline">{t("login")}</span>
            </Link>
          )}

          <Link
            href="/cart"
            className="relative ml-1.5 inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-100 px-3 text-sm font-semibold text-zinc-950 transition hover:bg-white sm:px-3.5"
            aria-label={t("cart")}
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
