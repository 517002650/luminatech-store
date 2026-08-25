import { AdminShell } from "@/components/admin/AdminShell";
import { CategoryCreateForm, CategoryTable } from "@/components/admin/CategoryManager";
import { listCategories } from "@/lib/categories";
import { prisma } from "@/lib/db";

export default async function AdminCategoriesPage() {
  const categories = await listCategories();
  const counts = await prisma.product.groupBy({
    by: ["categoryKey"],
    _count: { _all: true },
  });
  const countMap = Object.fromEntries(
    counts.map((c) => [c.categoryKey, c._count._all]),
  );

  const rows = categories.map((c) => ({
    ...c,
    productCount: countMap[c.key] ?? 0,
  }));

  return (
    <AdminShell title="商品分类" subtitle="自定义前台分类名称与排序，保存后立即同步到商城">
      <div className="space-y-8">
        <CategoryCreateForm />
        <CategoryTable categories={rows} />
      </div>
    </AdminShell>
  );
}
