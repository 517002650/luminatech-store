"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitContactAction } from "@/app/actions/contact";
import { lightInputClass, lightPanelClass } from "@/lib/form-styles";
import type { Locale } from "@/i18n/routing";

export function ContactForm() {
  const t = useTranslations("pages.contact");
  const locale = useLocale() as Locale;
  const [state, formAction, pending] = useActionState(
    async (
      _prev: {
        error?: string;
        success?: boolean;
        emailed?: boolean;
      } | null,
      formData: FormData,
    ) => {
      formData.set("locale", locale);
      return (await submitContactAction(formData)) ?? null;
    },
    null,
  );

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
        {t("formSuccess")}
        {!state.emailed ? (
          <p className="mt-2 text-green-700/80">{t("formStoredOnly")}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className={`${lightPanelClass} space-y-4`}>
      <h3 className="text-lg font-semibold text-stone-900">{t("formTitle")}</h3>
      <p className="text-sm text-stone-600">{t("formSubtitle")}</p>

      {state?.error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {t(`formErrors.${state.error}`)}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-stone-700">{t("formName")}</label>
          <input name="name" required maxLength={80} className={lightInputClass} />
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700">{t("formEmail")}</label>
          <input
            name="email"
            type="email"
            required
            maxLength={120}
            className={lightInputClass}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700">{t("formSubject")}</label>
        <input name="subject" required maxLength={160} className={lightInputClass} />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700">{t("formMessage")}</label>
        <textarea
          name="message"
          required
          rows={5}
          maxLength={5000}
          className={lightInputClass}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? t("formSending") : t("formSubmit")}
      </button>
    </form>
  );
}
