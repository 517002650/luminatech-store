import { AdminShell } from "@/components/admin/AdminShell";
import { ShippingSettingsForm } from "@/components/admin/ShippingSettingsForm";
import { requirePermission } from "@/lib/admin-auth";
import { getShippingSettings } from "@/lib/shipping-settings";

export default async function AdminShippingPage() {
  const admin = await requirePermission("shipping");
  const settings = await getShippingSettings();

  return (
    <AdminShell
      title="运费设置"
      subtitle="配置包邮门槛与各国运费，保存后前台结算页立即生效"
      admin={admin}
    >
      <ShippingSettingsForm settings={settings} />
    </AdminShell>
  );
}
