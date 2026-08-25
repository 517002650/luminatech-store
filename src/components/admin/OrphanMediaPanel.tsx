"use client";

import { useMemo, useState, useTransition } from "react";
import { Images, RefreshCw, Trash2 } from "lucide-react";
import {
  deleteOrphanMediaAction,
  scanOrphanMediaAction,
} from "@/app/admin/actions";

type OrphanMediaItem = {
  publicId: string;
  resourceType: "image" | "raw" | "video";
  folder: "products" | "downloads";
  url: string;
  bytes: number;
  format: string | null;
  createdAt: string | null;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function OrphanMediaPanel() {
  const [pending, startTransition] = useTransition();
  const [includeOrders, setIncludeOrders] = useState(true);
  const [orphans, setOrphans] = useState<OrphanMediaItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scannedCount, setScannedCount] = useState<number | null>(null);
  const [referencedCount, setReferencedCount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedItems = useMemo(
    () => orphans.filter((item) => selected.has(item.publicId)),
    [orphans, selected],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === orphans.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(orphans.map((o) => o.publicId)));
  }

  function handleScan() {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await scanOrphanMediaAction(includeOrders);
      if (!result.ok) {
        setError(result.error);
        setOrphans([]);
        setSelected(new Set());
        setScannedCount(null);
        setReferencedCount(null);
        return;
      }
      setOrphans(result.orphans);
      setSelected(new Set());
      setScannedCount(result.scannedCount);
      setReferencedCount(result.referencedCount);
      setNotice(
        result.orphans.length === 0
          ? `扫描完成：共 ${result.scannedCount} 个文件，未发现可清理项`
          : `扫描完成：共 ${result.scannedCount} 个文件，发现 ${result.orphans.length} 个未引用文件`,
      );
    });
  }

  function handleDelete() {
    if (selectedItems.length === 0) return;
    if (
      !window.confirm(
        `确定删除选中的 ${selectedItems.length} 个文件？此操作不可恢复。`,
      )
    ) {
      return;
    }

    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await deleteOrphanMediaAction(
        selectedItems.map((item) => ({
          publicId: item.publicId,
          resourceType: item.resourceType,
        })),
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const removed = new Set(
        result.results.filter((r) => r.deleted).map((r) => r.publicId),
      );
      setOrphans((prev) => prev.filter((item) => !removed.has(item.publicId)));
      setSelected(new Set());
      const failed = result.results.filter((r) => !r.deleted);
      setNotice(
        failed.length === 0
          ? `已删除 ${result.deleted} 个文件`
          : `已删除 ${result.deleted} 个；${failed.length} 个失败（${failed[0]?.reason ?? "unknown"}）`,
      );
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">清理未引用媒体</h2>
        <p className="mt-1 text-sm text-stone-500">
          扫描 Cloudinary 文件夹 <code className="rounded bg-stone-100 px-1">luminatech/products</code>{" "}
          与 <code className="rounded bg-stone-100 px-1">luminatech/downloads</code>
          ，对比商品主图/图库/详情、附件，以及（可选）历史订单缩略图。仅列出未被引用的文件。
        </p>

        <label className="mt-4 flex items-start gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={includeOrders}
            onChange={(e) => setIncludeOrders(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-300"
          />
          <span>
            保护历史订单中的商品图片（推荐勾选。取消后，仅出现在旧订单里的图也可能被标为可清理）
          </span>
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={handleScan}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
            {pending ? "处理中..." : "扫描未引用文件"}
          </button>
          <button
            type="button"
            disabled={pending || selectedItems.length === 0}
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            删除选中 ({selectedItems.length})
          </button>
        </div>

        {scannedCount !== null ? (
          <p className="mt-3 text-xs text-stone-500">
            云端扫描 {scannedCount} 个 · 数据库引用键 {referencedCount} 个 · 未引用{" "}
            {orphans.length} 个
          </p>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        {notice && !error ? (
          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-stone-900">
            <Images className="h-4 w-4" />
            可清理列表
          </h3>
          {orphans.length > 0 ? (
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm text-stone-600 underline-offset-2 hover:underline"
            >
              {selected.size === orphans.length ? "取消全选" : "全选"}
            </button>
          ) : null}
        </div>

        {orphans.length === 0 ? (
          <p className="text-sm text-stone-400">
            暂无结果。点击上方「扫描未引用文件」开始。
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
            {orphans.map((item) => (
              <li
                key={item.publicId}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.publicId)}
                  onChange={() => toggle(item.publicId)}
                  className="h-4 w-4 rounded border-stone-300"
                />
                {item.resourceType === "image" && item.url ? (
                  // Cloudinary thumbnails are fine with native img in admin
                  <img
                    src={item.url}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 text-[10px] font-medium uppercase text-stone-500">
                    {item.format || "file"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {item.publicId}
                  </p>
                  <p className="text-xs text-stone-500">
                    {item.folder} · {formatBytes(item.bytes)}
                    {item.createdAt
                      ? ` · ${new Date(item.createdAt).toLocaleString("zh-CN")}`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
