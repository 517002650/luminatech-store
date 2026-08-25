"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  formatOrderId,
  type OrderStatus,
} from "@/lib/orders";
import {
  fulfillmentChannelLabel,
  isPendingShipWithTracking,
  isShippedWithoutTracking,
  type FulfillmentChannel,
} from "@/lib/fulfillment";
import { TrackingLink } from "@/components/TrackingLink";

type OrderRow = {
  id: string;
  email: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: Date;
  itemCount: number;
  trackingNumber?: string;
  shippingCarrier?: string;
  phone?: string;
  autoDelivered?: boolean;
  channel: FulfillmentChannel;
};

export function OrderTable({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
        <p className="text-stone-600">暂无订单，客户完成支付后会出现在这里。</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] table-fixed text-sm">
          <colgroup>
            <col className="w-[9%]" />
            <col className="w-[10%]" />
            <col className="w-[18%]" />
            <col className="w-[9%]" />
            <col className="w-[14%]" />
            <col className="w-[8%]" />
            <col className="w-[11%]" />
            <col className="w-[13%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-3 py-3 font-medium">订单号</th>
              <th className="px-3 py-3 font-medium">市场</th>
              <th className="px-3 py-3 font-medium">邮箱</th>
              <th className="px-3 py-3 font-medium">金额</th>
              <th className="px-3 py-3 font-medium">运单</th>
              <th className="px-3 py-3 font-medium">状态</th>
              <th className="px-3 py-3 font-medium">提醒</th>
              <th className="px-3 py-3 font-medium">时间</th>
              <th className="px-3 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const pendingShip = isPendingShipWithTracking(order);
              const missingTrack = isShippedWithoutTracking({
                status: order.status,
                trackingNumber: order.trackingNumber,
                shippingCarrier: order.shippingCarrier,
                autoDelivered: order.autoDelivered,
              });
              return (
                <tr
                  key={order.id}
                  className={`border-b border-stone-100 last:border-0 ${
                    pendingShip || missingTrack ? "bg-amber-50/60" : ""
                  }`}
                >
                  <td className="px-3 py-3 align-middle font-mono text-xs font-medium whitespace-nowrap">
                    #{formatOrderId(order.id)}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium leading-5 ${
                        order.channel === "domestic"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-violet-100 text-violet-800"
                      }`}
                    >
                      {fulfillmentChannelLabel(order.channel)}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle text-stone-600">
                    <span className="line-clamp-2 break-all">
                      {order.email || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle font-medium whitespace-nowrap">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    {order.autoDelivered ||
                    order.shippingCarrier === "digital" ? (
                      <span className="inline-flex whitespace-nowrap rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium leading-5 text-emerald-800">
                        在线交付
                      </span>
                    ) : (
                      <TrackingLink
                        compact
                        shippingCarrier={order.shippingCarrier}
                        trackingNumber={order.trackingNumber}
                        phone={order.phone}
                      />
                    )}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <StatusBadge status={order.status as OrderStatus} />
                  </td>
                  <td className="px-3 py-3 align-middle text-xs">
                    {pendingShip ? (
                      <span className="font-medium whitespace-nowrap text-amber-800">
                        有运单未发货
                      </span>
                    ) : missingTrack ? (
                      <span className="font-medium whitespace-nowrap text-amber-800">
                        已发货无运单
                      </span>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-middle text-xs text-stone-500 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
                    >
                      查看
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, string> = {
    paid: "bg-blue-100 text-blue-700",
    processing: "bg-amber-100 text-amber-700",
    shipped: "bg-indigo-100 text-indigo-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-stone-100 text-stone-600",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium leading-5 ${colors[status] ?? colors.paid}`}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
