"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  changeUserPasswordAction,
  updateProfileAction,
} from "@/app/actions/user";
import { lightInputClass, lightPanelClass } from "@/lib/form-styles";

type Props = {
  email: string;
  name: string;
};

type ActionState = {
  error?: string;
  success?: boolean;
  field?: "profile" | "password";
} | null;

function errorMessage(
  t: ReturnType<typeof useTranslations<"account">>,
  code?: string,
) {
  if (!code) return null;
  const map: Record<string, string> = {
    login_required: t("profileErrors.login_required"),
    email_required: t("profileErrors.email_required"),
    email_taken: t("profileErrors.email_taken"),
    current_password_required: t("profileErrors.current_password_required"),
    wrong_password: t("profileErrors.wrong_password"),
    password_mismatch: t("profileErrors.password_mismatch"),
    password_too_short: t("profileErrors.password_too_short"),
    incomplete: t("profileErrors.incomplete"),
  };
  return map[code] ?? code;
}

export function ProfileSettingsPanel({ email, name }: Props) {
  const t = useTranslations("account");
  const router = useRouter();

  const [profileState, profileAction, profilePending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      const result = await updateProfileAction(formData);
      if (result && "error" in result && result.error) {
        return { error: result.error };
      }
      router.refresh();
      return { success: true, field: "profile" as const };
    },
    null,
  );

  const [passwordState, passwordAction, passwordPending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      const result = await changeUserPasswordAction(formData);
      if (result && "error" in result && result.error) {
        return { error: result.error };
      }
      router.refresh();
      return { success: true, field: "password" as const };
    },
    null,
  );

  return (
    <div className="space-y-8">
      <section className={lightPanelClass}>
        <h2 className="text-lg font-semibold text-stone-900">{t("profileTitle")}</h2>
        <p className="mt-1 text-sm text-stone-500">{t("profileHint")}</p>

        {profileState?.success && profileState.field === "profile" ? (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {t("profileSaved")}
          </p>
        ) : null}
        {profileState?.error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage(t, profileState.error)}
          </p>
        ) : null}

        <form action={profileAction} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700">{t("profileName")}</label>
            <input
              name="name"
              type="text"
              defaultValue={name}
              autoComplete="name"
              className={lightInputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">{t("profileEmail")}</label>
            <input
              name="email"
              type="email"
              required
              defaultValue={email}
              autoComplete="email"
              className={lightInputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">
              {t("profileCurrentPassword")}
            </label>
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              placeholder={t("profileCurrentPasswordHint")}
              className={lightInputClass}
            />
            <p className="mt-1 text-xs text-stone-500">{t("profileEmailPasswordNote")}</p>
          </div>
          <button
            type="submit"
            disabled={profilePending}
            className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
          >
            {profilePending ? t("profileSaving") : t("profileSave")}
          </button>
        </form>
      </section>

      <section className={lightPanelClass}>
        <h2 className="text-lg font-semibold text-stone-900">{t("passwordTitle")}</h2>
        <p className="mt-1 text-sm text-stone-500">{t("passwordHint")}</p>

        {passwordState?.success && passwordState.field === "password" ? (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {t("passwordSaved")}
          </p>
        ) : null}
        {passwordState?.error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage(t, passwordState.error)}
          </p>
        ) : null}

        <form action={passwordAction} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700">
              {t("passwordCurrent")}
            </label>
            <input
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className={lightInputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">{t("passwordNew")}</label>
            <input
              name="newPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={lightInputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">
              {t("passwordConfirm")}
            </label>
            <input
              name="newPassword2"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={lightInputClass}
            />
          </div>
          <button
            type="submit"
            disabled={passwordPending}
            className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
          >
            {passwordPending ? t("passwordSaving") : t("passwordSave")}
          </button>
        </form>
      </section>
    </div>
  );
}
