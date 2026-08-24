import { Mail, Clock, MapPin } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContentPage } from "@/components/ContentPage";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: Locale }> };

const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "support@luminatech.com";

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.contact" });
  return { title: `${t("title")} | LuminaTech` };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.contact");

  const sections = [
    { title: t("section1Title"), body: t("section1Body") },
    { title: t("section2Title"), body: t("section2Body") },
  ];

  return (
    <ContentPage title={t("title")} subtitle={t("subtitle")} sections={sections}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <Mail className="h-5 w-5 text-amber-600" />
          <p className="mt-3 text-sm font-medium text-stone-900">{t("emailLabel")}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-1 block text-sm text-amber-600 hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <Clock className="h-5 w-5 text-amber-600" />
          <p className="mt-3 text-sm font-medium text-stone-900">{t("hoursLabel")}</p>
          <p className="mt-1 text-sm text-stone-600">{t("hoursValue")}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <MapPin className="h-5 w-5 text-amber-600" />
          <p className="mt-3 text-sm font-medium text-stone-900">{t("regionLabel")}</p>
          <p className="mt-1 text-sm text-stone-600">{t("regionValue")}</p>
        </div>
      </div>
    </ContentPage>
  );
}
