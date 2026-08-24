import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { prisma } from "@/lib/db";
import { specsToText } from "@/lib/product-admin";

type Props = {
  params: Promise<{ id: string }>;
};

function parseJsonArray(value: string) {
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}

function parseJsonSpecs(value: string) {
  try {
    return JSON.parse(value) as { label: string; value: string }[];
  } catch {
    return [];
  }
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) notFound();

  const gallery = parseJsonArray(product.images);

  return (
    <AdminShell title={`编辑商品：${product.nameZh}`}>
      <ProductForm
        productId={product.id}
        initialValues={{
          slug: product.slug,
          sku: product.sku,
          brand: product.brand,
          nameEn: product.nameEn,
          nameZh: product.nameZh,
          shortDescEn: product.shortDescEn,
          shortDescZh: product.shortDescZh,
          descriptionEn: product.descriptionEn,
          descriptionZh: product.descriptionZh,
          categoryEn: product.categoryEn,
          categoryZh: product.categoryZh,
          price: product.price,
          image: product.image,
          galleryText: gallery.join("\n"),
          specsEnText: specsToText(parseJsonSpecs(product.specsEn)),
          specsZhText: specsToText(parseJsonSpecs(product.specsZh)),
          highlightsEnText: parseJsonArray(product.highlightsEn).join("\n"),
          highlightsZhText: parseJsonArray(product.highlightsZh).join("\n"),
          stock: product.stock,
          featured: product.featured,
          warranty: product.warranty,
        }}
      />
    </AdminShell>
  );
}
