"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { registerUserAction } from "@/app/actions/user";

type Props = { redirect?: string };

export function RegisterForm({ redirect = "/account/orders" }: Props) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      formData.set("redirect", redirect);
      return (await registerUserAction(formData)) ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      <div>
        <label className="text-sm font-medium text-stone-700">{t("name")}</label>
        <input
          name="name"
          type="text"
          autoComplete="name"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
        />
      </div>
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
          minLength={6}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? t("registering") : t("submitRegister")}
      </button>
      <p className="text-center text-sm text-stone-500">
        {t("hasAccount")}{" "}
        <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-amber-600 hover:underline">
          {t("login")}
        </Link>
      </p>
    </form>
  );
}
