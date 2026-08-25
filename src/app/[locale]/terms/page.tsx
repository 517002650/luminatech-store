import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContentPage } from "@/components/ContentPage";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.terms" });
  return { title: `${t("title")} | LuminaTech` };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.terms");

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
