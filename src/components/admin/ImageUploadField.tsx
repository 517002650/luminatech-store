"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { SafeImage } from "@/components/SafeImage";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
};

export function ImageUploadField({ label, value, onChange, required }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-stone-700">{label}</label>
      <div className="mt-2 flex flex-wrap items-start gap-4">
        {value && (
          <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
            <SafeImage src={value} alt="" fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            placeholder="上传图片或粘贴 URL"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
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
              {uploading ? "上传中..." : "本地上传"}
            </button>
            <span className="text-xs text-stone-500">JPG/PNG/WebP/GIF，最大 5MB</span>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
