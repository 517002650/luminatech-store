"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createReturnRequestAction } from "@/app/actions/returns";
import { darkPanelClass, darkMetaClass } from "@/lib/dark-surface-styles";
import { lightInputClass } from "@/lib/form-styles";

const REASONS = [
  "unused",
  "defective",
  "wrong_item",
  "damaged_transit",
  "other",
] as const;

type Props = {
  orderId: string;
  existingStatus?: string | null;
};

export function ReturnRequestForm({ orderId, existingStatus }: Props) {
  const t = useTranslations("account.returns");
  const [state, formAction, pending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData,
    ): Promise<{ error?: string; success?: boolean } | null> => {
      formData.set("orderId", orderId);
      return (await createReturnRequestAction(formData)) ?? null;
    },
    null,
  );

  if (existingStatus) {
    return (
      <div className={`${darkPanelClass} p-5`}>
        <h3 className="font-semibold text-zinc-100">{t("title")}</h3>
        <p className={`mt-2 text-sm ${darkMetaClass}`}>
          {t("existing", { status: t(`status.${existingStatus}`) })}
        </p>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div className={`${darkPanelClass} p-5`}>
        <h3 className="font-semibold text-zinc-100">{t("title")}</h3>
        <p className="mt-2 text-sm text-cyan-300">{t("success")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className={`${darkPanelClass} space-y-4 p-5`}>
      <div>
        <h3 className="font-semibold text-zinc-100">{t("title")}</h3>
        <p className={`mt-1 text-sm ${darkMetaClass}`}>{t("subtitle")}</p>
      </div>

      {state?.error ? (
        <p className="text-sm text-red-300">{t(`errors.${state.error}`)}</p>
      ) : null}

      <div>
        <label className="text-sm font-medium text-zinc-300">{t("reason")}</label>
        <select
          name="reason"
          required
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          {REASONS.map((key) => (
            <option key={key} value={key}>
              {t(`reasons.${key}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-300">{t("details")}</label>
        <textarea
          name="details"
          rows={3}
          placeholder={t("detailsPlaceholder")}
          className={`${lightInputClass} mt-1 border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500`}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-60"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
