import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductDownloadsPanel } from "@/components/admin/ProductDownloadsPanel";
import { ProductForm } from "@/components/admin/ProductForm";
import { listCategories, resolveCategoryKey } from "@/lib/categories";
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
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        downloads: { orderBy: [{ type: "asc" }, { createdAt: "desc" }] },
        variants: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      },
    }),
    listCategories(),
  ]);

  if (!product) notFound();

  const { ensureDefaultVariant, toPublicVariants } = await import(
    "@/lib/product-variants"
  );
  if (product.variants.length === 0) {
    await ensureDefaultVariant(product.id);
  }
  const variants =
    product.variants.length > 0
      ? product.variants
      : (
          await prisma.productVariant.findMany({
            where: { productId: product.id },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          })
        );

  const gallery = parseJsonArray(product.images);
  const knownKeys = categories.map((c) => c.key);

  return (
    <AdminShell title={`编辑商品：${product.nameZh}`}>
      <div className="space-y-8">
        <ProductForm
          productId={product.id}
          categories={categories}
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
            categoryKey: resolveCategoryKey(
              {
                categoryKey: product.categoryKey,
                categoryEn: product.categoryEn,
                slug: product.slug,
              },
              knownKeys,
            ),
            categoryEn: product.categoryEn,
            categoryZh: product.categoryZh,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            image: product.image,
            galleryText: gallery.join("\n"),
            specsEnText: specsToText(parseJsonSpecs(product.specsEn)),
            specsZhText: specsToText(parseJsonSpecs(product.specsZh)),
            highlightsEnText: parseJsonArray(product.highlightsEn).join("\n"),
            highlightsZhText: parseJsonArray(product.highlightsZh).join("\n"),
            stock: product.stock,
            featured: product.featured,
            requiresFreight: product.requiresFreight,
            autoDeliver: product.autoDeliver,
            hsCode: product.hsCode,
            originCountry: product.originCountry,
            customsDescEn: product.customsDescEn,
            weightGrams: product.weightGrams,
            active: product.active,
            warranty: product.warranty,
            variants: toPublicVariants(variants).map((v) => ({
              id: v.id,
              sku: v.sku,
              nameEn: v.nameEn,
              nameZh: v.nameZh,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              stock: v.stock,
              active: v.active,
              isDefault: v.isDefault,
              sortOrder: v.sortOrder,
            })),
          }}
        />

        <ProductDownloadsPanel
          productId={product.id}
          downloads={product.downloads.map((d) => ({
            id: d.id,
            type: d.type,
            version: d.version,
            titleEn: d.titleEn,
            titleZh: d.titleZh,
            notesEn: d.notesEn,
            notesZh: d.notesZh,
            fileUrl: d.fileUrl,
            fileName: d.fileName,
            fileSize: d.fileSize,
            isLatest: d.isLatest,
            createdAt: d.createdAt.toISOString(),
          }))}
        />
      </div>
    </AdminShell>
  );
}
