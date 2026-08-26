import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/AccountNav";
import { ProfileSettingsPanel } from "@/components/account/ProfileSettingsPanel";
import { getCurrentUser } from "@/lib/user-auth";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function AccountProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login?redirect=/account/profile`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-zinc-50">{t("myAccount")}</h1>
      <div className="mt-6">
        <AccountNav />
      </div>
      <h2 className="mt-8 text-xl font-semibold text-zinc-100">{t("profile")}</h2>
      <p className="mt-1 text-sm text-zinc-400">{t("profilePageHint")}</p>
      <div className="mt-6">
        <ProfileSettingsPanel email={user.email} name={user.name} />
      </div>
    </div>
  );
}
