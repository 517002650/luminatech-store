import { v2 as cloudinary } from "cloudinary";
import { readFile } from "fs/promises";
import path from "path";

type CloudinaryRef = {
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

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function parseCloudinaryUrl(url: string): CloudinaryRef | null {
  const match = url.match(
    /res\.cloudinary\.com\/[^/]+\/(raw|image|video)\/(upload|authenticated|private)\/(?:v\d+\/)?(.+)$/i,
  );
  if (!match) return null;

  return {
    resourceType: match[1] as CloudinaryRef["resourceType"],
    deliveryType: match[2] as CloudinaryRef["deliveryType"],
    publicId: decodeURIComponent(match[3]),
  };
}

function buildSignedCloudinaryUrl(ref: CloudinaryRef, deliveryType: CloudinaryRef["deliveryType"]) {
  configureCloudinary();
  return cloudinary.url(ref.publicId, {
    resource_type: ref.resourceType,
    type: deliveryType,
    sign_url: true,
    secure: true,
  });
}

function candidateCloudinaryUrls(ref: CloudinaryRef) {
  const types: CloudinaryRef["deliveryType"][] = [
    ref.deliveryType,
    "authenticated",
    "upload",
    "private",
  ];
  return [...new Set(types)].map((type) => buildSignedCloudinaryUrl(ref, type));
}

export function buildContentDisposition(fileName: string) {
  const safeAscii = fileName.replace(/[^\x20-\x7E]/g, "_") || "download";
  return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/** Fetch purchaser asset bytes (Cloudinary signed URL or local public file). */
export async function fetchAssetResponse(fileUrl: string) {
  if (fileUrl.startsWith("http")) {
    const ref = parseCloudinaryUrl(fileUrl);
    if (ref && isCloudinaryConfigured()) {
      for (const url of candidateCloudinaryUrls(ref)) {
        const res = await fetch(url);
        if (res.ok) return res;
      }
      throw new Error("cloudinary_fetch_failed");
    }

    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error("remote_fetch_failed");
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
