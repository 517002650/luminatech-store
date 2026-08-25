"use client";

import { useActionState } from "react";
import { updateOrderTrackingAction } from "@/app/admin/actions";
import { SHIPPING_CARRIERS } from "@/lib/shipping-tracking";

type Props = {
  orderId: string;
  shippingCarrier: string;
  trackingNumber: string;
  status: string;
};

export function OrderTrackingForm({
  orderId,
  shippingCarrier,
  trackingNumber,
  status,
}: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean; notified?: boolean } | null, formData: FormData) =>
      (await updateOrderTrackingAction(orderId, formData)) ?? null,
    null,
  );

  const canNotify = status === "shipped" || status === "completed";

  return (
    <form action={formAction} className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-stone-900">物流信息</h2>
      <p className="mt-1 text-sm text-stone-500">
        填写快递公司与运单号；买家可在订单详情查看并跳转查询物流。
      </p>

      {state?.error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          物流信息已保存{state.notified ? "，并已通知买家" : ""}。
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-stone-700">快递公司</label>
          <select
            name="shippingCarrier"
            defaultValue={shippingCarrier || "other"}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500"
          >
            {SHIPPING_CARRIERS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.labelZh}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700">运单号</label>
          <input
            name="trackingNumber"
            type="text"
            defaultValue={trackingNumber}
            placeholder="例如 1234567890"
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-amber-500"
          />
        </div>
      </div>

      {canNotify ? (
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input
            name="notifyBuyer"
            type="checkbox"
            defaultChecked={!trackingNumber}
            className="h-4 w-4 rounded border-stone-300"
          />
          保存后发送发货通知邮件（需已配置 SMTP）
        </label>
      ) : (
        <p className="mt-4 text-xs text-stone-500">
          将订单状态改为「已发货」时也会自动发送发货邮件（若已填运单号会一并附上）。
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? "保存中..." : "保存物流信息"}
      </button>
    </form>
  );
}
