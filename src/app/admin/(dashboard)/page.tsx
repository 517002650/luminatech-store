import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductTable } from "@/components/admin/ProductTable";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
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
}
