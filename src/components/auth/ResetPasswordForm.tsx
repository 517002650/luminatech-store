"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { resetPasswordAction } from "@/app/actions/user";
import type { Locale } from "@/i18n/routing";
import { lightInputClass } from "@/lib/form-styles";

type Props = { token: string };

export function ResetPasswordForm({ token }: Props) {
  const t = useTranslations("auth");
  const locale = useLocale() as Locale;
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      formData.set("token", token);
      formData.set("locale", locale);
      return (await resetPasswordAction(formData)) ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {t(`resetErrors.${state.error}`)}
        </div>
      )}
      <div>
        <label className="text-sm font-medium text-stone-700">{t("newPassword")}</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className={lightInputClass}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? t("resettingPassword") : t("resetPassword")}
      </button>
      <p className="text-center text-sm text-stone-500">
        <Link href="/login" className="text-amber-600 hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
