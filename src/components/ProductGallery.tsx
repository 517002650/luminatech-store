"use client";

import { useState } from "react";
import { SafeImage } from "@/components/SafeImage";

type ProductGalleryProps = {
  images: string[];
  alt: string;
};

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const gallery = images.filter(Boolean);

  if (gallery.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-stone-100">
        <SafeImage
          src={gallery[active]}
          alt={alt}
          fill
          className="object-cover"
          priority
        />
      </div>
      {gallery.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {gallery.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                active === index
                  ? "border-amber-500"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <SafeImage src={src} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
