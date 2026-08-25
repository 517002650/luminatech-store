import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { CouponForm } from "@/components/admin/CouponForm";
import { prisma } from "@/lib/db";

export default async function AdminNewCouponPage() {
  const affiliates = await prisma.affiliate.findMany({
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true, active: true },
  });

  return (
    <AdminShell
      title="新增优惠码"
      subtitle="示例：WELCOME10（10% off）、SAVE5（减 $5）。可绑定推广员做优惠券推广。"
    >
      <Link href="/admin/coupons" className="mb-4 inline-block text-sm text-amber-600 hover:underline">
        ← 返回优惠码列表
      </Link>
      <CouponForm affiliates={affiliates} />
    </AdminShell>
  );
}
