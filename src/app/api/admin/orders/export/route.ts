import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatOrderId, ORDER_STATUS_LABELS, parseOrderItems, parseShippingAddress } from "@/lib/orders";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });

  const rows = orders.flatMap((order) => {
    const items = parseOrderItems(order.items);
    const shipping = parseShippingAddress(order.shippingAddress);
    const base = {
      订单号: formatOrderId(order.id),
      邮箱: order.email || "",
      收件人: shipping?.name ?? "",
      电话: shipping?.phone ?? "",
      地址: shipping
        ? [shipping.line1, shipping.line2, shipping.city, shipping.state, shipping.country, shipping.postalCode]
            .filter(Boolean)
            .join(" ")
        : "",
      订单金额: order.total,
      状态: ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status,
      支付方式: order.paymentMethod,
      支付ID: order.paymentId ?? "",
      下单时间: new Date(order.createdAt).toLocaleString("zh-CN"),
    };

    if (items.length === 0) {
      return [{ ...base, 商品: "", 数量: 0, 单价: 0, 小计: 0 }];
    }

    return items.map((item, index) => ({
      ...base,
      订单号: index === 0 ? formatOrderId(order.id) : "",
      邮箱: index === 0 ? base.邮箱 : "",
      订单金额: index === 0 ? base.订单金额 : "",
      状态: index === 0 ? base.状态 : "",
      支付方式: index === 0 ? base.支付方式 : "",
      支付ID: index === 0 ? base.支付ID : "",
      下单时间: index === 0 ? base.下单时间 : "",
      商品: `${item.nameZh} / ${item.nameEn}`,
      数量: item.quantity,
      单价: item.price,
      小计: item.price * item.quantity,
    }));
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
