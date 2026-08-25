import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutPanel } from "@/components/CheckoutPanel";
import { listUserAddresses } from "@/lib/user-addresses";
import { getCurrentUser } from "@/lib/user-auth";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("title") };
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  const user = await getCurrentUser();
  const savedAddresses = user ? await listUserAddresses(user.id) : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-zinc-50">{t("title")}</h1>
      <p className="mt-2 text-zinc-400">{t("subtitle")}</p>
      <div className="mt-8">
        <CheckoutPanel
          initialEmail={user?.email}
          initialName={user?.name}
          savedAddresses={savedAddresses}
        />
      </div>
    </div>
  );
}
