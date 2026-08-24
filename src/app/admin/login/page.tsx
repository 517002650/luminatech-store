import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">
          Lumina<span className="text-amber-600">Tech</span> 后台
        </h1>
        <p className="mt-2 text-sm text-stone-500">登录以管理商品</p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
