import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderDetailPanel } from "@/components/admin/OrderDetailPanel";
import { prisma } from "@/lib/db";
import { formatOrderId } from "@/lib/orders";
import { getCurrentAdmin, hasPermission, isOwnerSession } from "@/lib/admin-auth";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  let order = await prisma.order.findUnique({ where: { id } });

  if (!order) notFound();

  // Repair stuck digital orders (metadata previously omitted autoDeliver)
  if (
    !order.autoDelivered &&
    order.status !== "cancelled" &&
    ["paid", "processing"].includes(order.status)
  ) {
    try {
      const { maybeAutoFulfillDigitalOrder } = await import(
        "@/lib/digital-delivery"
      );
      const result = await maybeAutoFulfillDigitalOrder(order.id);
      if (result.fulfilled) {
        order = (await prisma.order.findUnique({ where: { id } })) ?? order;
      }
    } catch (err) {
      console.error("Repair digital fulfill failed:", err);
    }
  }

  const admin = await getCurrentAdmin();
  const canRefundOffline = admin ? hasPermission(admin, "refunds") : false;
  const canRefundStripe = admin ? hasPermission(admin, "refund_stripe") : false;
  const canForceStatus = admin ? isOwnerSession(admin) : false;

  return (
    <AdminShell
      title={`订单 #${formatOrderId(order.id)}`}
      subtitle="查看商品明细、填写物流并更新订单状态"
    >
      <Link
        href="/admin/orders"
        className="mb-4 inline-block text-sm text-amber-600 hover:underline"
      >
        ← 返回订单列表
      </Link>
      <OrderDetailPanel
        order={order}
        canRefundOffline={canRefundOffline}
        canRefundStripe={canRefundStripe}
        canForceStatus={canForceStatus}
      />
    </AdminShell>
  );
}
