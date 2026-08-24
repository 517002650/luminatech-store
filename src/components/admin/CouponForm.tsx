"use client";

import { useActionState } from "react";
import { createCouponAction } from "@/app/admin/actions";

export function CouponForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) =>
      (await createCouponAction(formData)) ?? null,
    null,
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      <div>
        <label className="text-sm font-medium text-stone-700">优惠码</label>
        <input
          name="code"
          required
          placeholder="WELCOME10"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm uppercase"
        />
      </div>
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
