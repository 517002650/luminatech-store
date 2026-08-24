import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { CouponForm } from "@/components/admin/CouponForm";

export default function AdminNewCouponPage() {
  return (
    <AdminShell title="新增优惠码" subtitle="示例：WELCOME10（10%  off）、SAVE5（减 $5）">
      <Link href="/admin/coupons" className="mb-4 inline-block text-sm text-amber-600 hover:underline">
        ← 返回优惠码列表
      </Link>
      <CouponForm />
    </AdminShell>
  );
}
