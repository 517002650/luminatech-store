import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { listCategories } from "@/lib/categories";

export default async function NewProductPage() {
  const categories = await listCategories();

  return (
    <AdminShell title="新增商品">
      <ProductForm categories={categories} />
    </AdminShell>
  );
}
