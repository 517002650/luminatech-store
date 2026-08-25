"use client";

import { useActionState } from "react";
import { registerAsAffiliateAction } from "@/app/actions/user";
import { AffiliateCodeField } from "@/components/admin/AffiliateCodeField";

type Props = {
  defaultName: string;
  defaultEmail: string;
  defaultRate: number;
  contact: {
    email: string;
    phone: string;
    wechat: string;
    note: string;
  };
  labels: {
    title: string;
    subtitle: string;
    name: string;
    code: string;
    submit: string;
    submitting: string;
    rateHint: string;
    contactTitle: string;
    contactBody: string;
    email: string;
    phone: string;
    wechat: string;
    note: string;
  };
};

export function AffiliateRegisterPanel({
  defaultName,
  defaultEmail,
  defaultRate,
  contact,
  labels,
}: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await registerAsAffiliateAction(formData)) ?? null;
    },
    null,
  );

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border-2 border-cyan-400/40 bg-gradient-to-br from-cyan-500/10 via-zinc-900 to-violet-600/20 shadow-[0_0_40px_-12px_rgba(34,211,238,0.45)]">
      <div className="border-b border-cyan-400/20 bg-cyan-500/10 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Partner
        </p>
        <h2 className="mt-1 text-2xl font-bold text-zinc-50">{labels.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300">
          {labels.subtitle}
        </p>
        <p className="mt-2 text-sm font-medium text-amber-200/90">
          {labels.rateHint.replace("{rate}", String(defaultRate))}
        </p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <form action={formAction} className="space-y-4">
          {state?.error ? (
            <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">
              {state.error}
            </div>
          ) : null}
          <div>
            <label className="text-sm font-medium text-zinc-200">{labels.name}</label>
            <input
              name="name"
              required
              defaultValue={defaultName}
              className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <AffiliateCodeField dark />
          <input type="hidden" name="email" value={defaultEmail} />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-900/40 transition hover:from-cyan-400 hover:to-violet-400 disabled:opacity-60"
          >
            {pending ? labels.submitting : labels.submit}
          </button>
        </form>

        <aside className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5">
          <h3 className="text-base font-bold text-amber-100">{labels.contactTitle}</h3>
          <p className="mt-2 text-sm leading-relaxed text-amber-50/80">
            {labels.contactBody}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-amber-200/70">{labels.email}</dt>
              <dd>
                <a
                  href={`mailto:${contact.email}?subject=${encodeURIComponent("推广员提成咨询")}`}
                  className="font-semibold text-cyan-300 underline-offset-2 hover:underline"
                >
                  {contact.email}
                </a>
              </dd>
            </div>
            {contact.phone ? (
              <div>
                <dt className="text-amber-200/70">{labels.phone}</dt>
                <dd className="font-medium text-zinc-100">{contact.phone}</dd>
              </div>
            ) : null}
            {contact.wechat ? (
              <div>
                <dt className="text-amber-200/70">{labels.wechat}</dt>
                <dd className="font-medium text-zinc-100">{contact.wechat}</dd>
              </div>
            ) : null}
            {contact.note ? (
              <div>
                <dt className="text-amber-200/70">{labels.note}</dt>
                <dd className="whitespace-pre-wrap text-zinc-200">{contact.note}</dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </div>
    </div>
  );
}
