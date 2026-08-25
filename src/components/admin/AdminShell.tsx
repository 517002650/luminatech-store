import Link from "next/link";
import {
  Database,
  Images,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  Package,
  Percent,
  Plus,
  RotateCcw,
  ShoppingCart,
  Star,
  Store,
  Tags,
  Ticket,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { logoutAction } from "@/app/admin/account-actions";
import {
  getCurrentAdmin,
  hasPermission,
  type AdminSession,
} from "@/lib/admin-auth";
import { NAV_PERMISSION, type AdminPermission } from "@/lib/admin-permissions";

/** 按使用频率分组：日常运营 → 商品营销 → 推广财务 → 店铺设置 → 系统维护 */
const BASE_NAV_GROUPS = [
  {
    label: "日常运营",
    items: [
      { href: "/admin/orders", label: "订单管理", icon: ShoppingCart },
      { href: "/admin", label: "商品列表", icon: LayoutDashboard },
      { href: "/admin/products/new", label: "新增商品", icon: Plus },
      { href: "/admin/returns", label: "退货申请", icon: RotateCcw },
      { href: "/admin/inbox", label: "客户留言", icon: MessageSquare },
      { href: "/admin/reviews", label: "评价审核", icon: Star },
    ],
  },
  {
    label: "商品与营销",
    items: [
      { href: "/admin/categories", label: "商品分类", icon: Tags },
      { href: "/admin/coupons", label: "优惠码", icon: Ticket },
    ],
  },
  {
    label: "推广与财务",
    items: [
      { href: "/admin/affiliates", label: "推广员", icon: Megaphone },
      { href: "/admin/commissions", label: "推广提成", icon: Percent },
      { href: "/admin/finance", label: "财务", icon: Wallet },
    ],
  },
  {
    label: "店铺设置",
    items: [
      { href: "/admin/shipping", label: "运费设置", icon: Truck },
      { href: "/admin/users", label: "用户管理", icon: Users },
    ],
  },
  {
    label: "系统维护",
    items: [
      { href: "/admin/media", label: "媒体清理", icon: Images },
      { href: "/admin/backup", label: "数据备份", icon: Database },
      { href: "/admin/security", label: "安全设置", icon: KeyRound },
      { href: "/admin/team", label: "团队账号", icon: UserCog },
    ],
  },
] as const;

function navAllowed(admin: AdminSession | null, href: string) {
  if (!admin) return false;
  const perm = NAV_PERMISSION[href] as AdminPermission | undefined;
  if (!perm) return true;
  return hasPermission(admin, perm);
}

export async function AdminShell({
  children,
  title,
  subtitle = "管理商品、订单与图片，保存后立即同步到前台",
  admin: adminProp,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  admin?: AdminSession | null;
}) {
  const admin = adminProp ?? (await getCurrentAdmin());
  const navGroups = BASE_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => navAllowed(admin, item.href)),
  })).filter((group) => group.items.length > 0);
  const nav = navGroups.flatMap((group) => group.items);

  const roleLabel =
    admin?.role === "owner"
      ? "Owner"
      : admin?.role === "admin"
        ? "Admin"
        : admin?.role ?? "";

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-lg font-bold text-stone-900">
              Lumina<span className="text-amber-600">Tech</span>
            </p>
            <p className="mt-1 text-xs text-stone-500">商店管理后台</p>
            {admin ? (
              <p className="mt-2 truncate text-xs text-stone-600" title={admin.email}>
                {admin.email}
                <span className="text-stone-400"> · {roleLabel}</span>
              </p>
            ) : null}
            <nav className="mt-6 space-y-4">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
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
              {nav.map(({ href, label }) => (
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
              {navAllowed(admin, "/admin/products/new") ? (
                <Link
                  href="/admin/products/new"
                  className="inline-flex items-center gap-1 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
                >
                  <Package className="h-4 w-4" />
                  新增
                </Link>
              ) : null}
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
