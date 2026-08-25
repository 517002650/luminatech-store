"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAdminAction,
  createRoleTypeAction,
  deleteRoleTypeAction,
  resetAdminTotpAction,
  setAdminActiveAction,
  updateAdminRoleAction,
  updateRoleTypePermissionsAction,
} from "@/app/admin/account-actions";
import {
  ADMIN_PERMISSION_KEYS,
  ADMIN_PERMISSION_LABELS,
  OWNER_ONLY_PERMISSIONS,
  type AdminPermission,
} from "@/lib/admin-permissions";

export type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: string;
  roleTypeId: string | null;
  roleTypeName: string;
  active: boolean;
  totpEnabled: boolean;
  createdAt: string;
};

export type RoleTypeRow = {
  id: string;
  key: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: AdminPermission[];
  accountCount: number;
};

type Props = {
  members: TeamMember[];
  roleTypes: RoleTypeRow[];
  currentAdminId: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500";

function PermissionChecklist({
  name = "permissions",
  selected,
  locked = false,
  hideOwnerOnly = true,
}: {
  name?: string;
  selected: AdminPermission[];
  locked?: boolean;
  hideOwnerOnly?: boolean;
}) {
  const selectedSet = new Set(selected);
  const keys = hideOwnerOnly
    ? ADMIN_PERMISSION_KEYS.filter((k) => !OWNER_ONLY_PERMISSIONS.includes(k))
    : ADMIN_PERMISSION_KEYS;

  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {keys.map((key) => (
        <label
          key={key}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            locked ? "border-stone-100 bg-stone-50 text-stone-400" : "border-stone-200"
          }`}
        >
          <input
            type="checkbox"
            name={name}
            value={key}
            defaultChecked={selectedSet.has(key) || key === "security"}
            disabled={locked || key === "security"}
            className="h-4 w-4 rounded border-stone-300"
          />
          <span>{ADMIN_PERMISSION_LABELS[key]}</span>
          {key === "security" ? (
            <span className="text-[10px] text-stone-400">必选</span>
          ) : null}
        </label>
      ))}
    </div>
  );
}

export function TeamAdminPanel({
  members,
  roleTypes,
  currentAdminId,
}: Props) {
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

  const [createTypeState, createTypeAction, creatingType] = useActionState(
    async (_p: { error?: string; success?: boolean } | null, fd: FormData) => {
      const r = await createRoleTypeAction(fd);
      if (r && "success" in r && r.success) router.refresh();
      return r ?? null;
    },
    null,
  );

  const defaultTypeId =
    roleTypes.find((r) => r.key === "admin")?.id ?? roleTypes[0]?.id ?? "";

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">账号类型与权限</h2>
          <p className="mt-1 text-sm text-stone-500">
            为不同类型勾选可访问的后台模块。默认 Admin 不含运费设置、媒体清理、数据备份；Owner
            全权且不可改。
          </p>
        </div>
        <div className="divide-y divide-stone-100">
          {roleTypes.map((rt) => {
            const locked = rt.key === "owner";
            const saveAction = updateRoleTypePermissionsAction.bind(null, rt.id);
            return (
              <div key={rt.id} className="px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-900">
                      {rt.name}
                      {rt.isSystem ? (
                        <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
                          内置
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      key: {rt.key} · {rt.accountCount} 名成员
                      {rt.description ? ` · ${rt.description}` : ""}
                    </p>
                  </div>
                  {!rt.isSystem ? (
                    <button
                      type="button"
                      disabled={pending || rt.accountCount > 0}
                      onClick={() => {
                        if (!window.confirm(`删除账号类型「${rt.name}」？`)) return;
                        startTransition(async () => {
                          await deleteRoleTypeAction(rt.id);
                          router.refresh();
                        });
                      }}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-40"
                    >
                      删除
                    </button>
                  ) : null}
                </div>

                {locked ? (
                  <PermissionChecklist
                    selected={rt.permissions}
                    locked
                    hideOwnerOnly={false}
                  />
                ) : (
                  <form
                    action={async (fd) => {
                      await saveAction(fd);
                      router.refresh();
                    }}
                    className="mt-3"
                  >
                    <label className="text-sm text-stone-600">
                      显示名称
                      <input
                        name="name"
                        defaultValue={rt.name}
                        className={inputClass}
                      />
                    </label>
                    <PermissionChecklist selected={rt.permissions} />
                    <button
                      type="submit"
                      className="mt-3 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-700"
                    >
                      保存权限
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <form
        action={createTypeAction}
        className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 p-6"
      >
        <h2 className="text-lg font-semibold text-stone-900">新建账号类型</h2>
        {createTypeState?.error ? (
          <p className="mt-2 text-sm text-red-600">{createTypeState.error}</p>
        ) : null}
        {createTypeState?.success ? (
          <p className="mt-2 text-sm text-green-700">已创建类型</p>
        ) : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            类型名称 *
            <input name="name" required placeholder="如：客服" className={inputClass} />
          </label>
          <label className="text-sm">
            说明
            <input name="description" placeholder="可选" className={inputClass} />
          </label>
        </div>
        <PermissionChecklist selected={["products", "orders", "inbox", "security"]} />
        <button
          type="submit"
          disabled={creatingType}
          className="mt-4 rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
        >
          {creatingType ? "创建中..." : "创建类型"}
        </button>
      </form>

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
                  {m.roleTypeName || m.role}
                  {" · "}
                  {m.active ? "启用" : "已停用"}
                  {" · "}
                  2FA {m.totpEnabled ? "开" : "关"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  disabled={pending || m.id === currentAdminId}
                  defaultValue={m.roleTypeId ?? ""}
                  onChange={(e) => {
                    const roleTypeId = e.target.value;
                    if (!roleTypeId) return;
                    startTransition(async () => {
                      await updateAdminRoleAction(m.id, roleTypeId);
                      router.refresh();
                    });
                  }}
                  className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs"
                >
                  {roleTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
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
        <h2 className="text-lg font-semibold text-stone-900">添加团队账号</h2>
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
            账号类型 *
            <select
              name="roleTypeId"
              required
              defaultValue={defaultTypeId}
              className={inputClass}
            >
              {roleTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                  {rt.key === "admin" ? "（默认运营）" : ""}
                </option>
              ))}
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
