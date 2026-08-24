"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, Star, Trash2, Upload } from "lucide-react";
import {
  createProductDownloadAction,
  deleteProductDownloadAction,
  setLatestProductDownloadAction,
} from "@/app/admin/actions";
import {
  DOWNLOAD_TYPE_LABELS,
  DOWNLOAD_TYPES,
  formatFileSize,
  type DownloadType,
} from "@/lib/product-downloads";

export type AdminDownloadRow = {
  id: string;
  type: string;
  version: string;
  titleEn: string;
  titleZh: string;
  notesEn: string;
  notesZh: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  isLatest: boolean;
  createdAt: string;
};

type Props = {
  productId: string;
  downloads: AdminDownloadRow[];
};

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
const labelClass = "text-sm font-medium text-stone-700";

export function ProductDownloadsPanel({ productId, downloads }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);

  async function handleUpload(file: File | null) {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/upload-asset", { method: "POST", body });
      const data = (await res.json()) as { url?: string; fileName?: string; fileSize?: number; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "上传失败");
      setFileUrl(data.url);
      setFileName(data.fileName || file.name);
      setFileSize(data.fileSize || file.size);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function handleCreate(formData: FormData) {
    formData.set("fileUrl", fileUrl);
    formData.set("fileName", fileName);
    formData.set("fileSize", String(fileSize));
    startTransition(async () => {
      const result = await createProductDownloadAction(productId, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setFileUrl("");
      setFileName("");
      setFileSize(0);
      setError("");
      router.refresh();
    });
  }

  const grouped = DOWNLOAD_TYPES.map((type) => ({
    type,
    items: downloads.filter((d) => d.type === type),
  }));

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-stone-900">购买后下载（固件 / 文件 / 插件）</h2>
      <p className="mt-1 text-sm text-stone-500">
        仅已购买客户可见可下。未购买用户前台完全隐藏，支持历史版本。
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form action={handleCreate} className="mt-6 space-y-4 rounded-xl border border-stone-100 bg-stone-50 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>类型 *</label>
            <select name="type" required defaultValue="firmware" className={inputClass}>
              {DOWNLOAD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DOWNLOAD_TYPE_LABELS[type].zh}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>版本号 *</label>
            <input name="version" required placeholder="如 1.2.0" className={inputClass} />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input name="isLatest" type="checkbox" defaultChecked className="h-4 w-4 rounded border-stone-300" />
              设为该类型最新版
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>英文标题 *</label>
            <input name="titleEn" required placeholder="Console Firmware" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>中文标题 *</label>
            <input name="titleZh" required placeholder="控台固件" className={inputClass} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>英文说明</label>
            <input name="notesEn" placeholder="Changelog / notes" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>中文说明</label>
            <input name="notesZh" placeholder="更新说明" className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>上传文件 *</label>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
              <Upload className="h-4 w-4" />
              {uploading ? "上传中..." : "选择文件"}
              <input
                type="file"
                className="hidden"
                disabled={uploading || pending}
                onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
              />
            </label>
            {fileName ? (
              <span className="text-sm text-stone-600">
                {fileName} ({formatFileSize(fileSize)})
              </span>
            ) : (
              <span className="text-sm text-stone-400">支持 bin/hex/zip/pdf/gdtf 等，最大 100MB</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={pending || uploading || !fileUrl}
          className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {pending ? "保存中..." : "添加下载项"}
        </button>
      </form>

      <div className="mt-8 space-y-6">
        {grouped.map(({ type, items }) => (
          <div key={type}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              {DOWNLOAD_TYPE_LABELS[type as DownloadType].zh}
              <span className="ml-2 font-normal text-stone-400">({items.length})</span>
            </h3>
            {items.length === 0 ? (
              <p className="mt-2 text-sm text-stone-400">暂无</p>
            ) : (
              <ul className="mt-3 divide-y divide-stone-100 rounded-xl border border-stone-200">
                {items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900">
                        {item.titleZh}
                        <span className="ml-2 text-sm font-normal text-stone-500">v{item.version}</span>
                        {item.isLatest && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                            <Star className="h-3 w-3" /> 最新
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-stone-500">
                        {item.fileName} · {formatFileSize(item.fileSize)} ·{" "}
                        {new Date(item.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!item.isLatest && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await setLatestProductDownloadAction(item.id);
                              router.refresh();
                            })
                          }
                          className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50"
                        >
                          设为最新
                        </button>
                      )}
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        文件
                      </a>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm("确定删除该下载项？")) return;
                          startTransition(async () => {
                            await deleteProductDownloadAction(item.id);
                            router.refresh();
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
