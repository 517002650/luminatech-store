"use client";

import { useEffect, useState } from "react";
import { normalizeImageSrc, PLACEHOLDER } from "@/lib/image-url";

type SafeImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  priority,
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(() => normalizeImageSrc(src));

  useEffect(() => {
    setCurrentSrc(normalizeImageSrc(src));
  }, [src]);

  const style = fill
    ? {
        position: "absolute" as const,
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
      }
    : undefined;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => {
        if (currentSrc !== PLACEHOLDER) setCurrentSrc(PLACEHOLDER);
      }}
    />
  );
}
