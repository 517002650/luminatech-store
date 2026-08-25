"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  beginTotpSetupAction,
  changeOwnPasswordAction,
  confirmTotpSetupAction,
  disableTotpAction,
} from "@/app/admin/account-actions";

type Props = {
  email: string;
  totpEnabled: boolean;
};

export function SecurityPanel({ email, totpEnabled }: Props) {
  const router = useRouter();
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const [pwdState, pwdAction, pwdPending] = useActionState(
    async (_p: { error?: string; success?: boolean } | null, fd: FormData) => {
      const r = await changeOwnPasswordAction(fd);
      return r ?? null;
    },
    null,
  );

  const [confirmState, confirmAction, confirmPending] = useActionState(
    async (_p: { error?: string; success?: boolean } | null, fd: FormData) => {
      const r = await confirmTotpSetupAction(fd);
      if (r && "success" in r && r.success) {
        setSetup(null);
        router.refresh();
      }
      return r ?? null;
    },
    null,
  );

  const [disableState, disableAction, disablePending] = useActionState(
    async (_p: { error?: string; success?: boolean } | null, fd: FormData) => {
      const r = await disableTotpAction(fd);
      if (r && "success" in r && r.success) router.refresh();
      return r ?? null;
    },
    null,
  );

  const inputClass =
    "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">账号</h2>
        <p className="mt-1 text-sm text-stone-500">{email}</p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">修改密码</h2>
        <form action={pwdAction} className="mt-4 grid max-w-md gap-3">
          {pwdState?.error ? (
            <p className="text-sm text-red-600">{pwdState.error}</p>
          ) : null}
          {pwdState?.success ? (
            <p className="text-sm text-green-700">密码已更新</p>
          ) : null}
          <label className="text-sm">
            当前密码
            <input name="currentPassword" type="password" required className={inputClass} />
          </label>
          <label className="text-sm">
            新密码（≥12 位）
            <input name="newPassword" type="password" required className={inputClass} />
          </label>
          <label className="text-sm">
            确认新密码
            <input name="newPassword2" type="password" required className={inputClass} />
          </label>
          <button
            type="submit"
            disabled={pwdPending}
            className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
          >
            {pwdPending ? "保存中..." : "更新密码"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">两步验证（TOTP）</h2>
        <p className="mt-1 text-sm text-stone-500">
          可选。使用 Google Authenticator / 1Password 等 App 扫描二维码。
        </p>

        {totpEnabled ? (
          <div className="mt-4 space-y-4">
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              已启用两步验证。登录时需输入 6 位验证码。
            </p>
            <form action={disableAction} className="grid max-w-md gap-3">
              {disableState?.error ? (
                <p className="text-sm text-red-600">{disableState.error}</p>
              ) : null}
              <label className="text-sm">
                当前密码
                <input name="password" type="password" required className={inputClass} />
              </label>
              <label className="text-sm">
                当前验证码
                <input
                  name="code"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={inputClass}
                  placeholder="000000"
                />
              </label>
              <button
                type="submit"
                disabled={disablePending}
                className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
              >
                {disablePending ? "处理中..." : "关闭两步验证"}
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {!setup ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await beginTotpSetupAction();
                    if (r && "success" in r && r.success && r.secret && r.qrDataUrl) {
                      setSetup({ secret: r.secret, qrDataUrl: r.qrDataUrl });
                    }
                  })
                }
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-stone-900 hover:bg-amber-400 disabled:opacity-60"
              >
                {pending ? "生成中..." : "开始绑定 Authenticator"}
              </button>
            ) : (
              <div className="space-y-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setup.qrDataUrl}
                  alt="TOTP QR"
                  className="h-[220px] w-[220px] rounded-lg border border-stone-200"
                />
                <p className="text-xs text-stone-500 break-all">
                  无法扫码时手动输入密钥：{" "}
                  <code className="rounded bg-stone-100 px-1">{setup.secret}</code>
                </p>
                <form action={confirmAction} className="grid max-w-md gap-3">
                  {confirmState?.error ? (
                    <p className="text-sm text-red-600">{confirmState.error}</p>
                  ) : null}
                  <label className="text-sm">
                    输入 App 中的 6 位码以确认
                    <input
                      name="code"
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className={inputClass}
                      placeholder="000000"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={confirmPending}
                      className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
                    >
                      {confirmPending ? "验证中..." : "确认启用"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetup(null)}
                      className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
