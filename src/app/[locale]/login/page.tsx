import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/user-auth";
import { lightAuthCardClass } from "@/lib/form-styles";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirect?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: `${t("login")} | Stagevio` };
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { redirect: redirectTo } = await searchParams;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (user) redirect(redirectTo ?? "/account/orders");

  const t = await getTranslations("auth");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-12">
      <div className={lightAuthCardClass}>
        <h1 className="text-2xl font-bold">{t("login")}</h1>
        <p className="mt-2 text-sm text-stone-500">{t("loginSubtitle")}</p>
        <div className="mt-8">
          <LoginForm redirect={redirectTo ?? "/account/orders"} />
        </div>
      </div>
    </div>
  );
}
