import { AdminShell } from "@/components/admin/AdminShell";
import { ShippingSettingsForm } from "@/components/admin/ShippingSettingsForm";
import { getShippingSettings } from "@/lib/shipping-settings";

export default async function AdminShippingPage() {
  const settings = await getShippingSettings();

  return (
    <AdminShell
      title="运费设置"
      subtitle="配置包邮门槛与各国运费，保存后前台结算页立即生效"
    >
      <ShippingSettingsForm settings={settings} />
    </AdminShell>
  );
}
