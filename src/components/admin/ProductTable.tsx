"use client";

import { SafeImage } from "@/components/SafeImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteProductAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";

type ProductRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  price: number;
  stock: number;
  featured: boolean;
  image: string;
  categoryEn: string;
};

export function ProductTable({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`确定删除「${name}」吗？此操作不可恢复。`)) return;
    startTransition(async () => {
      await deleteProductAction(id);
      router.refresh();
    });
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
        <p className="text-stone-600">还没有商品，点击「新增商品」开始添加。</p>
        <Link
          href="/admin/products/new"
          className="mt-4 inline-block rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white"
        >
          新增商品
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">商品</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium">价格</th>
              <th className="px-4 py-3 font-medium">库存</th>
              <th className="px-4 py-3 font-medium">精选</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-stone-100">
                      <SafeImage
                        src={product.image}
                        alt={product.nameZh}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">{product.nameZh}</p>
                      <p className="text-xs text-stone-500">{product.nameEn}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-stone-600">{product.categoryEn}</td>
                <td className="px-4 py-4 font-medium">{formatPrice(product.price)}</td>
                <td className="px-4 py-4">{product.stock}</td>
                <td className="px-4 py-4">
                  {product.featured ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      是
                    </span>
                  ) : (
                    <span className="text-stone-400">否</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-stone-700 hover:bg-stone-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      编辑
                    </Link>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDelete(product.id, product.nameZh)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
