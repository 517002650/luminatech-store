import { AdminShell } from "@/components/admin/AdminShell";
import { CouponNewLink, CouponTable } from "@/components/admin/CouponTable";
import { prisma } from "@/lib/db";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AdminShell title="优惠码管理" subtitle="创建和管理折扣码，结算页可输入使用">
      <div className="mb-4 flex justify-end">
        <CouponNewLink />
      </div>
      <CouponTable coupons={coupons} />
    </AdminShell>
  );
}
