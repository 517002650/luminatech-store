import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductTable } from "@/components/admin/ProductTable";
import { listCategories } from "@/lib/categories";
import { prisma } from "@/lib/db";

function lowStockThreshold() {
  const n = Number(process.env.LOW_STOCK_THRESHOLD ?? 5);
  return Number.isFinite(n) && n >= 0 ? n : 5;
}

export default async function AdminDashboardPage() {
  try {
    const threshold = lowStockThreshold();
    const [products, categories, pendingReviews, openInquiries] = await Promise.all([
      prisma.product.findMany({
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
          categoryZh: true,
          categoryKey: true,
        },
      }),
      listCategories(),
      prisma.review.count({ where: { approved: false } }),
      prisma.contactInquiry.count({ where: { handled: false } }),
    ]);

    const lowStock = products.filter((p) => p.stock <= threshold);

    return (
      <AdminShell title="商品列表">
        {(lowStock.length > 0 || pendingReviews > 0 || openInquiries > 0) && (
          <div className="mb-6 space-y-3">
            {lowStock.length > 0 ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">
                    低库存提醒：{lowStock.length} 件商品库存 ≤ {threshold}
                  </p>
                  <p className="mt-1 text-amber-800/90">
                    {lowStock
                      .slice(0, 6)
                      .map((p) => `${p.nameZh || p.nameEn}（${p.stock}）`)
                      .join(" · ")}
                    {lowStock.length > 6 ? " …" : ""}
                  </p>
                </div>
              </div>
            ) : null}
            {pendingReviews > 0 ? (
              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
                有{" "}
                <Link href="/admin/reviews" className="font-semibold text-amber-700 hover:underline">
                  {pendingReviews} 条评价
                </Link>{" "}
                待审核
              </div>
            ) : null}
            {openInquiries > 0 ? (
              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
                有{" "}
                <Link href="/admin/inbox" className="font-semibold text-amber-700 hover:underline">
                  {openInquiries} 条客户留言
                </Link>{" "}
                未处理
              </div>
            ) : null}
          </div>
        )}
        <div className="mb-4 flex justify-end">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700"
          >
            <Plus className="h-4 w-4" />
            新增商品
          </Link>
        </div>
        <ProductTable products={products} categories={categories} />
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
