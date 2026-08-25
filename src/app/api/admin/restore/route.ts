import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminWithPermission } from "@/lib/admin-auth";
import {
  parseBackupJson,
  restoreFullBackup,
  upsertCatalogFromBackup,
} from "@/lib/db-restore";

/**
 * Upload a backup JSON and either:
 * - mode=catalog: sync categories/products/downloads (keeps orders)
 * - mode=full: wipe & restore everything (requires confirm=确认恢复)
 */
export async function POST(req: NextRequest) {
  if (!(await getAdminWithPermission("backup"))) {
    return NextResponse.json({ error: "未登录后台或无备份权限" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const mode = String(form.get("mode") ?? "catalog");
    const confirm = String(form.get("confirm") ?? "").trim();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择备份文件" }, { status: 400 });
    }
    if (file.size > 80 * 1024 * 1024) {
      return NextResponse.json({ error: "文件过大（最大 80MB）" }, { status: 400 });
    }

    const text = await file.text();
    const backup = parseBackupJson(text);

    if (mode === "full") {
      if (confirm !== "确认恢复") {
        return NextResponse.json(
          { error: "完整恢复请在确认框输入：确认恢复" },
          { status: 400 },
        );
      }
      const result = await restoreFullBackup(backup);
      revalidateAll();
      return NextResponse.json({
        success: true,
        mode: "full",
        result,
        message: "已完整恢复数据库（含订单/用户）",
      });
    }

    if (mode !== "catalog") {
      return NextResponse.json({ error: "未知同步模式" }, { status: 400 });
    }

    const result = await upsertCatalogFromBackup(backup);
    revalidateAll();
    return NextResponse.json({
      success: true,
      mode: "catalog",
      result,
      message: `已同步商品 ${result.products}、分类 ${result.categories}、附件 ${result.productDownloads}（线上订单已保留）`,
    });
  } catch (err) {
    console.error("Admin restore failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "同步失败" },
      { status: 500 },
    );
  }
}

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/backup");
  revalidatePath("/en");
  revalidatePath("/zh");
  revalidatePath("/en/products");
  revalidatePath("/zh/products");
}
