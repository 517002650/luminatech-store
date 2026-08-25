"use client";

import { useActionState } from "react";
import { refundOrderAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";

type Props = {
  orderId: string;
  status: string;
  paymentMethod: string;
  total: number;
  refundedAmount?: number;
  canRefundOffline?: boolean;
  canRefundStripe?: boolean;
};

export function OrderRefundPanel({
  orderId,
  status,
  paymentMethod,
  total,
  refundedAmount = 0,
  canRefundOffline = false,
  canRefundStripe = false,
}: Props) {
  const remaining = Math.max(0, Math.round((total - refundedAmount) * 100) / 100);

  const [state, formAction, pending] = useActionState(
    async (
      _prev: {
        error?: string;
        success?: boolean;
        stripeRefundId?: string;
        partial?: boolean;
      } | null,
      formData: FormData,
    ) => (await refundOrderAction(orderId, formData)) ?? null,
    null,
  );

  if (status === "cancelled") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
        <h2 className="text-lg font-semibold text-stone-900">退款 / 取消</h2>
        <p className="mt-2 text-sm text-stone-600">
          此订单已取消
          {refundedAmount > 0 ? `（已退 ${formatPrice(refundedAmount)}）` : ""}
          。库存如已回补则无需再操作。
        </p>
      </div>
    );
  }

  const canRefund = ["paid", "processing", "shipped", "completed"].includes(status);
  if (!canRefund || remaining <= 0) return null;

  if (!canRefundOffline && !canRefundStripe) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
        <h2 className="text-lg font-semibold text-stone-900">退款 / 取消</h2>
        <p className="mt-2 text-sm text-stone-600">
          你的角色没有退款权限。请联系 Owner 在「团队账号」中开通「退款记账」或「Stripe 在线退款」。
        </p>
      </div>
    );
  }

  const isStripe = paymentMethod === "stripe";
  const stripePathAvailable = isStripe && canRefundStripe;
  const mustSkipStripe = isStripe && !canRefundStripe && canRefundOffline;

  return (
    <form action={formAction} className="rounded-2xl border border-red-200 bg-red-50/40 p-6">
      <h2 className="text-lg font-semibold text-stone-900">退款 / 取消订单</h2>
      <p className="mt-1 text-sm text-stone-600">
        订单总额 {formatPrice(total)}
        {refundedAmount > 0 ? ` · 已退 ${formatPrice(refundedAmount)}` : ""}
        {" · "}
        可退余额 <strong>{formatPrice(remaining)}</strong>
        。全额退款会取消订单并回补库存；部分退款仅退款不回库存（行级退货走「退货申请」）。
      </p>

      {isStripe ? (
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-stone-600">
          {stripePathAvailable ? (
            <li>
              你有 <strong>Stripe 在线退款</strong> 权限：默认会从买家卡自动退钱。
            </li>
          ) : null}
          {canRefundOffline ? (
            <li>
              你有 <strong>退款记账</strong> 权限：可勾选「仅记账」记录线下/Dashboard 已退款。
            </li>
          ) : null}
          {mustSkipStripe ? (
            <li className="text-amber-800">
              当前角色不能调用 Stripe，提交时将自动仅记账。
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-stone-600">
          非 Stripe 支付：仅记账取消（请自行在支付渠道完成退款）。
        </p>
      )}

      {state?.error && (
        <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {state.partial ? "部分退款已完成" : "已全额退款并取消订单"}
          {state.stripeRefundId ? `（Stripe：${state.stripeRefundId}）` : ""}。
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-stone-700">
            退款金额 (USD)
          </label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            max={remaining}
            defaultValue={remaining}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500"
          />
          <p className="mt-1 text-xs text-stone-500">
            填满 {formatPrice(remaining)} = 全额退款并取消
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700">备注（可选）</label>
          <input
            name="reason"
            type="text"
            placeholder="例如：运费补偿 / 客户申请退款"
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {isStripe && canRefundOffline && canRefundStripe ? (
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input
            name="skipStripe"
            type="checkbox"
            className="h-4 w-4 rounded border-stone-300"
          />
          仅记账（跳过 Stripe，适用于已在 Dashboard 手动退款）
        </label>
      ) : null}

      {mustSkipStripe ? (
        <input type="hidden" name="skipStripe" value="on" />
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-xl bg-red-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
      >
        {pending
          ? "处理中..."
          : stripePathAvailable && !mustSkipStripe
            ? "确认退款（可走 Stripe）"
            : "确认取消 / 记账"}
      </button>
    </form>
  );
}
