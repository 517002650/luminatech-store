import { prisma } from "@/lib/db";
import type { DbBackupPayload } from "@/lib/db-backup";

type Row = Record<string, unknown>;

function reviveDates(row: Row, fields: string[]): Row {
  const next = { ...row };
  for (const field of fields) {
    const value = next[field];
    if (typeof value === "string") {
      next[field] = new Date(value);
    }
  }
  return next;
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : [];
}

export function parseBackupJson(raw: string): DbBackupPayload {
  const parsed = JSON.parse(raw) as DbBackupPayload;
  if (!parsed?.data || typeof parsed.data !== "object") {
    throw new Error("备份文件无效：缺少 data");
  }
  return parsed;
}

/** Wipe and reload entire database from backup (dangerous). */
export async function restoreFullBackup(backup: DbBackupPayload) {
  const {
    users,
    passwordResetTokens,
    coupons,
    shippingSettings,
    categories,
    products,
    productVariants,
    productDownloads,
    orders,
    wishlistItems,
    reviews,
  } = backup.data;

  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productDownload.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.order.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shippingSettings.deleteMany();

  if (users.length) {
    await prisma.user.createMany({
      data: asRows(users).map((u) => reviveDates(u, ["createdAt", "updatedAt"]) as never),
    });
  }
  if (categories.length) {
    await prisma.category.createMany({
      data: asRows(categories).map((c) =>
        reviveDates(c, ["createdAt", "updatedAt"]) as never,
      ),
    });
  }
  if (coupons.length) {
    await prisma.coupon.createMany({
      data: asRows(coupons).map((c) =>
        reviveDates(c, ["createdAt", "updatedAt", "expiresAt"]) as never,
      ),
    });
  }
  if (shippingSettings.length) {
    await prisma.shippingSettings.createMany({
      data: asRows(shippingSettings).map((s) =>
        reviveDates(s, ["updatedAt"]) as never,
      ),
    });
  }
  if (products.length) {
    await prisma.product.createMany({
      data: asRows(products).map((p) =>
        reviveDates(p, ["createdAt", "updatedAt"]) as never,
      ),
    });
  }
  const variantRows = asRows(productVariants);
  if (variantRows.length) {
    await prisma.productVariant.createMany({
      data: variantRows.map((v) =>
        reviveDates(v, ["createdAt", "updatedAt"]) as never,
      ),
    });
  } else if (products.length) {
    // Legacy backups: synthesize default variants from product mirrors
    for (const p of asRows(products)) {
      await prisma.productVariant.create({
        data: {
          productId: String(p.id),
          sku: String(p.sku ?? `SKU-${String(p.id).slice(-6)}`),
          nameEn: "",
          nameZh: "",
          price: Number(p.price ?? 0),
          compareAtPrice:
            p.compareAtPrice == null ? null : Number(p.compareAtPrice),
          stock: Number(p.stock ?? 0),
          active: true,
          isDefault: true,
          sortOrder: 0,
        },
      });
    }
  }
  if (passwordResetTokens.length) {
    await prisma.passwordResetToken.createMany({
      data: asRows(passwordResetTokens).map((t) =>
        reviveDates(t, ["expiresAt", "createdAt"]) as never,
      ),
    });
  }
  if (productDownloads.length) {
    await prisma.productDownload.createMany({
      data: asRows(productDownloads).map((d) =>
        reviveDates(d, ["createdAt", "updatedAt"]) as never,
      ),
    });
  }
  if (orders.length) {
    await prisma.order.createMany({
      data: asRows(orders).map((o) =>
        reviveDates(o, ["createdAt", "updatedAt"]) as never,
      ),
    });
  }
  if (wishlistItems.length) {
    await prisma.wishlistItem.createMany({
      data: asRows(wishlistItems).map((w) =>
        reviveDates(w, ["createdAt"]) as never,
      ),
    });
  }
  if (reviews.length) {
    await prisma.review.createMany({
      data: asRows(reviews).map((r) => reviveDates(r, ["createdAt"]) as never),
    });
  }

  return {
    users: users.length,
    categories: categories.length,
    products: products.length,
    orders: orders.length,
    productDownloads: productDownloads.length,
  };
}

