"use client";

import { useActionState, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createReturnRequestAction } from "@/app/actions/returns";
import { darkPanelClass, darkMetaClass } from "@/lib/dark-surface-styles";
import { lightInputClass } from "@/lib/form-styles";
import { formatPrice } from "@/lib/format";

const REASONS = [
  "unused",
  "defective",
  "wrong_item",
  "damaged_transit",
  "other",
] as const;

export type ReturnFormItem = {
  productId: string;
  variantId?: string;
  nameEn: string;
  nameZh: string;
  price: number;
  quantity: number;
  variantLabel?: string;
};

type Props = {
  orderId: string;
  items: ReturnFormItem[];
  existingStatus?: string | null;
};

function lineKey(productId: string, variantId?: string) {
  return variantId ? `${productId}:${variantId}` : productId;
}

export function ReturnRequestForm({ orderId, items, existingStatus }: Props) {
  const t = useTranslations("account.returns");
  const locale = useLocale();
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [lineKey(i.productId, i.variantId), true])),
  );
  const [qtys, setQtys] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      items.map((i) => [lineKey(i.productId, i.variantId), i.quantity]),
    ),
  );

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

  const anySelected = useMemo(
    () => Object.values(selected).some(Boolean),
    [selected],
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

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-zinc-300">{t("items")}</legend>
        {items.map((item) => {
          const key = lineKey(item.productId, item.variantId);
          const name = locale === "zh" ? item.nameZh : item.nameEn;
          return (
            <div
              key={key}
              className="rounded-lg border border-zinc-700/80 bg-zinc-900/50 px-3 py-3"
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="lineKey"
                  value={key}
                  checked={Boolean(selected[key])}
                  onChange={(e) =>
                    setSelected((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded border-zinc-600"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-zinc-100">
                    {name}
                    {item.variantLabel ? ` (${item.variantLabel})` : ""}
                  </span>
                  <span className={`mt-0.5 block text-xs ${darkMetaClass}`}>
                    {formatPrice(item.price)} · {t("maxQty", { qty: item.quantity })}
                  </span>
                </span>
              </label>
              {selected[key] ? (
                <div className="mt-2 ml-7 flex items-center gap-2">
                  <label className="text-xs text-zinc-400">{t("qty")}</label>
                  <input
                    type="number"
                    name={`qty:${key}`}
                    min={1}
                    max={item.quantity}
                    value={qtys[key] ?? item.quantity}
                    onChange={(e) =>
                      setQtys((prev) => ({
                        ...prev,
                        [key]: Math.min(
                          item.quantity,
                          Math.max(1, Math.floor(Number(e.target.value) || 1)),
                        ),
                      }))
                    }
                    className="w-20 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </fieldset>

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
        disabled={pending || !anySelected}
        className="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-60"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
