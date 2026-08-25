"use client";

import { useActionState, useState } from "react";
import {
  bootstrapOwnerAction,
  cancelTotpLoginAction,
  loginAction,
  verifyTotpLoginAction,
} from "@/app/admin/account-actions";

type Props = {
  disabled?: boolean;
  needsBootstrap?: boolean;
  pending2fa?: boolean;
};

export function LoginForm({
  disabled = false,
  needsBootstrap = false,
  pending2fa = false,
}: Props) {
  const [need2fa, setNeed2fa] = useState(pending2fa);

  const [loginState, loginFormAction, loginPending] = useActionState(
    async (_prev: { error?: string; need2fa?: boolean } | null, formData: FormData) => {
      const result = await loginAction(formData);
      if (result && "need2fa" in result && result.need2fa) {
        setNeed2fa(true);
        return { need2fa: true };
      }
      return result ?? null;
    },
    null,
  );

  const [totpState, totpFormAction, totpPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await verifyTotpLoginAction(formData)) ?? null;
    },
    null,
  );

  const [bootState, bootFormAction, bootPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await bootstrapOwnerAction(formData)) ?? null;
    },
    null,
  );

  const inputClass =
    "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-stone-100 disabled:opacity-60";

  if (needsBootstrap) {
    return (
      <form action={bootFormAction} className="space-y-4">
        {bootState?.error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {bootState.error}
          </div>
        ) : null}
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          首次部署：用安装口令（环境变量 <code className="rounded bg-white px-1">ADMIN_PASSWORD</code>
          ）创建首个 Owner。之后请用邮箱登录。
        </p>
        <Field label="安装口令 (ADMIN_PASSWORD)" name="installPassword" type="password" required disabled={disabled || bootPending} className={inputClass} autoFocus />
        <Field label="Owner 邮箱" name="email" type="email" required disabled={disabled || bootPending} className={inputClass} />
        <Field label="显示名称" name="name" disabled={disabled || bootPending} className={inputClass} />
        <Field label="登录密码（≥12 位）" name="password" type="password" required disabled={disabled || bootPending} className={inputClass} />
        <Field label="确认密码" name="password2" type="password" required disabled={disabled || bootPending} className={inputClass} />
        <button
          type="submit"
          disabled={disabled || bootPending}
          className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {bootPending ? "创建中..." : "创建 Owner 并进入后台"}
        </button>
      </form>
    );
  }

  if (need2fa) {
    return (
      <div className="space-y-4">
        <form action={totpFormAction} className="space-y-4">
          {totpState?.error ? (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {totpState.error}
            </div>
          ) : null}
          <p className="text-sm text-stone-600">请输入 Authenticator 中的 6 位验证码。</p>
          <Field
            label="验证码"
            name="code"
            required
            disabled={disabled || totpPending}
            className={inputClass}
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
          />
          <button
            type="submit"
            disabled={disabled || totpPending}
            className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
          >
            {totpPending ? "验证中..." : "完成登录"}
          </button>
        </form>
        <form action={cancelTotpLoginAction}>
          <button type="submit" className="w-full text-center text-sm text-stone-500 hover:text-stone-800">
            返回重新登录
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={loginFormAction} className="space-y-4">
      {loginState && "error" in loginState && loginState.error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{loginState.error}</div>
      ) : null}
      <Field
        label="邮箱"
        name="email"
        type="email"
        required
        autoFocus={!disabled}
        disabled={disabled || loginPending}
        className={inputClass}
        autoComplete="username"
      />
      <Field
        label="密码"
        name="password"
        type="password"
        required
        disabled={disabled || loginPending}
        className={inputClass}
        autoComplete="current-password"
      />
      <button
        type="submit"
        disabled={disabled || loginPending}
        className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {loginPending ? "登录中..." : "登录后台"}
      </button>
      <p className="text-center text-xs text-stone-500">
        使用管理员邮箱登录。可选在「安全设置」开启两步验证。
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  disabled,
  className,
  autoFocus,
  autoComplete,
  inputMode,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  className: string;
  autoFocus?: boolean;
  autoComplete?: string;
  inputMode?: "numeric";
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-stone-700">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}
