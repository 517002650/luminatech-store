"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { loginUserAction } from "@/app/actions/user";

type Props = { redirect?: string };

export function LoginForm({ redirect = "/account/orders" }: Props) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      formData.set("redirect", redirect);
      return (await loginUserAction(formData)) ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      <div>
        <label className="text-sm font-medium text-stone-700">{t("email")}</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700">{t("password")}</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? t("loggingIn") : t("submitLogin")}
      </button>
      <p className="text-right text-sm">
        <Link href="/forgot-password" className="text-amber-600 hover:underline">
          {t("forgotPassword")}
        </Link>
      </p>
      <p className="text-center text-sm text-stone-500">
        {t("noAccount")}{" "}
        <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-amber-600 hover:underline">
          {t("register")}
        </Link>
      </p>
    </form>
  );
}