/**
 * Sync catalog only: categories + products + product downloads.
 * Keeps online orders / customers intact.
 */
export async function upsertCatalogFromBackup(backup: DbBackupPayload) {
  const categories = asRows(backup.data.categories);
  const products = asRows(backup.data.products);
  const downloads = asRows(backup.data.productDownloads);

  let categoryUpserts = 0;
  for (const raw of categories) {
    const row = reviveDates(raw, ["createdAt", "updatedAt"]);
    const key = String(row.key ?? "");
    if (!key) continue;

    const data = {
      key,
      nameEn: String(row.nameEn ?? ""),
      nameZh: String(row.nameZh ?? ""),
      sortOrder: Number(row.sortOrder ?? 0),
      active: row.active !== false,
    };

    await prisma.category.upsert({
      where: { key },
      create: {
        id: typeof row.id === "string" ? row.id : undefined,
        ...data,
        createdAt:
          row.createdAt instanceof Date ? row.createdAt : undefined,
        updatedAt:
          row.updatedAt instanceof Date ? row.updatedAt : undefined,
      },
      update: data,
    });
    categoryUpserts += 1;
  }

  let productUpserts = 0;
  const syncedProductIds: string[] = [];
  /** backup product id → online product id */
  const backupIdToOnlineId = new Map<string, string>();

  for (const raw of products) {
    const row = reviveDates(raw, ["createdAt", "updatedAt"]);
    const slug = String(row.slug ?? "");
    if (!slug) continue;

    const fields = {
      slug,
      sku: String(row.sku ?? ""),
      brand: String(row.brand ?? ""),
      nameEn: String(row.nameEn ?? ""),
      nameZh: String(row.nameZh ?? ""),
      shortDescEn: String(row.shortDescEn ?? ""),
      shortDescZh: String(row.shortDescZh ?? ""),
      descriptionEn: String(row.descriptionEn ?? ""),
      descriptionZh: String(row.descriptionZh ?? ""),
      categoryEn: String(row.categoryEn ?? ""),
      categoryZh: String(row.categoryZh ?? ""),
      categoryKey: String(row.categoryKey ?? "fixtures"),
      price: Number(row.price ?? 0),
      compareAtPrice:
        row.compareAtPrice == null ? null : Number(row.compareAtPrice),
      image: String(row.image ?? ""),
      images: String(row.images ?? "[]"),
      specsEn: String(row.specsEn ?? "[]"),
      specsZh: String(row.specsZh ?? "[]"),
      highlightsEn: String(row.highlightsEn ?? "[]"),
      highlightsZh: String(row.highlightsZh ?? "[]"),
      stock: Number(row.stock ?? 0),
      featured: Boolean(row.featured),
      requiresFreight: Boolean(row.requiresFreight),
      autoDeliver: Boolean(row.autoDeliver),
      active: row.active !== false,
      warranty: String(row.warranty ?? ""),
    };

    let onlineId = "";
    const existingBySlug = await prisma.product.findUnique({ where: { slug } });
    if (existingBySlug) {
      await prisma.product.update({
        where: { id: existingBySlug.id },
        data: fields,
      });
      onlineId = existingBySlug.id;
    } else if (typeof row.id === "string") {
      const existingById = await prisma.product.findUnique({
        where: { id: row.id },
      });
      if (existingById) {
        await prisma.product.update({ where: { id: row.id }, data: fields });
        onlineId = row.id;
      } else {
        await prisma.product.create({
          data: {
            id: row.id,
            ...fields,
          },
        });
        onlineId = row.id;
      }
    } else {
      const created = await prisma.product.create({ data: fields });
      onlineId = created.id;
    }
    syncedProductIds.push(onlineId);
    if (typeof row.id === "string") {
      backupIdToOnlineId.set(row.id, onlineId);
    }
    productUpserts += 1;
  }

  // Sync variants for catalog products
  const variants = asRows(backup.data.productVariants);
  let variantUpserts = 0;
  if (syncedProductIds.length) {
    await prisma.productVariant.deleteMany({
      where: { productId: { in: syncedProductIds } },
    });

    if (variants.length) {
      for (const raw of variants) {
        const row = reviveDates(raw, ["createdAt", "updatedAt"]);
        const oldProductId = String(row.productId ?? "");
        const onlineProductId =
          backupIdToOnlineId.get(oldProductId) ??
          (syncedProductIds.includes(oldProductId) ? oldProductId : undefined);
        if (!onlineProductId) continue;

        await prisma.productVariant.create({
          data: {
            id: typeof row.id === "string" ? row.id : undefined,
            productId: onlineProductId,
            sku: String(row.sku ?? ""),
            nameEn: String(row.nameEn ?? ""),
            nameZh: String(row.nameZh ?? ""),
            price: Number(row.price ?? 0),
            compareAtPrice:
              row.compareAtPrice == null ? null : Number(row.compareAtPrice),
            stock: Number(row.stock ?? 0),
            sortOrder: Number(row.sortOrder ?? 0),
            active: row.active !== false,
            isDefault: Boolean(row.isDefault),
          },
        });
        variantUpserts += 1;
      }
    } else {
      for (const raw of products) {
        const oldId = typeof raw.id === "string" ? raw.id : "";
        const onlineId = oldId ? backupIdToOnlineId.get(oldId) : undefined;
        if (!onlineId) continue;
        await prisma.productVariant.create({
          data: {
            productId: onlineId,
            sku: String(raw.sku ?? `SKU-${onlineId.slice(-6)}`),
            nameEn: "",
            nameZh: "",
            price: Number(raw.price ?? 0),
            compareAtPrice:
              raw.compareAtPrice == null ? null : Number(raw.compareAtPrice),
            stock: Number(raw.stock ?? 0),
            active: true,
            isDefault: true,
            sortOrder: 0,
          },
        });
        variantUpserts += 1;
      }
    }
  }

  // Replace downloads for synced products (map old productId → new if needed via slug map)
  const localIdToSlug = new Map(
    products
      .filter((p) => typeof p.id === "string" && typeof p.slug === "string")
      .map((p) => [String(p.id), String(p.slug)]),
  );
  const slugToOnlineId = new Map<string, string>();
  for (const id of syncedProductIds) {
    const p = await prisma.product.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (p) slugToOnlineId.set(p.slug, p.id);
  }

  let downloadUpserts = 0;
  if (syncedProductIds.length) {
    await prisma.productDownload.deleteMany({
      where: { productId: { in: syncedProductIds } },
    });

    for (const raw of downloads) {
      const row = reviveDates(raw, ["createdAt", "updatedAt"]);
      const oldProductId = String(row.productId ?? "");
      const slug = localIdToSlug.get(oldProductId);
      const onlineProductId = slug
        ? slugToOnlineId.get(slug)
        : syncedProductIds.includes(oldProductId)
          ? oldProductId
          : backupIdToOnlineId.get(oldProductId);
      if (!onlineProductId) continue;

      await prisma.productDownload.create({
        data: {
          id: typeof row.id === "string" ? row.id : undefined,
          productId: onlineProductId,
          type: String(row.type ?? "file"),
          version: String(row.version ?? ""),
          titleEn: String(row.titleEn ?? ""),
          titleZh: String(row.titleZh ?? ""),
          notesEn: String(row.notesEn ?? ""),
          notesZh: String(row.notesZh ?? ""),
          fileUrl: String(row.fileUrl ?? ""),
          fileName: String(row.fileName ?? ""),
          fileSize: Number(row.fileSize ?? 0),
          isLatest: Boolean(row.isLatest),
        },
      });
      downloadUpserts += 1;
    }
  }

  return {
    categories: categoryUpserts,
    products: productUpserts,
    productVariants: variantUpserts,
    productDownloads: downloadUpserts,
  };
}
