import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { parseCloudinaryUrl } from "@/lib/asset-delivery";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const hasCreds = Boolean(
    cloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
  );

  let pingOk = false;
  let pingError = "";
  if (hasCreds) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    try {
      const ping = await cloudinary.api.ping();
      pingOk = ping?.status === "ok";
    } catch (err) {
      pingError = err instanceof Error ? err.message : "ping_failed";
    }
  }

  const sample = await prisma.productDownload.findFirst({
    orderBy: { createdAt: "desc" },
    select: { fileUrl: true },
  });
  const parsed = sample?.fileUrl ? parseCloudinaryUrl(sample.fileUrl) : null;
  const fileCloud = parsed?.cloudName ?? null;
  const cloudMatch = Boolean(fileCloud && fileCloud === cloudName);

  return NextResponse.json({
    configured: hasCreds,
    pingOk,
    pingError: pingOk ? null : pingError || "not_configured",
    envCloudName: cloudName || null,
    sampleFileCloud: fileCloud,
    cloudMatch,
    ok: hasCreds && pingOk && (!fileCloud || cloudMatch),
    hint:
      !hasCreds
        ? "请在 Vercel 配置 CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET"
        : !pingOk
          ? "Cloudinary 密钥无效（常见：仍是占位符 your_cloud_name）。请到 console.cloudinary.com 复制真实密钥并 Redeploy"
          : fileCloud && !cloudMatch
            ? `文件在 ${fileCloud} 账号，但 Vercel 配置的是 ${cloudName}。请统一为同一 Cloudinary 账号，或在后台重新上传附件`
            : null,
  });
}
