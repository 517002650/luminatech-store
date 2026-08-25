"use client";

import { useState } from "react";
import {
  Download,
  ExternalLink,
  HardDrive,
  ShieldCheck,
  Upload,
} from "lucide-react";

export function BackupDownloadPanel() {
  const [pending, setPending] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastCounts, setLastCounts] = useState<Record<string, number> | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [mode, setMode] = useState<"catalog" | "full">("catalog");
  const [clearConfirm, setClearConfirm] = useState("");
  const [clearPending, setClearPending] = useState(false);

  async function handleDownload() {
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/backup", { method: "GET" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || `下载失败（${res.status}）`);
      }

      const text = await res.text();
      try {
        const parsed = JSON.parse(text) as { counts?: Record<string, number> };
        if (parsed.counts) setLastCounts(parsed.counts);
      } catch {
        // ignore
      }

      const blob = new Blob([text], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.href = url;
      a.download = `stagevio-备份-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSuccess("备份已下载到电脑，请再复制一份到网盘。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "下载失败");
    } finally {
      setPending(false);
    }
  }

  async function handleUpload(file: File | null) {
    if (!file) return;
    setSyncPending(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "full" && confirmText !== "确认恢复") {
        throw new Error("完整恢复请先在下方输入：确认恢复");
      }
      const body = new FormData();
      body.set("file", file);
      body.set("mode", mode);
      body.set("confirm", confirmText);
      const res = await fetch("/api/admin/restore", { method: "POST", body });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        result?: Record<string, number>;
      };
      if (!res.ok) throw new Error(data.error || "同步失败");
      setSuccess(data.message || "同步成功");
      setConfirmText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "同步失败");
    } finally {
      setSyncPending(false);
    }
  }

  async function handleClearAccounts() {
    if (clearConfirm !== "清空账号") {
      setError("请输入「清空账号」以确认");
      return;
    }
    setClearPending(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/clear-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "清空账号" }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        before?: Record<string, number>;
        after?: Record<string, number>;
      };
      if (!res.ok) throw new Error(data.error || "清空失败");
      setSuccess(
        `${data.message ?? "已清空"}（用户 ${data.before?.users ?? 0} → ${data.after?.users ?? 0}，订单 ${data.before?.orders ?? 0} → ${data.after?.orders ?? 0}）`,
      );
      setClearConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "清空失败");
    } finally {
      setClearPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-6">
        <h2 className="text-lg font-semibold text-stone-900">本地商品 → 线上（推荐）</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-700">
          <li>
            在本机打开 <code className="rounded bg-white px-1.5 py-0.5 text-xs">http://localhost:3000/admin/backup</code>
          </li>
          <li>点下面的「下载数据库备份」，得到 JSON 文件</li>
          <li>打开<strong>线上</strong>后台同一页面，用下方「上传同步」选该文件</li>
          <li>默认选「只同步商品/分类」（会保留线上订单）</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <HardDrive className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-stone-900">一键备份到电脑</h2>
            <p className="mt-1 text-sm text-stone-500">
              下载完整数据（商品、订单、用户、分类等）。请存到电脑或网盘，不要发到公开聊天。
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        {success ? (
          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        ) : null}

        {lastCounts ? (
          <div className="mt-4 grid gap-2 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600 sm:grid-cols-3">
            <p>商品：{lastCounts.products ?? 0}</p>
            <p>订单：{lastCounts.orders ?? 0}</p>
            <p>用户：{lastCounts.users ?? 0}</p>
            <p>分类：{lastCounts.categories ?? 0}</p>
            <p>下载附件：{lastCounts.productDownloads ?? 0}</p>
            <p>评价：{lastCounts.reviews ?? 0}</p>
          </div>
        ) : null}

        <button
          type="button"
          disabled={pending}
          onClick={handleDownload}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {pending ? "正在打包备份…" : "下载数据库备份"}
        </button>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900">上传同步到当前环境</h2>
            <p className="mt-1 text-sm text-stone-500">
              在<strong>线上</strong>后台使用：把本地下载的备份传上来，把本地商品同步到网站。
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 p-3 hover:bg-stone-50">
            <input
              type="radio"
              name="syncMode"
              checked={mode === "catalog"}
              onChange={() => setMode("catalog")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-stone-900">
                只同步商品 / 分类 / 附件（推荐）
              </span>
              <span className="text-xs text-stone-500">保留线上订单与顾客账号</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-red-200 p-3 hover:bg-red-50/40">
            <input
              type="radio"
              name="syncMode"
              checked={mode === "full"}
              onChange={() => setMode("full")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-red-700">
                完整恢复（会覆盖订单与用户）
              </span>
              <span className="text-xs text-red-600/80">仅在你明确要整库覆盖时使用</span>
            </span>
          </label>
        </div>

        {mode === "full" ? (
          <div className="mt-4">
            <label className="text-sm font-medium text-stone-700">
              请输入「确认恢复」以继续
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="确认恢复"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </div>
        ) : null}

        <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600">
          <Upload className="h-4 w-4" />
          {syncPending ? "正在同步…" : "选择备份文件并同步"}
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            disabled={syncPending}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              void handleUpload(f);
            }}
          />
        </label>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="text-lg font-semibold text-red-800">清空买家账号（测试用）</h2>
        <p className="mt-1 text-sm text-red-700/90">
          删除所有注册用户、订单、评价、收藏。<strong>商品和固件附件保留。</strong>
          不会修复 Cloudinary 下载问题；清空后需重新注册并下单才能测买家下载。
        </p>
        <div className="mt-4">
          <label className="text-sm font-medium text-red-800">输入「清空账号」以确认</label>
          <input
            value={clearConfirm}
            onChange={(e) => setClearConfirm(e.target.value)}
            placeholder="清空账号"
            className="mt-1 w-full rounded-lg border border-red-200 px-3 py-2 text-sm outline-none focus:border-red-400"
          />
        </div>
        <button
          type="button"
          disabled={clearPending}
          onClick={() => void handleClearAccounts()}
          className="mt-4 rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
        >
          {clearPending ? "正在清空…" : "清空买家账号与订单"}
        </button>
      </section>

      <section className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-700 ring-1 ring-cyan-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Neon 云端快照</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-700">
              <li>
                打开{" "}
                <a
                  href="https://console.neon.tech"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-cyan-700 hover:underline"
                >
                  Neon 控制台
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>进入项目 → <strong>Branches</strong> → <strong>Create branch</strong></li>
              <li>名称例如 <code className="rounded bg-white px-1.5 py-0.5 text-xs">backup-2026-08-25</code></li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
