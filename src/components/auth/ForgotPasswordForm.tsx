"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { requestPasswordResetAction } from "@/app/actions/user";
import type { Locale } from "@/i18n/routing";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale() as Locale;
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      formData.set("locale", locale);
      return (await requestPasswordResetAction(formData)) ?? null;
    },
    null,
  );

  if (state?.success) {
    return (
      <div className="rounded-xl bg-green-50 px-4 py-4 text-sm text-green-800">
        {t("resetEmailSent")}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {t(`resetErrors.${state.error}`)}
        </div>
      )}
      <p className="text-sm text-stone-600">{t("forgotSubtitle")}</p>
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
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? t("sendingReset") : t("sendResetLink")}
      </button>
      <p className="text-center text-sm text-stone-500">
        <Link href="/login" className="text-amber-600 hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
