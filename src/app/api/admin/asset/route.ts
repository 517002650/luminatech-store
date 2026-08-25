import { NextRequest, NextResponse } from "next/server";
import {
  buildContentDisposition,
  fetchAssetResponse,
} from "@/lib/asset-delivery";
import { isAdminAuthenticated } from "@/lib/admin-auth";

/** Admin-only: proxy Cloudinary/local assets (direct URLs often return 401 for zip). */
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const fileUrl = req.nextUrl.searchParams.get("url") ?? "";
  const fileName = req.nextUrl.searchParams.get("name") ?? "download";
  if (!fileUrl) {
    return NextResponse.json({ error: "missing_url" }, { status: 400 });
  }

  try {
    const asset = await fetchAssetResponse(fileUrl);
    const headers = new Headers();
    headers.set(
      "Content-Type",
      asset.headers.get("content-type") ?? "application/octet-stream",
    );
    headers.set("Content-Disposition", buildContentDisposition(fileName));
    headers.set("Cache-Control", "no-store");
    return new NextResponse(asset.body, { status: 200, headers });
  } catch (err) {
    console.error("Admin asset download failed:", fileUrl, err);
    const message = err instanceof Error ? err.message : "download_failed";
    return NextResponse.json(
      {
        error: "download_failed",
        hint:
          message.includes("cloudinary_account_mismatch")
            ? "文件所在 Cloudinary 账号与 Vercel 环境变量不一致，请统一账号或在后台重新上传附件"
            : message.includes("cloudinary_fetch_failed")
              ? "Cloudinary 无法读取文件：请检查 Vercel 的 CLOUDINARY_* 是否为真实密钥（不是占位符），并与文件所在 cloud name 一致"
              : "下载失败，请打开 Cloudinary 控制台核对密钥后 Redeploy",
      },
      { status: 502 },
    );
  }
}
