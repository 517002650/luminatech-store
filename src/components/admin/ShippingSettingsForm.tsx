"use client";

import { useActionState } from "react";
import { updateShippingSettingsAction } from "@/app/admin/actions";
import { COUNTRY_OPTIONS } from "@/lib/pricing";
import type { ShippingSettingsData } from "@/lib/shipping-settings";

type Props = {
  settings: ShippingSettingsData;
};

export function ShippingSettingsForm({ settings }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) =>
      (await updateShippingSettingsAction(formData)) ?? null,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          运费设置已保存，前台结算页将立即生效。
        </div>
      )}

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">包邮规则</h2>
        <p className="mt-1 text-sm text-stone-500">
          折后商品小计达到门槛即免运费。设为 0 表示全场包邮。
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-stone-700">满多少包邮 (USD)</label>
            <input
              name="freeShippingThreshold"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={settings.freeShippingThreshold}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">默认运费 / 其他国家 (USD)</label>
            <input
              name="flatRate"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={settings.flatRate}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">欧盟默认运费 (USD)</label>
            <input
              name="euRate"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={settings.euRate}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-stone-400">未单独设价的欧盟国家用此运费</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">各国运费 (USD)</h2>
          <p className="mt-1 text-sm text-stone-500">留空则使用「默认运费」或「欧盟默认运费」</p>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {COUNTRY_OPTIONS.filter((c) => c.code !== "OTHER").map((country) => (
            <div key={country.code}>
              <label className="text-sm font-medium text-stone-700">
                {country.zh}{" "}
                <span className="font-normal text-stone-400">({country.code})</span>
              </label>
              <input
                name={`rate_${country.code}`}
                type="number"
                step="0.01"
                min="0"
                defaultValue={settings.countryRates[country.code] ?? ""}
                placeholder="留空用默认"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-8 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? "保存中..." : "保存运费设置"}
      </button>
    </form>
  );
}
