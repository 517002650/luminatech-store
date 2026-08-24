import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductTable } from "@/components/admin/ProductTable";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameZh: true,
        price: true,
        stock: true,
        featured: true,
        image: true,
        categoryEn: true,
      },
    });

    return (
      <AdminShell title="商品列表">
        <div className="mb-4 flex justify-end">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700"
          >
            <Plus className="h-4 w-4" />
            新增商品
          </Link>
        </div>
        <ProductTable products={products} />
      </AdminShell>
    );
  } catch (err) {
    console.error("Admin dashboard DB error:", err);
    return (
      <AdminShell title="商品列表">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <p className="font-semibold">数据库连接失败</p>
          <p className="mt-2">
            请确认 Vercel 已配置正确的 <code>DATABASE_URL</code>（Neon PostgreSQL），
            并重新部署一次。部署时会自动建表并导入示例商品。
          </p>
          <p className="mt-2 text-red-600">
            {err instanceof Error ? err.message : "Unknown database error"}
          </p>
        </div>
      </AdminShell>
    );
  }
}
