import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <AdminShell title="新增商品">
      <ProductForm />
    </AdminShell>
  );
}
