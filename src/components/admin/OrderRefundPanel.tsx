"use client";

import { useActionState } from "react";
import { refundOrderAction } from "@/app/admin/actions";

type Props = {
  orderId: string;
  status: string;
  paymentMethod: string;
  totalLabel: string;
};

export function OrderRefundPanel({
  orderId,
  status,
  paymentMethod,
  totalLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean; stripeRefundId?: string } | null,
      formData: FormData,
    ) => (await refundOrderAction(orderId, formData)) ?? null,
    null,
  );

  if (status === "cancelled") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
        <h2 className="text-lg font-semibold text-stone-900">退款 / 取消</h2>
        <p className="mt-2 text-sm text-stone-600">此订单已取消。库存如已回补则无需再操作。</p>
      </div>
    );
  }

  const canRefund = ["paid", "processing", "shipped", "completed"].includes(status);
  if (!canRefund) return null;

  const isStripe = paymentMethod === "stripe";

  return (
    <form action={formAction} className="rounded-2xl border border-red-200 bg-red-50/40 p-6">
      <h2 className="text-lg font-semibold text-stone-900">退款 / 取消订单</h2>
      <p className="mt-1 text-sm text-stone-600">
        将订单标记为已取消并回补库存
        {isStripe ? `；若已配置 Stripe，将尝试退回 ${totalLabel}` : "（非 Stripe 订单请自行在支付渠道退款）"}
        。
      </p>

      {state?.error && (
        <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          已取消订单并回补库存
          {state.stripeRefundId ? `（Stripe 退款号：${state.stripeRefundId}）` : ""}。
        </div>
      )}

      <div className="mt-4">
        <label className="text-sm font-medium text-stone-700">备注（可选）</label>
        <input
          name="reason"
          type="text"
          placeholder="例如：客户申请退款"
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500"
        />
      </div>

      {isStripe ? (
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input
            name="skipStripe"
            type="checkbox"
            className="h-4 w-4 rounded border-stone-300"
          />
          仅取消订单（跳过 Stripe 退款，适用于已手动退款）
        </label>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-xl bg-red-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
      >
        {pending ? "处理中..." : isStripe ? "退款并取消订单" : "取消订单并回补库存"}
      </button>
    </form>
  );
}
