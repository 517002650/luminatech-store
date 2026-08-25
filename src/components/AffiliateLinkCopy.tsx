"use client";

import { useState } from "react";
import { parseAffiliateLinkForDisplay } from "@/lib/affiliates";

type Labels = {
  title?: string;
  hint?: string;
  copyLink?: string;
  copyCode?: string;
  copied?: string;
  codeLabel?: string;
};

type Props = {
  link: string;
  code?: string;
  variant?: "prominent" | "inline" | "compact";
  labels?: Labels;
};

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fallback below */
    }
  }
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  return ok;
}

const DEFAULT_LABELS: Required<Labels> = {
  title: "推广链接",
  hint: "复制链接发给好友，对方通过链接访问并下单付款后，您可获得提成。",
  copyLink: "一键复制链接",
  copyCode: "复制推广码",
  copied: "已复制到剪贴板",
  codeLabel: "推广码",
};

export function AffiliateLinkCopy({
  link,
  code,
  variant = "inline",
  labels: labelOverrides,
}: Props) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const parsed = parseAffiliateLinkForDisplay(link);
  const displayCode = code ?? parsed.ref;
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  async function handleCopy(text: string, kind: "link" | "code") {
    const ok = await copyText(text);
    if (!ok) return;
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2200);
  }

  if (variant === "compact") {
    return (
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-xs text-stone-600" title={link}>
            {parsed.sitePath}
            {parsed.ref ? (
              <span className="text-amber-700"> ?ref={parsed.ref}</span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleCopy(link, "link")}
          className="shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          title={labels.copyLink}
        >
          {copied === "link" ? "✓" : "复制"}
        </button>
      </div>
    );
  }

  const isProminent = variant === "prominent";
  const shell = isProminent
    ? "rounded-2xl border-2 border-cyan-400/40 bg-gradient-to-br from-cyan-500/15 via-zinc-900 to-violet-600/10 p-5 shadow-[0_0_32px_-10px_rgba(34,211,238,0.35)]"
    : "rounded-xl border border-stone-200 bg-stone-50 p-4";
  const titleClass = isProminent
    ? "text-lg font-bold text-cyan-100"
    : "text-sm font-semibold text-stone-800";
  const hintClass = isProminent
    ? "mt-1 text-sm leading-relaxed text-zinc-300"
    : "mt-1 text-xs text-stone-500";
  const boxClass = isProminent
    ? "mt-4 rounded-xl border border-zinc-700/80 bg-zinc-950/80 p-4"
    : "mt-3 rounded-lg border border-stone-200 bg-white p-3";
  const siteClass = isProminent
    ? "font-mono text-base text-zinc-100"
    : "font-mono text-sm text-stone-800";
  const refClass = isProminent
    ? "mt-2 font-mono text-sm text-cyan-300"
    : "mt-2 font-mono text-xs text-amber-700";
  const btnPrimary = isProminent
    ? "rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-900/30 hover:from-cyan-400 hover:to-violet-400"
    : "rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700";
  const btnSecondary = isProminent
    ? "rounded-xl border border-zinc-600 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/60"
    : "rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100";
  const copiedClass = isProminent
    ? "text-sm font-medium text-emerald-400"
    : "text-sm font-medium text-emerald-700";

  return (
    <div className={shell}>
      <p className={titleClass}>{labels.title}</p>
      <p className={hintClass}>{labels.hint}</p>

      <div className={boxClass}>
        <p className={siteClass}>{parsed.sitePath}</p>
        {displayCode ? (
          <p className={refClass}>
            {labels.codeLabel}：<span className="font-bold">{displayCode}</span>
          </p>
        ) : null}
        <p
          className={
            isProminent
              ? "mt-2 break-all font-mono text-xs text-zinc-500"
              : "mt-2 break-all font-mono text-xs text-stone-400"
          }
        >
          {link}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleCopy(link, "link")}
          className={btnPrimary}
        >
          {copied === "link" ? labels.copied : labels.copyLink}
        </button>
        {displayCode ? (
          <button
            type="button"
            onClick={() => void handleCopy(displayCode, "code")}
            className={btnSecondary}
          >
            {copied === "code" ? labels.copied : labels.copyCode}
          </button>
        ) : null}
      </div>
      {copied ? (
        <p className={`mt-3 ${copiedClass}`} role="status">
          {labels.copied}
        </p>
      ) : null}
    </div>
  );
}
