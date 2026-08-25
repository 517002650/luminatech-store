import Link from "next/link";
import {
  setAffiliateActiveAction,
} from "@/app/admin/actions";
import { buildAffiliateLink } from "@/lib/affiliates";

type AffiliateRow = {
  id: string;
  code: string;
  name: string;
  email: string;
  commissionRate: number;
  active: boolean;
  _count: { commissions: number; orders: number };
};

export function AffiliateTable({ affiliates }: { affiliates: AffiliateRow[] }) {
  if (affiliates.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
        暂无推广员。点击「新增推广员」创建，对方用专属链接带客下单即可计佣。
      </p>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-600">
          <tr>
            <th className="px-4 py-3 font-medium">推广码</th>
            <th className="px-4 py-3 font-medium">名称</th>
            <th className="px-4 py-3 font-medium">佣金率</th>
            <th className="px-4 py-3 font-medium">订单 / 佣金笔数</th>
            <th className="px-4 py-3 font-medium">推广链接</th>
            <th className="px-4 py-3 font-medium">状态</th>
            <th className="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {affiliates.map((row) => {
            const link = buildAffiliateLink(row.code, appUrl);
            return (
              <tr key={row.id}>
                <td className="px-4 py-3 font-mono font-semibold">{row.code}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-stone-900">{row.name}</p>
                  {row.email ? (
                    <p className="text-xs text-stone-500">{row.email}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">{row.commissionRate}%</td>
                <td className="px-4 py-3">
                  {row._count.orders} / {row._count.commissions}
                </td>
                <td className="max-w-xs px-4 py-3">
                  <code className="break-all text-xs text-stone-600">{link}</code>
                </td>
                <td className="px-4 py-3">
                  {row.active ? (
                    <span className="text-emerald-700">启用</span>
                  ) : (
                    <span className="text-stone-400">停用</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/affiliates/${row.id}`}
                      className="text-amber-700 hover:underline"
                    >
                      编辑
                    </Link>
                    <form
                      action={setAffiliateActiveAction.bind(
                        null,
                        row.id,
                        !row.active,
                      )}
                    >
                      <button
                        type="submit"
                        className="text-stone-600 hover:underline"
                      >
                        {row.active ? "停用" : "启用"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AffiliateNewLink() {
  return (
    <Link
      href="/admin/affiliates/new"
      className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700"
    >
      新增推广员
    </Link>
  );
}
