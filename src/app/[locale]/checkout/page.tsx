import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutPanel } from "@/components/CheckoutPanel";
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-stone-900">{t("title")}</h1>
      <p className="mt-2 text-stone-500">{t("subtitle")}</p>
      <div className="mt-8">
        <CheckoutPanel initialEmail={user?.email} initialName={user?.name} />
      </div>
    </div>
  );
}
