"use client";

import { useRef, useState } from "react";
import { ImagePlus, Upload, Video } from "lucide-react";
import { ProductMarkdown } from "@/components/ProductMarkdown";
import { isVideoEmbedUrl } from "@/lib/video-embed";

type Props = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function MarkdownEditor({ label, name, value, onChange, placeholder }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  async function uploadAndInsert(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");

      insertAtCursor(`\n\n![${file.name}](${data.url})\n\n`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function insertVideo() {
    setError("");
    const url = window.prompt(
      "粘贴视频链接（YouTube / Bilibili / Vimeo / 直链 mp4）",
      "https://www.youtube.com/watch?v=",
    );
    if (!url) return;
    const trimmed = url.trim();
    if (!isVideoEmbedUrl(trimmed)) {
      setError("无法识别该视频链接。请使用 YouTube、Bilibili、Vimeo 或 .mp4/.webm 直链。");
      return;
    }
    insertAtCursor(`\n\n![介绍视频](${trimmed})\n\n`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-stone-700">{label}</label>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="text-xs text-amber-600 hover:underline"
        >
          {showPreview ? "编辑" : "预览"}
        </button>
      </div>

      <input type="hidden" name={name} value={value} />

      {showPreview ? (
        <div className="mt-2 min-h-48 rounded-lg border border-stone-200 bg-zinc-950 p-4">
          {value ? (
            <ProductMarkdown content={value} />
          ) : (
            <p className="text-sm text-stone-400">暂无内容</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          required
          placeholder={placeholder}
          className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50">
          <Upload className="h-4 w-4" />
          {uploading ? "上传中..." : "上传并插入图片"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadAndInsert(file);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          onClick={insertVideo}
          className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
        >
          <Video className="h-4 w-4" />
          插入视频
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor("\n\n## \n\n")}
          className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
        >
          <ImagePlus className="h-4 w-4" />
          插入标题
        </button>
        <span className="text-xs text-stone-500">
          图片 <code>![](url)</code> · 视频{" "}
          <code>![介绍视频](YouTube/Bilibili/mp4链接)</code>
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
