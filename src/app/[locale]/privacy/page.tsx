import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContentPage } from "@/components/ContentPage";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.privacy" });
  return { title: `${t("title")} | Stagevio` };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.privacy");

  const sections = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
    title: t(`section${i}Title`),
    body: t(`section${i}Body`),
  }));

  return (
    <ContentPage
      title={t("title")}
      subtitle={t("subtitle")}
      sections={sections}
    />
  );
}
