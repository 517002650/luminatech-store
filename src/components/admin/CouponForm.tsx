"use client";

import { useActionState } from "react";
import { createCouponAction } from "@/app/admin/actions";
import { CouponCodeField } from "@/components/admin/CouponCodeField";

type AffiliateOption = { id: string; code: string; name: string; active: boolean };

export function CouponForm({
  affiliates = [],
}: {
  affiliates?: AffiliateOption[];
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) =>
      (await createCouponAction(formData)) ?? null,
    null,
  );

  const activeAffiliates = affiliates.filter((a) => a.active);

  return (
    <form action={formAction} className="max-w-lg space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      <CouponCodeField />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-stone-700">类型</label>
          <select name="type" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
            <option value="percent">百分比 (%)</option>
            <option value="fixed">固定金额 ($)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700">面值</label>
          <input
            name="value"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="10"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-stone-700">最低订单金额 ($)</label>
          <input
            name="minOrder"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700">最大使用次数（留空=无限）</label>
          <input
            name="maxUses"
            type="number"
            min="1"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700">过期时间（选填）</label>
        <input
          name="expiresAt"
          type="datetime-local"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700">绑定推广员（优惠券推广）</label>
        <select
          name="affiliateId"
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">不绑定（仅折扣，不计推广提成）</option>
          {activeAffiliates.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}（{a.code}）
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-stone-500">
          绑定后：买家使用此优惠码下单并付款，订单归因到该推广员并产生提成（优先于链接
          Cookie）。
        </p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "保存中..." : "创建优惠码"}
      </button>
    </form>
  );
}
