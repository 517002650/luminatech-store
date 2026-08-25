import Link from "next/link";
import { deleteCouponAction, toggleCouponAction } from "@/app/admin/actions";

type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  active: boolean;
  affiliate: { id: string; code: string; name: string } | null;
};

export function CouponTable({ coupons }: { coupons: CouponRow[] }) {
  if (coupons.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
        暂无优惠码，点击「新增优惠码」创建。可绑定推广员做优惠券推广。
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-600">
          <tr>
            <th className="px-4 py-3 font-medium">优惠码</th>
            <th className="px-4 py-3 font-medium">类型</th>
            <th className="px-4 py-3 font-medium">面值</th>
            <th className="px-4 py-3 font-medium">最低订单</th>
            <th className="px-4 py-3 font-medium">使用次数</th>
            <th className="px-4 py-3 font-medium">推广员</th>
            <th className="px-4 py-3 font-medium">状态</th>
            <th className="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {coupons.map((coupon) => (
            <tr key={coupon.id}>
              <td className="px-4 py-3 font-mono font-semibold">{coupon.code}</td>
              <td className="px-4 py-3">{coupon.type === "percent" ? "百分比" : "固定金额"}</td>
              <td className="px-4 py-3">
                {coupon.type === "percent" ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}
              </td>
              <td className="px-4 py-3">${coupon.minOrder.toFixed(2)}</td>
              <td className="px-4 py-3">
                {coupon.usedCount}
                {coupon.maxUses != null ? ` / ${coupon.maxUses}` : ""}
              </td>
              <td className="px-4 py-3">
                {coupon.affiliate ? (
                  <span className="text-stone-800">
                    {coupon.affiliate.name}
                    <span className="ml-1 font-mono text-xs text-stone-500">
                      ({coupon.affiliate.code})
                    </span>
                  </span>
                ) : (
                  <span className="text-stone-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <form
                  action={toggleCouponAction.bind(null, coupon.id, !coupon.active)}
                >
                  <button
                    type="submit"
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      coupon.active
                        ? "bg-green-100 text-green-800"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {coupon.active ? "启用" : "停用"}
                  </button>
                </form>
              </td>
              <td className="px-4 py-3">
                <form action={deleteCouponAction.bind(null, coupon.id)}>
                  <button type="submit" className="text-red-600 hover:underline">
                    删除
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CouponNewLink() {
  return (
    <Link
      href="/admin/coupons/new"
      className="inline-flex items-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
    >
      新增优惠码
    </Link>
  );
}
