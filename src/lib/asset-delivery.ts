import { v2 as cloudinary } from "cloudinary";
import { readFile } from "fs/promises";
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

/** Split `folder/file.zip` → public id + format for Cloudinary download helpers. */
export function splitPublicIdAndFormat(fullPublicId: string) {
  const dot = fullPublicId.lastIndexOf(".");
  if (dot <= 0 || dot === fullPublicId.length - 1) {
    return { publicId: fullPublicId, format: "" };
  }
  return {
    publicId: fullPublicId.slice(0, dot),
    format: fullPublicId.slice(dot + 1),
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

async function resolveCloudinaryDeliveryType(ref: CloudinaryRef) {
  configureCloudinary(ref.cloudName);
  const { publicId, format } = splitPublicIdAndFormat(ref.publicId);
  const lookupId = format ? publicId : ref.publicId;

  for (const type of [ref.deliveryType, "upload", "authenticated", "private"] as const) {
    try {
      const resource = await cloudinary.api.resource(lookupId, {
        resource_type: ref.resourceType,
        type,
      });
      if (resource?.public_id) {
        return type;
      }
    } catch {
      // try next delivery type
    }
  }

  return ref.deliveryType;
}

function buildSignedCloudinaryUrls(ref: CloudinaryRef, deliveryType: CloudinaryRef["deliveryType"]) {
  configureCloudinary(ref.cloudName);
  const { publicId, format } = splitPublicIdAndFormat(ref.publicId);
  const fmt = format || "bin";
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const urls: string[] = [];

  urls.push(
    cloudinary.utils.private_download_url(publicId, fmt, {
      resource_type: ref.resourceType,
      type: deliveryType,
      expires_at: expiresAt,
      attachment: true,
    }),
  );

  urls.push(
    cloudinary.url(format ? publicId : ref.publicId, {
      resource_type: ref.resourceType,
      type: deliveryType,
      format: fmt,
      sign_url: true,
      secure: true,
      flags: "attachment",
    }),
  );

  urls.push(
    cloudinary.url(format ? publicId : ref.publicId, {
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

/** Fetch asset bytes (Cloudinary signed URL or local public file). */
export async function fetchAssetResponse(fileUrl: string) {
  if (fileUrl.startsWith("http")) {
    const ref = parseCloudinaryUrl(fileUrl);
    if (ref && isCloudinaryConfigured()) {
      assertCloudinaryAccount(ref);
      const deliveryType = await resolveCloudinaryDeliveryType(ref);
      const candidates = buildSignedCloudinaryUrls(ref, deliveryType);

      let lastStatus = 0;
      for (const url of candidates) {
        const res = await fetch(url);
        lastStatus = res.status;
        if (res.ok) return res;
      }

      throw new Error(`cloudinary_fetch_failed:${lastStatus}`);
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
