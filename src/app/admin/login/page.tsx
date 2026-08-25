import { redirect } from "next/navigation";
import {
  getAdminAuthConfigError,
  getPending2faAdminId,
  hasAnyAdmin,
  isAdminAuthenticated,
} from "@/lib/admin-auth";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  const configError = getAdminAuthConfigError();
  const needsBootstrap = !(await hasAnyAdmin());
  const pending2fa = Boolean(await getPending2faAdminId());

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">
          Lumina<span className="text-amber-600">Tech</span> 后台
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          {needsBootstrap
            ? "初始化首个 Owner 账号"
            : pending2fa
              ? "两步验证"
              : "使用管理员邮箱登录"}
        </p>
        {configError ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {configError}
          </div>
        ) : null}
        <div className="mt-8">
          <LoginForm
            disabled={Boolean(configError)}
            needsBootstrap={needsBootstrap}
            pending2fa={pending2fa}
          />
        </div>
      </div>
    </div>
  );
}
