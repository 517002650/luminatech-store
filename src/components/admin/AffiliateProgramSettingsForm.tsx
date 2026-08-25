"use client";

import { useActionState } from "react";
import { updateAffiliateProgramSettingsAction } from "@/app/admin/actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
const labelClass = "text-sm font-medium text-stone-700";

type Props = {
  settings: {
    affiliateSelfRegister: boolean;
    affiliateDefaultRate: number;
    affiliateAdminEmail: string;
    affiliateAdminPhone: string;
    affiliateAdminWechat: string;
    affiliateAdminNote: string;
  };
};

export function AffiliateProgramSettingsForm({ settings }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return (await updateAffiliateProgramSettingsAction(formData)) ?? null;
    },
    null,
  );

  return (
    <form
      action={formAction}
      className="mb-8 space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-5"
    >
      <div>
        <h2 className="text-base font-semibold text-stone-900">推广计划设置</h2>
        <p className="mt-1 text-sm text-stone-600">
          前台用户自助注册推广员时展示的管理员联系方式与默认佣金。填写后务必醒目展示，方便推广员联系谈提成。
        </p>
      </div>
      {state?.error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          推广设置已保存
        </div>
      ) : null}
      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          name="affiliateSelfRegister"
          value="on"
          defaultChecked={settings.affiliateSelfRegister}
          className="h-4 w-4 rounded border-stone-300"
        />
        允许前台用户自助注册成为推广员
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>自助注册默认佣金 %</label>
          <input
            name="affiliateDefaultRate"
            type="number"
            min={0}
            max={100}
            step="0.1"
            defaultValue={settings.affiliateDefaultRate}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>管理员邮箱 *</label>
          <input
            name="affiliateAdminEmail"
            type="email"
            defaultValue={settings.affiliateAdminEmail}
            placeholder="partner@yourdomain.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>电话 / WhatsApp</label>
          <input
            name="affiliateAdminPhone"
            defaultValue={settings.affiliateAdminPhone}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>微信</label>
          <input
            name="affiliateAdminWechat"
            defaultValue={settings.affiliateAdminWechat}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>联系说明（展示给推广员）</label>
        <textarea
          name="affiliateAdminNote"
          rows={3}
          defaultValue={settings.affiliateAdminNote}
          placeholder="例：工作日 10:00–18:00 回复；谈提成请备注「推广员+推广码」"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
      >
        {pending ? "保存中..." : "保存推广设置"}
      </button>
    </form>
  );
}
