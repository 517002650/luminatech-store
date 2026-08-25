"use client";

import { useState } from "react";
import { Download, ExternalLink, HardDrive, ShieldCheck } from "lucide-react";

export function BackupDownloadPanel() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [lastCounts, setLastCounts] = useState<Record<string, number> | null>(null);

  async function handleDownload() {
    setPending(true);
    setError("");
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
        // ignore preview parse errors
      }

      const blob = new Blob([text], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.href = url;
      a.download = `luminatech-备份-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "下载失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <HardDrive className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-stone-900">一键备份到电脑</h2>
            <p className="mt-1 text-sm text-stone-500">
              点击后浏览器会下载一份完整数据文件（商品、订单、用户、分类、优惠码等）。
              请把文件存到电脑或网盘，不要发到公开聊天。
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
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

      <section className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-700 ring-1 ring-cyan-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Neon 云端快照（推荐每周一次）</h2>
            <p className="mt-1 text-sm text-stone-600">
              这是官方数据库快照，防误删最有效。与上面的「下载到电脑」互补使用。
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-stone-700">
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
                并登录
              </li>
              <li>点开你的项目（LuminaTech / 商店用的那个）</li>
              <li>
                左侧进入 <strong>Branches</strong>（分支）
              </li>
              <li>
                点 <strong>Create branch</strong>，名称例如{" "}
                <code className="rounded bg-white px-1.5 py-0.5 text-xs">backup-2026-08-25</code>
              </li>
              <li>创建成功即相当于留了一份当时的数据快照；出问题可在 Branches 里查看/恢复</li>
            </ol>
            <p className="mt-3 text-xs text-stone-500">
              免费版保留时间有限，重要节点请同时用本页「下载到电脑」再存一份网盘。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
