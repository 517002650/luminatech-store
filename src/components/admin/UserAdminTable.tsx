"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setUserBannedFromReviewsAction } from "@/app/admin/actions";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  bannedFromReviews: boolean;
  createdAt: string;
  orderCount: number;
  reviewCount: number;
};

type Props = {
  users: AdminUserRow[];
};

export function UserAdminTable({ users }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setBanned(id: string, banned: boolean) {
    startTransition(async () => {
      await setUserBannedFromReviewsAction(id, banned);
      router.refresh();
    });
  }

  if (users.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
        暂无注册用户
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-4 py-3 font-medium">用户</th>
            <th className="px-4 py-3 font-medium">订单</th>
            <th className="px-4 py-3 font-medium">评价</th>
            <th className="px-4 py-3 font-medium">注册时间</th>
            <th className="px-4 py-3 font-medium">评价权限</th>
            <th className="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {users.map((user) => (
            <tr key={user.id} className={user.bannedFromReviews ? "bg-red-50/40" : undefined}>
              <td className="px-4 py-3">
                <p className="font-medium text-stone-900">
                  {user.name.trim() || "（未填姓名）"}
                </p>
                <p className="text-xs text-stone-500">{user.email}</p>
              </td>
              <td className="px-4 py-3 text-stone-700">{user.orderCount}</td>
              <td className="px-4 py-3 text-stone-700">{user.reviewCount}</td>
              <td className="px-4 py-3 text-xs text-stone-500">
                {new Date(user.createdAt).toLocaleString("zh-CN")}
              </td>
              <td className="px-4 py-3">
                {user.bannedFromReviews ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                    禁止评价
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    允许
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setBanned(user.id, !user.bannedFromReviews)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
                    user.bannedFromReviews
                      ? "border border-stone-300 text-stone-700 hover:bg-stone-50"
                      : "border border-red-200 text-red-700 hover:bg-red-50"
                  }`}
                >
                  {user.bannedFromReviews ? "解除黑名单" : "加入黑名单"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
