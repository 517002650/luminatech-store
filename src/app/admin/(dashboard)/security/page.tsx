import { AdminShell } from "@/components/admin/AdminShell";
import { SecurityPanel } from "@/components/admin/SecurityPanel";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminSecurityPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell
      title="安全设置"
      subtitle="修改密码与可选的两步验证（TOTP）"
      admin={admin}
    >
      <SecurityPanel email={admin.email} totpEnabled={admin.totpEnabled} />
    </AdminShell>
  );
}
