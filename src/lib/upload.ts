import { v2 as cloudinary } from "cloudinary";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

async function uploadToCloudinary(file: File, buffer: Buffer) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(base64, {
    folder: "luminatech/products",
    resource_type: "image",
  });

  return result.secure_url;
}

async function uploadToLocal(file: File, buffer: Buffer) {
  const ext = ALLOWED_TYPES.get(file.type)!;
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

export function getUploadMode() {
  return isCloudinaryConfigured() ? "cloudinary" : "local";
}

export async function saveUploadedImage(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("仅支持 JPG、PNG、WebP、GIF 格式");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("图片大小不能超过 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(file, buffer);
  }

  return uploadToLocal(file, buffer);
}
