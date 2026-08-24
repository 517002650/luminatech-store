import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: `${t("resetPassword")} | LuminaTech` };
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="text-stone-600">{t("resetErrors.invalid")}</p>
          <Link href="/forgot-password" className="mt-4 inline-block text-amber-600 hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">{t("resetPassword")}</h1>
        <p className="mt-2 text-sm text-stone-500">{t("resetSubtitle")}</p>
        <div className="mt-8">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
