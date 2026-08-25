import { v2 as cloudinary } from "cloudinary";
import { readFile, unlink } from "fs/promises";
import path from "path";

type CloudinaryRef = {
  cloudName: string;
  resourceType: "raw" | "image" | "video";
  deliveryType: "upload" | "authenticated" | "private";
  publicId: string;
};

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function configureCloudinary(cloudName?: string) {
  cloudinary.config({
    cloud_name: cloudName ?? process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function parseCloudinaryUrl(url: string): CloudinaryRef | null {
  const match = url.match(
    /res\.cloudinary\.com\/([^/]+)\/(raw|image|video)\/(upload|authenticated|private)\/(?:v\d+\/)?(.+)$/i,
  );
  if (!match) return null;

  return {
    cloudName: match[1],
    resourceType: match[2] as CloudinaryRef["resourceType"],
    deliveryType: match[3] as CloudinaryRef["deliveryType"],
    publicId: decodeURIComponent(match[4]),
  };
}

function assertCloudinaryAccount(ref: CloudinaryRef) {
  const configured = process.env.CLOUDINARY_CLOUD_NAME;
  if (configured && ref.cloudName !== configured) {
    throw new Error(
      `cloudinary_account_mismatch:url=${ref.cloudName},env=${configured}`,
    );
  }
}

async function resolveCloudinaryResource(ref: CloudinaryRef) {
  configureCloudinary(ref.cloudName);
  return { deliveryType: ref.deliveryType, publicId: ref.publicId };
}

function buildSignedCloudinaryUrls(
  ref: CloudinaryRef,
  deliveryType: CloudinaryRef["deliveryType"],
  publicId: string,
) {
  configureCloudinary(ref.cloudName);
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const urls: string[] = [];

  // Raw uploads keep extension in public_id (e.g. "..._.zip"). Empty format works reliably.
  urls.push(
    cloudinary.utils.private_download_url(publicId, "", {
      resource_type: ref.resourceType,
      type: deliveryType,
      expires_at: expiresAt,
    }),
  );

  urls.push(
    cloudinary.url(publicId, {
      resource_type: ref.resourceType,
      type: deliveryType,
      sign_url: true,
      secure: true,
      flags: "attachment",
    }),
  );

  urls.push(
    cloudinary.url(publicId, {
      resource_type: ref.resourceType,
      type: deliveryType,
      sign_url: true,
      secure: true,
    }),
  );

  return [...new Set(urls)];
}

export function buildContentDisposition(fileName: string) {
  const safeAscii = fileName.replace(/[^\x20-\x7E]/g, "_") || "download";
  return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/**
 * Best-effort delete for Cloudinary raw/image URLs or local /downloads|/uploads paths.
 * Returns deleted=false when URL is external, misconfigured, or already gone.
 */
export async function deleteStoredAsset(fileUrl: string): Promise<{
  deleted: boolean;
  reason?: string;
}> {
  const url = fileUrl.trim();
  if (!url) return { deleted: false, reason: "empty" };

  if (url.startsWith("http")) {
    const ref = parseCloudinaryUrl(url);
    if (!ref) return { deleted: false, reason: "not_cloudinary" };
    if (!isCloudinaryConfigured()) return { deleted: false, reason: "not_configured" };

    try {
      assertCloudinaryAccount(ref);
      configureCloudinary(ref.cloudName);
      const result = await cloudinary.uploader.destroy(ref.publicId, {
        resource_type: ref.resourceType,
        type: ref.deliveryType,
        invalidate: true,
      });
      const status = String(result?.result ?? "");
      return {
        deleted: status === "ok" || status === "not found",
        reason: status || "unknown",
      };
    } catch (err) {
      return {
        deleted: false,
        reason: err instanceof Error ? err.message : "destroy_failed",
      };
    }
  }

  if (url.startsWith("/downloads/") || url.startsWith("/uploads/")) {
    try {
      const relative = url.replace(/^\//, "");
      await unlink(path.join(process.cwd(), "public", relative));
      return { deleted: true };
    } catch {
      return { deleted: false, reason: "local_missing" };
    }
  }

  return { deleted: false, reason: "unsupported" };
}

/** Fetch asset bytes (Cloudinary signed URL or local public file). */
export async function fetchAssetResponse(fileUrl: string) {
  if (fileUrl.startsWith("http")) {
    const ref = parseCloudinaryUrl(fileUrl);
    if (ref && isCloudinaryConfigured()) {
      assertCloudinaryAccount(ref);
      const resolved = await resolveCloudinaryResource(ref);
      const candidates = buildSignedCloudinaryUrls(
        ref,
        resolved.deliveryType,
        resolved.publicId,
      );

      let lastStatus = 0;
      let lastError = "";
      for (const url of candidates) {
        try {
          const res = await fetch(url);
          lastStatus = res.status;
          if (res.ok) return res;
        } catch (err) {
          lastError = err instanceof Error ? err.message : "fetch_failed";
        }
      }

      throw new Error(
        lastError
          ? `cloudinary_fetch_failed:${lastError}`
          : `cloudinary_fetch_failed:${lastStatus}`,
      );
    }

    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`remote_fetch_failed:${res.status}`);
    return res;
  }

  const relative = fileUrl.replace(/^\//, "");
  const filePath = path.join(process.cwd(), "public", relative);
  const buffer = await readFile(filePath);
  return new Response(buffer, {
    status: 200,
    headers: { "Content-Type": "application/octet-stream" },
  });
}
