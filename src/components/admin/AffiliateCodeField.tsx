"use client";

import { useState } from "react";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
const labelClass = "text-sm font-medium text-stone-700";

type Props = {
  /** Prefill manual code (edit form) */
  defaultCode?: string;
  /** When true, default to manual mode (editing existing) */
  defaultManual?: boolean;
  dark?: boolean;
};

export function AffiliateCodeField({
  defaultCode = "",
  defaultManual = false,
  dark = false,
}: Props) {
  const [mode, setMode] = useState<"auto" | "manual">(
    defaultManual ? "manual" : "auto",
  );

  const label = dark
    ? "text-sm font-medium text-zinc-200"
    : labelClass;
  const input = dark
    ? "mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
    : inputClass;
  const hint = dark ? "mt-1 text-xs text-zinc-400" : "mt-1 text-xs text-stone-500";
  const chip =
    dark
      ? "rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
      : "rounded-lg border px-3 py-1.5 text-xs font-semibold transition";
  const chipOn = dark
    ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
    : "border-amber-500 bg-amber-50 text-amber-900";
  const chipOff = dark
    ? "border-zinc-600 text-zinc-400 hover:border-zinc-500"
    : "border-stone-300 text-stone-600 hover:border-stone-400";

  return (
    <div className="space-y-2">
      <label className={label}>推广码 *</label>
      <input type="hidden" name="codeMode" value={mode} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${chip} ${mode === "auto" ? chipOn : chipOff}`}
          onClick={() => setMode("auto")}
        >
          自动生成
        </button>
        <button
          type="button"
          className={`${chip} ${mode === "manual" ? chipOn : chipOff}`}
          onClick={() => setMode("manual")}
        >
          手动输入
        </button>
      </div>
      {mode === "manual" ? (
        <input
          name="code"
          required
          defaultValue={defaultCode}
          placeholder="如 ZHANGSAN"
          className={input}
        />
      ) : (
        <p className={hint}>
          提交后系统自动分配唯一推广码
          {defaultCode ? `（当前：${defaultCode}，选「手动输入」可修改）` : ""}
        </p>
      )}
      <p className={hint}>链接形如 /zh?ref=CODE ，仅字母数字与 _ -</p>
    </div>
  );
}
