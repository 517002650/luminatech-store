import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/user-auth";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirect?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: `${t("register")} | LuminaTech` };
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { redirect: redirectTo } = await searchParams;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (user) redirect(redirectTo ?? "/account/orders");

  const t = await getTranslations("auth");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">{t("register")}</h1>
        <p className="mt-2 text-sm text-stone-500">{t("registerSubtitle")}</p>
        <div className="mt-8">
          <RegisterForm redirect={redirectTo ?? "/account/orders"} />
        </div>
      </div>
    </div>
  );
}
