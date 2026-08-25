"use client";

import { useActionState } from "react";
import { updateAffiliateAction } from "@/app/admin/actions";
import { buildAffiliateLink } from "@/lib/affiliates";
import { AffiliateLinkCopy } from "@/components/AffiliateLinkCopy";
import { AffiliateCodeField } from "@/components/admin/AffiliateCodeField";
import {
  AffiliateUserPicker,
  type AffiliateUserOption,
} from "@/components/admin/AffiliateUserPicker";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
const labelClass = "text-sm font-medium text-stone-700";

type Props = {
  affiliate: {
    id: string;
    code: string;
    name: string;
    email: string;
    commissionRate: number;
    active: boolean;
    notes: string;
    user: AffiliateUserOption | null;
  };
};

export function AffiliateEditForm({ affiliate }: Props) {
  const action = updateAffiliateAction.bind(null, affiliate.id);
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return (await action(formData)) ?? null;
    },
    null,
  );

  const link = buildAffiliateLink(affiliate.code);

  return (
    <form action={formAction} className="max-w-xl space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      {state?.error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          已保存
        </div>
      ) : null}
      <AffiliateLinkCopy
        link={link}
        code={affiliate.code}
        variant="inline"
        labels={{
          title: "推广链接",
          hint: "复制后发给合作方；买家通过链接访问并下单付款后计入该推广员提成。",
          copyLink: "一键复制链接",
          copyCode: "复制推广码",
          copied: "已复制到剪贴板",
          codeLabel: "推广码",
        }}
      />

      <AffiliateUserPicker initialUser={affiliate.user} required />
      <AffiliateCodeField defaultCode={affiliate.code} defaultManual />

      <div>
        <label className={labelClass}>名称 *</label>
        <input
          name="name"
          required
          defaultValue={affiliate.name}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>联系邮箱</label>
        <input
          name="email"
          type="email"
          defaultValue={affiliate.email}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>佣金比例 % *</label>
        <input
          name="commissionRate"
          type="number"
          min={0}
          max={100}
          step="0.1"
          defaultValue={affiliate.commissionRate}
          required
          className={inputClass}
        />
        <p className="mt-1 text-xs text-stone-500">
          按「商品小计 − 优惠」计佣，运费与税费不占提成比例。
        </p>
      </div>
      <div>
        <label className={labelClass}>备注</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={affiliate.notes}
          className={inputClass}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          name="active"
          value="on"
          defaultChecked={affiliate.active}
          className="h-4 w-4 rounded border-stone-300"
        />
        启用
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
