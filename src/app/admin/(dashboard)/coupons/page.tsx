import { AdminShell } from "@/components/admin/AdminShell";
import { CouponNewLink, CouponTable } from "@/components/admin/CouponTable";
import { prisma } from "@/lib/db";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      affiliate: { select: { id: true, code: true, name: true } },
    },
  });

  return (
    <AdminShell
      title="优惠码管理"
      subtitle="创建折扣码；可选绑定推广员，实现优惠券推广提成"
    >
      <div className="mb-4 flex justify-end">
        <CouponNewLink />
      </div>
      <CouponTable coupons={coupons} />
    </AdminShell>
  );
}
