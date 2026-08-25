"use client";

import { useActionState, useEffect } from "react";
import { createAffiliateAction } from "@/app/admin/actions";
import { AffiliateUserPicker } from "@/components/admin/AffiliateUserPicker";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
const labelClass = "text-sm font-medium text-stone-700";

export function AffiliateCreateForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await createAffiliateAction(formData)) ?? null;
    },
    null,
  );

  useEffect(() => {
    // keep form controlled via native inputs
  }, []);

  return (
    <form action={formAction} className="max-w-xl space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      {state?.error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <AffiliateUserPicker required />

      <div>
        <label className={labelClass}>推广码 *</label>
        <input
          name="code"
          required
          placeholder="如 ZHANGSAN"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-stone-500">
          链接形如 /zh?ref=ZHANGSAN ，仅字母数字与 _ -
        </p>
      </div>
      <div>
        <label className={labelClass}>名称 *</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>联系邮箱</label>
        <input name="email" type="email" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>佣金比例 % *</label>
        <input
          name="commissionRate"
          type="number"
          min={0}
          max={100}
          step="0.1"
          defaultValue={10}
          required
          className={inputClass}
        />
        <p className="mt-1 text-xs text-stone-500">
          按「商品小计 − 优惠」计佣，不含运费与税。默认 10%。
        </p>
      </div>
      <div>
        <label className={labelClass}>备注</label>
        <textarea name="notes" rows={3} className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? "创建中..." : "创建推广员"}
      </button>
    </form>
  );
}
