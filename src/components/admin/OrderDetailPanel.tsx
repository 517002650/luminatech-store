"use client";

import { SafeImage } from "@/components/SafeImage";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  formatOrderId,
  parseOrderItems,
  parseShippingAddress,
  type OrderStatus,
} from "@/lib/orders";
import { ShippingAddressDisplay } from "@/components/ShippingAddressDisplay";
import { OrderTrackingForm } from "@/components/admin/OrderTrackingForm";

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
};

export function OrderDetailPanel({ order }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const items = parseOrderItems(order.items);
  const shipping = parseShippingAddress(order.shippingAddress);

  function handleStatusChange(status: OrderStatus) {
    startTransition(async () => {
      await updateOrderStatusAction(order.id, status);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <Info label="支付方式" value={order.paymentMethod.toUpperCase()} />
        <Info label="支付 ID" value={order.paymentId ?? "—"} />
        <Info
          label="下单时间"
          value={new Date(order.createdAt).toLocaleString("zh-CN")}
        />
      </div>

      {shipping && (
        <ShippingAddressDisplay address={shipping} title="收货地址" variant="admin" />
      )}

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-stone-900">订单状态</h2>
          <select
            value={order.status}
            disabled={pending}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <OrderTrackingForm
        orderId={order.id}
        shippingCarrier={order.shippingCarrier}
        trackingNumber={order.trackingNumber}
        status={order.status}
      />

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">商品明细</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {items.map((item) => (
            <div key={`${item.productId}-${item.slug}`} className="flex gap-4 px-6 py-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                <SafeImage src={item.image} alt={item.nameZh} fill className="object-cover" />
              </div>
              <div className="flex flex-1 items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-stone-900">{item.nameZh}</p>
                  <p className="text-xs text-stone-500">{item.nameEn}</p>
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
