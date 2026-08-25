import Link from "next/link";
import { Download } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderTable } from "@/components/admin/OrderTable";
import { prisma } from "@/lib/db";
import { parseOrderItems, parseShippingAddress } from "@/lib/orders";
import { resolveFulfillmentChannel } from "@/lib/fulfillment";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows = orders.map((order) => {
    const shipping = parseShippingAddress(order.shippingAddress);
    return {
      id: order.id,
      email: order.email,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      itemCount: parseOrderItems(order.items).reduce(
        (sum, item) => sum + item.quantity,
        0,
      ),
      trackingNumber: order.trackingNumber,
      shippingCarrier: order.shippingCarrier,
      phone: shipping?.phone ?? "",
      autoDelivered: order.autoDelivered,
      channel: resolveFulfillmentChannel({
        mode: order.fulfillmentChannel,
        shippingAddressJson: order.shippingAddress,
      }),
    };
  });

  return (
    <AdminShell
      title="订单管理"
      subtitle="国内快递与跨境出口：确认发货一步到位，列表会标出异常履约"
    >
      <div className="mb-4 flex justify-end">
        <a
          href="/api/admin/orders/export"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          <Download className="h-4 w-4" />
          导出 Excel
        </a>
      </div>
      <OrderTable orders={rows} />
      <p className="mt-4 text-xs text-stone-500">
        推荐在订单详情使用「确认发货」。收货地为中国大陆 → 国内承运商；其他国家/地区 →
        跨境出口（可打商业发票）。
      </p>
    </AdminShell>
  );
}
