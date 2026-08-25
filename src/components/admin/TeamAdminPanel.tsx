"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAdminAction,
  resetAdminTotpAction,
  setAdminActiveAction,
  updateAdminRoleAction,
} from "@/app/admin/account-actions";

export type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  totpEnabled: boolean;
  createdAt: string;
};

type Props = {
  members: TeamMember[];
  currentAdminId: string;
};

export function TeamAdminPanel({ members, currentAdminId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [createState, createAction, creating] = useActionState(
    async (_p: { error?: string; success?: boolean } | null, fd: FormData) => {
      const r = await createAdminAction(fd);
      if (r && "success" in r && r.success) router.refresh();
      return r ?? null;
    },
    null,
  );

  const inputClass =
    "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500";

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">团队成员</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-start justify-between gap-4 px-6 py-4"
            >
              <div>
                <p className="font-medium text-stone-900">
                  {m.name || m.email}
                  {m.id === currentAdminId ? (
                    <span className="ml-2 text-xs text-stone-400">（我）</span>
                  ) : null}
                </p>
                <p className="text-sm text-stone-500">{m.email}</p>
                <p className="mt-1 text-xs text-stone-400">
                  {m.role === "owner" ? "Owner" : "Admin"}
                  {" · "}
                  {m.active ? "启用" : "已停用"}
                  {" · "}
                  2FA {m.totpEnabled ? "开" : "关"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  disabled={pending || m.id === currentAdminId}
                  defaultValue={m.role}
                  onChange={(e) => {
                    const role = e.target.value === "owner" ? "owner" : "admin";
                    startTransition(async () => {
                      await updateAdminRoleAction(m.id, role);
                      router.refresh();
                    });
                  }}
                  className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs"
                >
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
                <button
                  type="button"
                  disabled={pending || m.id === currentAdminId}
                  onClick={() =>
                    startTransition(async () => {
                      await setAdminActiveAction(m.id, !m.active);
                      router.refresh();
                    })
                  }
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs hover:bg-stone-50 disabled:opacity-40"
                >
                  {m.active ? "停用" : "启用"}
                </button>
                {m.totpEnabled ? (
                  <button
                    type="button"
                    disabled={pending || m.id === currentAdminId}
                    onClick={() => {
                      if (!window.confirm(`重置 ${m.email} 的两步验证？`)) return;
                      startTransition(async () => {
                        await resetAdminTotpAction(m.id);
                        router.refresh();
                      });
                    }}
                    className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-50 disabled:opacity-40"
                  >
                    重置 2FA
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <form action={createAction} className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">添加管理员</h2>
        {createState?.error ? (
          <p className="mt-2 text-sm text-red-600">{createState.error}</p>
        ) : null}
        {createState?.success ? (
          <p className="mt-2 text-sm text-green-700">已创建</p>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            邮箱 *
            <input name="email" type="email" required className={inputClass} />
          </label>
          <label className="text-sm">
            显示名称
            <input name="name" className={inputClass} />
          </label>
          <label className="text-sm">
            初始密码（≥12 位）*
            <input name="password" type="password" required className={inputClass} />
          </label>
          <label className="text-sm">
            角色
            <select name="role" defaultValue="admin" className={inputClass}>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="mt-4 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {creating ? "创建中..." : "创建账号"}
        </button>
      </form>
    </div>
  );
}
