"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setContactHandledAction } from "@/app/admin/actions";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: string;
  handled: boolean;
  createdAt: Date | string;
};

export function ContactInboxTable({ inquiries }: { inquiries: Inquiry[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setHandled(id: string, handled: boolean) {
    startTransition(async () => {
      await setContactHandledAction(id, handled);
      router.refresh();
    });
  }

  if (inquiries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
        暂无留言
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {inquiries.map((item) => (
        <article
          key={item.id}
          className={`rounded-2xl border bg-white p-5 shadow-sm ${
            item.handled ? "border-stone-200 opacity-75" : "border-amber-200"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-stone-500">
                {item.name} ·{" "}
                <a href={`mailto:${item.email}`} className="text-amber-700 hover:underline">
                  {item.email}
                </a>{" "}
                · {item.locale}
              </p>
              <h3 className="mt-1 font-semibold text-stone-900">{item.subject}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
                {item.message}
              </p>
              <p className="mt-2 text-xs text-stone-400">
                {new Date(item.createdAt).toLocaleString("zh-CN")}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => setHandled(item.id, !item.handled)}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              {item.handled ? "标为未处理" : "标为已处理"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
