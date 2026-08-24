import { getTranslations, setRequestLocale } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: `${t("forgotPassword")} | LuminaTech` };
}

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">{t("forgotPassword")}</h1>
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
