/** Detect YouTube / Vimeo / Bilibili / direct video URLs for product detail embeds. */

export type VideoEmbedInfo =
  | { kind: "iframe"; src: string; provider: "youtube" | "vimeo" | "bilibili" }
  | { kind: "video"; src: string; provider: "file" };

export function parseVideoEmbedUrl(raw: string | null | undefined): VideoEmbedInfo | null {
  if (!raw) return null;
  const url = raw.trim();
  if (!url) return null;

  // YouTube: watch, youtu.be, embed, shorts
  const yt =
    url.match(
      /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i,
    ) || url.match(/youtube\.com\/watch\?.*\bv=([\w-]{11})/i);
  if (yt?.[1]) {
    return {
      kind: "iframe",
      provider: "youtube",
      src: `https://www.youtube.com/embed/${yt[1]}?rel=0`,
    };
  }

  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo?.[1]) {
    return {
      kind: "iframe",
      provider: "vimeo",
      src: `https://player.vimeo.com/video/${vimeo[1]}`,
    };
  }

  // Bilibili BV
  const bili = url.match(/bilibili\.com\/video\/(BV[\w]+)/i);
  if (bili?.[1]) {
    return {
      kind: "iframe",
      provider: "bilibili",
      src: `https://player.bilibili.com/player.html?bvid=${bili[1]}&high_quality=1&autoplay=0`,
    };
  }

  // Direct file
  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(url)) {
    return { kind: "video", provider: "file", src: url };
  }

  return null;
}

export function isVideoEmbedUrl(raw: string | null | undefined) {
  return Boolean(parseVideoEmbedUrl(raw));
}
