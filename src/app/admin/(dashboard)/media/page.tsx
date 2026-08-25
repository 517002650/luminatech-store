import { AdminShell } from "@/components/admin/AdminShell";
import { OrphanMediaPanel } from "@/components/admin/OrphanMediaPanel";

export default function AdminMediaPage() {
  return (
    <AdminShell
      title="媒体清理"
      subtitle="扫描并删除未被商品 / 附件引用的 Cloudinary 图片与固件文件"
    >
      <OrphanMediaPanel />
    </AdminShell>
  );
}
