const PLACEHOLDER = "/images/product-placeholder.svg";

export function isLocalImage(src: string) {
  return src.startsWith("/");
}

export function isCloudinaryImage(src: string) {
  return src.includes("res.cloudinary.com");
}

export function canUseNextImage(src: string) {
  if (isLocalImage(src)) return true;
  try {
    const host = new URL(src).hostname;
    return (
      host === "images.unsplash.com" ||
      host === "picsum.photos" ||
      host === "res.cloudinary.com"
    );
  } catch {
    return false;
  }
}

export function normalizeImageSrc(src: string) {
  if (!src) return PLACEHOLDER;
  return src;
}

export { PLACEHOLDER };
