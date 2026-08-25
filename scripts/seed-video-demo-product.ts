/**
 * Upsert a demo product with an embedded intro video (Markdown).
 *
 * Usage (recommended — injects real Vercel secrets):
 *   npx vercel env run -e production -- npx tsx scripts/seed-video-demo-product.ts
 *
 * Or set DATABASE_URL explicitly to your Neon postgres URL.
 */
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL?.trim() ?? "";
if (!/^postgres(ql)?:\/\//i.test(url)) {
  console.error(
    "DATABASE_URL must be a postgresql:// connection string.\n" +
      "Run: npx vercel env run -e production -- npx tsx scripts/seed-video-demo-product.ts",
  );
  process.exit(1);
}

const prisma = new PrismaClient();

const VIDEO_URL = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";
const photo = (seed: string, w = 800, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const SLUG = "beam-moving-head-video-demo";

async function main() {
  const data = {
    slug: SLUG,
    sku: "LT-VIDEO-DEMO-001",
    brand: "LuminaTech",
    nameEn: "Beam Moving Head — Video Demo",
    nameZh: "光束摇头灯 — 视频演示款",
    shortDescEn: "Demo product with an embedded YouTube intro video in the description.",
    shortDescZh: "演示商品：详情页 Markdown 内嵌 YouTube 介绍视频，用于验证在线播放。",
    descriptionEn: `Professional beam moving head for clubs and touring.

## Intro video

![Product intro video](${VIDEO_URL})

Paste a YouTube / Bilibili / Vimeo / mp4 link in Markdown as \`![Intro](url)\` to embed playback on the product page.

## Highlights
- Sharp beam output
- Fast pan / tilt
- DMX512 control`,
    descriptionZh: `适用于酒吧与巡演的专业光束摇头灯。

## 介绍视频

![产品介绍视频](${VIDEO_URL})

在详细描述中使用 Markdown：\`![介绍视频](视频链接)\` 即可在商品详情页内嵌播放。

支持 YouTube、Bilibili、Vimeo，以及 \`.mp4\` / \`.webm\` 直链。

## 亮点
- 锐利光束
- 快速摇头
- DMX512 控制`,
    categoryEn: "Moving Heads",
    categoryZh: "摇头灯",
    categoryKey: "fixtures",
    price: 899,
    image: photo("beam-video-demo-main"),
    images: JSON.stringify([
      photo("beam-video-demo-1"),
      photo("beam-video-demo-2"),
      photo("beam-video-demo-3"),
    ]),
    specsEn: JSON.stringify([
      { label: "Light source", value: "230W beam" },
      { label: "Control", value: "DMX512" },
      { label: "Pan / Tilt", value: "540° / 270°" },
    ]),
    specsZh: JSON.stringify([
      { label: "光源", value: "230W 光束" },
      { label: "控制", value: "DMX512" },
      { label: "水平 / 垂直", value: "540° / 270°" },
    ]),
    highlightsEn: JSON.stringify([
      "Embedded intro video on product page",
      "Markdown video syntax verified",
    ]),
    highlightsZh: JSON.stringify([
      "详情页内嵌介绍视频",
      "已验证 Markdown 视频语法",
    ]),
    stock: 20,
    featured: true,
    active: true,
    requiresFreight: false,
    warranty: "1 year",
  };

  const existing = await prisma.product.findUnique({ where: { slug: SLUG } });
  if (existing) {
    await prisma.product.update({ where: { slug: SLUG }, data });
    console.log(`Updated product: ${SLUG}`);
  } else {
    await prisma.product.create({ data });
    console.log(`Created product: ${SLUG}`);
  }

  console.log(`Video URL: ${VIDEO_URL}`);
  console.log(`ZH: /zh/products/${SLUG}`);
  console.log(`EN: /en/products/${SLUG}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
