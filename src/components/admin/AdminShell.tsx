import Link from "next/link";
import {
  Database,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  ShoppingCart,
  Store,
  Tags,
  Ticket,
  Truck,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "商品列表", icon: LayoutDashboard },
  { href: "/admin/products/new", label: "新增商品", icon: Plus },
  { href: "/admin/categories", label: "商品分类", icon: Tags },
  { href: "/admin/orders", label: "订单管理", icon: ShoppingCart },
  { href: "/admin/coupons", label: "优惠码", icon: Ticket },
  { href: "/admin/shipping", label: "运费设置", icon: Truck },
  { href: "/admin/backup", label: "数据备份", icon: Database },
] as const;

export function AdminShell({
  children,
  title,
  subtitle = "管理商品、订单与图片，保存后立即同步到前台",
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-stone-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-lg font-bold text-stone-900">
              Lumina<span className="text-amber-600">Tech</span>
            </p>
            <p className="mt-1 text-xs text-stone-500">商店管理后台</p>
            <nav className="mt-6 space-y-1">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <Link
                href="/en"
                target="_blank"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                <Store className="h-4 w-4" />
                查看前台
              </Link>
            </nav>
            <form action={logoutAction} className="mt-6 border-t border-stone-100 pt-4">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 overflow-x-auto lg:hidden">
            <nav className="flex min-w-max gap-2 pb-1">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="shrink-0 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
              <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
            </div>
            <div className="flex gap-2 lg:hidden">
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-1 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
              >
                <Package className="h-4 w-4" />
                新增
              </Link>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
