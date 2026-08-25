"use client";

import { SafeImage } from "@/components/SafeImage";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  formatOrderId,
  getAllowedNextStatuses,
  parseOrderItems,
  parseShippingAddress,
  type OrderStatus,
} from "@/lib/orders";
import { ShippingAddressDisplay } from "@/components/ShippingAddressDisplay";
import { OrderTrackingForm } from "@/components/admin/OrderTrackingForm";
import { OrderRefundPanel } from "@/components/admin/OrderRefundPanel";
import { OrderInvoicePanel } from "@/components/admin/OrderInvoicePanel";

type Props = {
  order: {
    id: string;
    email: string;
    subtotal?: number;
    shippingFee?: number;
    taxAmount?: number;
    discountAmount?: number;
    couponCode?: string;
    total: number;
    refundedAmount?: number;
    status: string;
    shippingCarrier: string;
    trackingNumber: string;
    paymentMethod: string;
    paymentId: string | null;
    items: string;
    shippingAddress: string;
    createdAt: Date;
    updatedAt: Date;
  };
  canRefundOffline?: boolean;
  canRefundStripe?: boolean;
  canForceStatus?: boolean;
};

export function OrderDetailPanel({
  order,
  canRefundOffline = false,
  canRefundStripe = false,
  canForceStatus = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [force, setForce] = useState(false);
  const items = parseOrderItems(order.items);
  const shipping = parseShippingAddress(order.shippingAddress);

  const nextStatuses = useMemo(
    () => getAllowedNextStatuses(order.status),
    [order.status],
  );

  const selectOptions = useMemo(() => {
    if (force && canForceStatus) {
      return ORDER_STATUSES.filter((s) => s !== "cancelled");
    }
    const set = new Set<OrderStatus>([
      ...(ORDER_STATUSES.includes(order.status as OrderStatus)
        ? [order.status as OrderStatus]
        : []),
      ...nextStatuses,
    ]);
    return Array.from(set);
  }, [force, canForceStatus, order.status, nextStatuses]);

  function handleStatusChange(status: OrderStatus) {
    if (status === order.status) return;
    setError("");
    startTransition(async () => {
      const result = await updateOrderStatusAction(order.id, status, {
        force: force && canForceStatus,
      });
      if (result && "error" in result && result.error) {
        setError(String(result.error));
        router.refresh();
        return;
      }
      setForce(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
        <Info label="订单号" value={`#${formatOrderId(order.id)}`} />
        <Info label="客户邮箱" value={order.email || "—"} />
        <Info label="商品小计" value={formatPrice(order.subtotal ?? order.total)} />
        {(order.discountAmount ?? 0) > 0 && (
          <Info
            label="优惠"
            value={`-${formatPrice(order.discountAmount!)}${order.couponCode ? ` (${order.couponCode})` : ""}`}
          />
        )}
        <Info
          label="运费"
          value={(order.shippingFee ?? 0) === 0 ? "免运费" : formatPrice(order.shippingFee!)}
        />
        {(order.taxAmount ?? 0) > 0 && (
          <Info label="税费" value={formatPrice(order.taxAmount!)} />
        )}
        <Info label="订单总额" value={formatPrice(order.total)} />
        {(order.refundedAmount ?? 0) > 0 && (
          <Info label="已退款" value={formatPrice(order.refundedAmount!)} />
        )}
        <Info label="支付方式" value={order.paymentMethod.toUpperCase()} />
        <Info label="支付 ID" value={order.paymentId ?? "—"} />
        <Info
          label="下单时间"
          value={new Date(order.createdAt).toLocaleString("zh-CN")}
        />
      </div>

      {shipping && (
        <div className="print:hidden">
          <ShippingAddressDisplay address={shipping} title="收货地址" variant="admin" />
        </div>
      )}

      <div className="rounded-2xl border border-stone-200 bg-white p-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">订单状态</h2>
            <p className="mt-1 text-sm text-stone-500">
              正常路径：已付款 → 处理中 → 已发货 → 已完成。取消 / 退款请用下方退款面板。
            </p>
          </div>
          <select
            value={order.status}
            disabled={pending || (selectOptions.length <= 1 && !canForceStatus)}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
          >
            {selectOptions.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
                {status === order.status ? "（当前）" : ""}
              </option>
            ))}
          </select>
        </div>
        {canForceStatus ? (
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300"
            />
            Owner 强制跳转（跳过状态机；仍不可直接改为「已取消」）
          </label>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-700">{error}</p>
        ) : null}
      </div>

      <div className="print:hidden">
        <OrderTrackingForm
          orderId={order.id}
          shippingCarrier={order.shippingCarrier}
          trackingNumber={order.trackingNumber}
          status={order.status}
        />
      </div>

      <div className="print:hidden">
        <OrderRefundPanel
          orderId={order.id}
          status={order.status}
          paymentMethod={order.paymentMethod}
          total={order.total}
          refundedAmount={order.refundedAmount ?? 0}
          canRefundOffline={canRefundOffline}
          canRefundStripe={canRefundStripe}
        />
      </div>

      <OrderInvoicePanel order={order} />

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm print:hidden">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">商品明细</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId ?? "base"}-${item.slug}`}
              className="flex gap-4 px-6 py-4"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                <SafeImage src={item.image} alt={item.nameZh} fill className="object-cover" />
              </div>
              <div className="flex flex-1 items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-stone-900">
                    {item.nameZh}
                    {item.variantNameZh || item.variantNameEn || item.variantSku
                      ? ` (${item.variantNameZh || item.variantNameEn || item.variantSku})`
                      : ""}
                  </p>
                  <p className="text-xs text-stone-500">
                    {item.nameEn}
                    {item.variantNameEn || item.variantSku
                      ? ` (${item.variantNameEn || item.variantSku})`
                      : ""}
                  </p>
                  {item.variantSku ? (
                    <p className="mt-0.5 text-xs text-stone-400">SKU: {item.variantSku}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-stone-500">× {item.quantity}</p>
                </div>
                <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-medium text-stone-900">{value}</p>
    </div>
  );
}
