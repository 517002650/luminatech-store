import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getAdminWithPermission } from "@/lib/admin-auth";
import { COMMISSION_STATUS_LABELS } from "@/lib/affiliates";
import {
  listCommissionsInRange,
  resolveFinanceDateRange,
} from "@/lib/finance-report";
import { formatOrderId } from "@/lib/orders";

export async function GET(req: NextRequest) {
  if (!(await getAdminWithPermission("finance"))) {
    if (!(await getAdminWithPermission("commissions"))) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
  }

  const sp = req.nextUrl.searchParams;
  const range = resolveFinanceDateRange({
    range: sp.get("from") || sp.get("to") ? "custom" : sp.get("range") ?? "month",
    from: sp.get("from"),
    to: sp.get("to"),
  });

  const rows = await listCommissionsInRange(range);

  const sheetRows = rows.map((row) => ({
    推广员: row.affiliate.name,
    推广码: row.affiliate.code,
    订单号: formatOrderId(row.orderId),
    客户邮箱: row.order.email || "",
    订单总额: row.order.total,
    计佣基数: row.baseAmount,
    佣金比例: `${row.rate}%`,
    提成金额: row.amount,
    状态:
      COMMISSION_STATUS_LABELS[
        row.status as keyof typeof COMMISSION_STATUS_LABELS
      ] ?? row.status,
    创建时间: new Date(row.createdAt).toLocaleString("zh-CN"),
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Commissions");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="commissions-${range.fromStr}_${range.toStr}.xlsx"`,
    },
  });
}
