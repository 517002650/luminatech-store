import { AdminShell } from "@/components/admin/AdminShell";
import { OrphanMediaPanel } from "@/components/admin/OrphanMediaPanel";
import { requirePermission } from "@/lib/admin-auth";

export default async function AdminMediaPage() {
  const admin = await requirePermission("media");
  return (
    <AdminShell
      title="媒体清理"
      subtitle="扫描并删除未被商品 / 附件引用的 Cloudinary 图片与固件文件"
      admin={admin}
    >
      <OrphanMediaPanel />
    </AdminShell>
  );
}
