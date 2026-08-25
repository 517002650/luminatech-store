import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { CategoryEditForm } from "@/components/admin/CategoryManager";
import { listCategories } from "@/lib/categories";

type Props = { params: Promise<{ id: string }> };

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const categories = await listCategories();
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  return (
    <AdminShell title={`编辑分类：${category.zh}`} subtitle="修改名称或标识后，已关联商品会自动同步">
      <CategoryEditForm category={category} />
    </AdminShell>
  );
}
