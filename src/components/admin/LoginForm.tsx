"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await loginAction(formData)) ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      <div>
        <label className="text-sm font-medium text-stone-700">管理密码</label>
        <input
          name="password"
          type="password"
          required
          autoFocus
          placeholder="请输入后台密码"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? "登录中..." : "登录后台"}
      </button>
      <p className="text-center text-xs text-stone-500">
        默认密码 <code className="rounded bg-stone-100 px-1">admin123</code>，请在 .env 中设置
        ADMIN_PASSWORD
      </p>
    </form>
  );
}
