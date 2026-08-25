import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/db";
import { parseCloudinaryUrl } from "@/lib/asset-delivery";

export type OrphanMediaItem = {
  publicId: string;
  resourceType: "image" | "raw" | "video";
  folder: "products" | "downloads";
  url: string;
  bytes: number;
  format: string | null;
  createdAt: string | null;
};

export type OrphanScanResult = {
  ok: true;
  referencedCount: number;
  scannedCount: number;
  orphans: OrphanMediaItem[];
  includeOrders: boolean;
};

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function addUrl(set: Set<string>, value: unknown) {
  if (typeof value !== "string") return;
  const trimmed = value.trim();
  if (!trimmed) return;
  set.add(trimmed);

  const ref = parseCloudinaryUrl(trimmed);
  if (ref) {
    set.add(ref.publicId);
    // Images sometimes referenced with/without extension in different tools
    const noExt = ref.publicId.replace(/\.[a-z0-9]+$/i, "");
    if (noExt !== ref.publicId) set.add(noExt);
  }
}

function extractUrlsFromText(text: string, set: Set<string>) {
  if (!text) return;

  for (const match of text.matchAll(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/g)) {
    addUrl(set, match[1]);
  }
  for (const match of text.matchAll(/https?:\/\/res\.cloudinary\.com\/[^\s"'<>)]+/gi)) {
    addUrl(set, match[0].replace(/[.,;]+$/, ""));
  }
}

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Collect Cloudinary public_ids / URLs still referenced by the shop DB. */
export async function collectReferencedMediaKeys(options?: {
  includeOrders?: boolean;
}): Promise<Set<string>> {
  const includeOrders = options?.includeOrders !== false;
  const keys = new Set<string>();

  const products = await prisma.product.findMany({
    select: {
      image: true,
      images: true,
      descriptionEn: true,
      descriptionZh: true,
    },
  });

  for (const product of products) {
    addUrl(keys, product.image);
    for (const src of parseJsonArray(product.images)) addUrl(keys, src);
    extractUrlsFromText(product.descriptionEn, keys);
    extractUrlsFromText(product.descriptionZh, keys);
  }

  const downloads = await prisma.productDownload.findMany({
    select: { fileUrl: true },
  });
  for (const row of downloads) addUrl(keys, row.fileUrl);

  if (includeOrders) {
    const orders = await prisma.order.findMany({ select: { items: true } });
    for (const order of orders) {
      try {
        const items = JSON.parse(order.items || "[]") as unknown;
        if (!Array.isArray(items)) continue;
        for (const item of items) {
          if (item && typeof item === "object" && "image" in item) {
            addUrl(keys, (item as { image?: unknown }).image);
          }
        }
      } catch {
        // ignore bad order JSON
      }
    }
  }

  return keys;
}

type CloudinaryResource = {
  public_id: string;
  secure_url?: string;
  url?: string;
  bytes?: number;
  format?: string;
  created_at?: string;
  resource_type?: string;
};

async function listCloudinaryPrefix(
  resourceType: "image" | "raw",
  prefix: string,
): Promise<CloudinaryResource[]> {
  configureCloudinary();
  const all: CloudinaryResource[] = [];
  let nextCursor: string | undefined;

  do {
    const page = (await cloudinary.api.resources({
      type: "upload",
      resource_type: resourceType,
      prefix,
      max_results: 500,
      next_cursor: nextCursor,
    })) as {
      resources?: CloudinaryResource[];
      next_cursor?: string;
    };

    all.push(...(page.resources ?? []));
    nextCursor = page.next_cursor;
  } while (nextCursor);

  return all;
}

function isReferenced(resource: CloudinaryResource, keys: Set<string>) {
  const url = resource.secure_url || resource.url || "";
  if (url && keys.has(url)) return true;
  if (keys.has(resource.public_id)) return true;
  const noExt = resource.public_id.replace(/\.[a-z0-9]+$/i, "");
  if (noExt !== resource.public_id && keys.has(noExt)) return true;
  return false;
}

export async function scanOrphanMedia(options?: {
  includeOrders?: boolean;
}): Promise<OrphanScanResult | { ok: false; error: string }> {
  if (!isCloudinaryConfigured()) {
    return {
      ok: false,
      error: "未配置 Cloudinary。请先在 Vercel 设置 CLOUDINARY_* 环境变量。",
    };
  }

  const includeOrders = options?.includeOrders !== false;
  const keys = await collectReferencedMediaKeys({ includeOrders });

  const [productImages, downloadFiles, legacyProductImages, legacyDownloadFiles] =
    await Promise.all([
      listCloudinaryPrefix("image", "stagevio/products"),
      listCloudinaryPrefix("raw", "stagevio/downloads"),
      listCloudinaryPrefix("image", "luminatech/products"),
      listCloudinaryPrefix("raw", "luminatech/downloads"),
    ]);

  const allProductImages = [...productImages, ...legacyProductImages];
  const allDownloadFiles = [...downloadFiles, ...legacyDownloadFiles];

  const orphans: OrphanMediaItem[] = [];

  for (const resource of allProductImages) {
    if (isReferenced(resource, keys)) continue;
    orphans.push({
      publicId: resource.public_id,
      resourceType: "image",
      folder: "products",
      url: resource.secure_url || resource.url || "",
      bytes: resource.bytes ?? 0,
      format: resource.format ?? null,
      createdAt: resource.created_at ?? null,
    });
  }

  for (const resource of allDownloadFiles) {
    if (isReferenced(resource, keys)) continue;
    orphans.push({
      publicId: resource.public_id,
      resourceType: "raw",
      folder: "downloads",
      url: resource.secure_url || resource.url || "",
      bytes: resource.bytes ?? 0,
      format: resource.format ?? null,
      createdAt: resource.created_at ?? null,
    });
  }

  orphans.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  return {
    ok: true,
    referencedCount: keys.size,
    scannedCount: allProductImages.length + allDownloadFiles.length,
    orphans,
    includeOrders,
  };
}

export async function deleteOrphanMediaItems(
  items: Array<{ publicId: string; resourceType: "image" | "raw" | "video" }>,
) {
  if (!isCloudinaryConfigured()) {
    return { ok: false as const, error: "未配置 Cloudinary" };
  }
  if (items.length === 0) {
    return { ok: false as const, error: "未选择要删除的文件" };
  }
  if (items.length > 100) {
    return { ok: false as const, error: "单次最多删除 100 个文件" };
  }

  configureCloudinary();

  const results: Array<{ publicId: string; deleted: boolean; reason?: string }> = [];

  for (const item of items) {
    // Safety: only allow our shop folders
    if (
      !item.publicId.startsWith("stagevio/products/") &&
      !item.publicId.startsWith("stagevio/downloads/") &&
      !item.publicId.startsWith("luminatech/products/") &&
      !item.publicId.startsWith("luminatech/downloads/")
    ) {
      results.push({
        publicId: item.publicId,
        deleted: false,
        reason: "outside_allowed_folder",
      });
      continue;
    }

    try {
      const result = await cloudinary.uploader.destroy(item.publicId, {
        resource_type: item.resourceType,
        type: "upload",
        invalidate: true,
      });
      const status = String(result?.result ?? "");
      results.push({
        publicId: item.publicId,
        deleted: status === "ok" || status === "not found",
        reason: status || "unknown",
      });
    } catch (err) {
      results.push({
        publicId: item.publicId,
        deleted: false,
        reason: err instanceof Error ? err.message : "destroy_failed",
      });
    }
  }

  const deleted = results.filter((r) => r.deleted).length;
  return { ok: true as const, deleted, results };
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
