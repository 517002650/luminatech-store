"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setReviewModerationEnabledAction } from "@/app/admin/actions";

type Props = {
  enabled: boolean;
};

export function ReviewModerationToggle({ enabled }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setReviewModerationEnabledAction(!enabled);
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-stone-900">评价审核开关</h2>
          <p className="mt-1 text-sm text-stone-500">
            {enabled
              ? "当前已开启：已购用户提交后需审核通过才公开展示。"
              : "当前已关闭：已购用户提交后立即公开展示（仍可在下方手动下架）。"}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={toggle}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${
            enabled
              ? "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
              : "bg-stone-900 text-white hover:bg-stone-700"
          }`}
        >
          {pending ? "保存中..." : enabled ? "关闭审核（自由评价）" : "开启审核"}
        </button>
      </div>
    </section>
  );
}
