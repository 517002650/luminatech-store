"use client";

import { useCallback, useEffect, useState } from "react";
import {
  checkCouponCodeAction,
  generateCouponCodeAction,
} from "@/app/admin/actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm uppercase outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
const labelClass = "text-sm font-medium text-stone-700";
const hintClass = "mt-1 text-xs text-stone-500";

type Props = {
  defaultCode?: string;
  defaultManual?: boolean;
};

export function CouponCodeField({
  defaultCode = "",
  defaultManual = false,
}: Props) {
  const [mode, setMode] = useState<"auto" | "manual">(
    defaultManual ? "manual" : "auto",
  );
  const [code, setCode] = useState(defaultCode);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<
    "unknown" | "available" | "taken" | "invalid"
  >("unknown");

  const generateCode = useCallback(async () => {
    setGenerating(true);
    try {
      const result = await generateCouponCodeAction();
      if (result.code) {
        setCode(result.code);
        setAvailability("available");
      }
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "auto" && !code) {
      void generateCode();
    }
  }, [mode, code, generateCode]);

  async function checkCode(value: string) {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) {
      setAvailability("invalid");
      return;
    }
    setChecking(true);
    try {
      const result = await checkCouponCodeAction(trimmed);
      setAvailability(result.available ? "available" : "taken");
    } finally {
      setChecking(false);
    }
  }

  const chip =
    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition";
  const chipOn = "border-amber-500 bg-amber-50 text-amber-900";
  const chipOff = "border-stone-300 text-stone-600 hover:border-stone-400";

  return (
    <div className="space-y-2">
      <label className={labelClass}>优惠码 *</label>
      <input type="hidden" name="codeMode" value={mode} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${chip} ${mode === "auto" ? chipOn : chipOff}`}
          onClick={() => {
            setMode("auto");
            setAvailability("unknown");
          }}
        >
          自动生成
        </button>
        <button
          type="button"
          className={`${chip} ${mode === "manual" ? chipOn : chipOff}`}
          onClick={() => {
            setMode("manual");
            setAvailability("unknown");
          }}
        >
          手动输入
        </button>
      </div>

      {mode === "auto" ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              name="code"
              readOnly
              value={code}
              placeholder="点击重新生成"
              className={`${inputClass} bg-stone-50`}
            />
            <button
              type="button"
              disabled={generating}
              onClick={() => void generateCode()}
              className="shrink-0 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              {generating ? "生成中..." : "重新生成"}
            </button>
          </div>
          <p className={hintClass}>
            系统自动生成唯一优惠码，提交前可预览；若已被占用会在保存时自动换码。
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <input
            name="code"
            required
            value={code}
            onChange={(e) => {
              const next = e.target.value.toUpperCase();
              setCode(next);
              setAvailability("unknown");
            }}
            onBlur={() => void checkCode(code)}
            placeholder="WELCOME10"
            className={inputClass}
          />
          {checking && <p className={hintClass}>查重中...</p>}
          {!checking && availability === "available" && code.trim() && (
            <p className="text-xs text-green-700">该优惠码可用</p>
          )}
          {!checking && availability === "taken" && (
            <p className="text-xs text-red-600">该优惠码已存在，请换一个</p>
          )}
          {!checking && availability === "invalid" && code.trim() === "" && (
            <p className="text-xs text-red-600">优惠码不能为空</p>
          )}
        </div>
      )}
    </div>
  );
}
