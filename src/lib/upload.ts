import { v2 as cloudinary } from "cloudinary";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_ASSET_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

const ASSET_EXT = new Set([
  ".bin",
  ".hex",
  ".zip",
  ".rar",
  ".7z",
  ".exe",
  ".dll",
  ".dmg",
  ".pkg",
  ".pdf",
  ".txt",
  ".json",
  ".xml",
  ".gdtf",
  ".mvr",
  ".fixture",
  ".fw",
  ".img",
  ".tar",
  ".gz",
]);

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function extFromName(name: string) {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
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
    folder: "stagevio/products",
    resource_type: "image",
  });

  return result.secure_url;
}

async function uploadAssetToCloudinary(file: File, buffer: Buffer) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const base64 = `data:application/octet-stream;base64,${buffer.toString("base64")}`;
  const safeName = file.name.replace(/[^\w.\-]+/g, "_") || "file.bin";
  const result = await cloudinary.uploader.upload(base64, {
    folder: "stagevio/downloads",
    resource_type: "raw",
    type: "upload",
    access_mode: "public",
    public_id: `${Date.now()}-${randomBytes(4).toString("hex")}-${safeName}`,
  });

  return result.secure_url;
}

async function uploadToLocal(
  buffer: Buffer,
  ext: string,
  subdir = "uploads",
) {
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", subdir);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/${subdir}/${filename}`;
}

export function getUploadMode() {
  return isCloudinaryConfigured() ? "cloudinary" : "local";
}

export async function saveUploadedImage(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("仅支持 JPG、PNG、WebP、GIF 格式");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("图片大小不能超过 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(file, buffer);
  }

  return uploadToLocal(buffer, ALLOWED_TYPES.get(file.type)!);
}

/** Firmware / plugin / document uploads for purchaser downloads. */
export async function saveUploadedAsset(file: File) {
  const ext = extFromName(file.name);
  if (!ext || !ASSET_EXT.has(ext)) {
    throw new Error(
      "不支持的文件类型。允许：bin/hex/zip/rar/7z/exe/dll/pdf/gdtf/mvr/fw 等",
    );
  }

  if (file.size > MAX_ASSET_SIZE) {
    throw new Error("文件大小不能超过 100MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (isCloudinaryConfigured()) {
    return {
      url: await uploadAssetToCloudinary(file, buffer),
      fileName: file.name,
      fileSize: file.size,
    };
  }

  return {
    url: await uploadToLocal(buffer, ext, "downloads"),
    fileName: file.name,
    fileSize: file.size,
  };
}
