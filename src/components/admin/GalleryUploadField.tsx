"use client";

import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { SafeImage } from "@/components/SafeImage";

type Props = {
  label: string;
  value: string;
  onChange: (text: string) => void;
};

function linesToList(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function GalleryUploadField({ label, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const urls = linesToList(value);

  async function uploadFiles(files: FileList) {
    setUploading(true);
    setError("");
    const uploaded: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "上传失败");
        uploaded.push(data.url);
      }
      onChange([...urls, ...uploaded].join("\n"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function removeUrl(url: string) {
    onChange(urls.filter((item) => item !== url).join("\n"));
  }

  return (
    <div>
      <label className="text-sm font-medium text-stone-700">{label}</label>
      {urls.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative h-20 w-20 overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
            >
              <SafeImage src={url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeUrl(url)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="每行一个图片 URL，或使用本地上传"
        className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
      />
      <div className="mt-2 flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "上传中..." : "批量本地上传"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
