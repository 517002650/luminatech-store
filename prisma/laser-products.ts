import type { ProductCategoryKey } from "../src/lib/categories";

export type ExtraProductSeed = {
  slug: string;
  sku: string;
  brand: string;
  nameEn: string;
  nameZh: string;
  shortDescEn: string;
  shortDescZh: string;
  descriptionEn: string;
  descriptionZh: string;
  price: number;
  image: string;
  specsEn: { label: string; value: string }[];
  specsZh: { label: string; value: string }[];
  highlightsEn: string[];
  highlightsZh: string[];
  stock: number;
  featured: boolean;
  warranty: string;
  sourceUrl: string;
  categoryKey: ProductCategoryKey;
};

const photo = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;

/** Laser systems for storefront category testing. */
export const LASER_PRODUCTS: ExtraProductSeed[] = [
  {
    slug: "rgb-laser-5w-pro",
    sku: "LT-LSR-5W",
    brand: "LuminaTech",
    nameEn: "RGB Laser Projector 5W",
    nameZh: "RGB 全彩激光灯 5W",
    shortDescEn: "5W full-color ILDA laser with DMX and SD animations.",
    shortDescZh: "5W 全彩 ILDA 激光，DMX 控制，SD 卡动画。",
    descriptionEn: "Professional RGB laser for clubs and stage shows. DMX / ILDA / Auto / Sound-active modes.",
    descriptionZh: "专业 RGB 激光，适合酒吧与舞台。支持 DMX / ILDA / 自动 / 声控。",
    price: 899,
    image: photo("laser-5w"),
    specsEn: [
      { label: "Power", value: "5W RGB" },
      { label: "Control", value: "DMX512, ILDA" },
      { label: "Scan", value: "30K @ 8°" },
    ],
    specsZh: [
      { label: "功率", value: "5W RGB" },
      { label: "控制", value: "DMX512、ILDA" },
      { label: "扫描", value: "30K @ 8°" },
    ],
    highlightsEn: ["128 preset patterns", "Safety key included"],
    highlightsZh: ["128 组预设图案", "含安全钥匙"],
    stock: 40,
    featured: true,
    warranty: "1 year",
    sourceUrl: "https://www.malighting.com/",
    categoryKey: "lasers",
  },
  {
    slug: "rgb-laser-10w-touring",
    sku: "LT-LSR-10W",
    brand: "LuminaTech",
    nameEn: "RGB Laser 10W Touring",
    nameZh: "RGB 激光灯 10W 巡演版",
    shortDescEn: "10W high-power RGB laser for arena and outdoor shows.",
    shortDescZh: "10W 高功率 RGB 激光，场馆与户外演出。",
    descriptionEn: "Touring-grade 10W RGB laser with ILDA and Art-Net control options.",
    descriptionZh: "巡演级 10W RGB 激光，支持 ILDA 与 Art-Net。",
    price: 1899,
    image: photo("laser-10w"),
    specsEn: [
      { label: "Power", value: "10W RGB" },
      { label: "Control", value: "DMX, ILDA, Art-Net" },
    ],
    specsZh: [
      { label: "功率", value: "10W RGB" },
      { label: "控制", value: "DMX、ILDA、Art-Net" },
    ],
    highlightsEn: ["Arena output", "Flight-case ready"],
    highlightsZh: ["场馆级亮度", "可配航空箱"],
    stock: 18,
    featured: true,
    warranty: "1 year",
    sourceUrl: "https://www.malighting.com/",
    categoryKey: "lasers",
  },
  {
    slug: "green-laser-single-3w",
    sku: "LT-LSR-G3",
    brand: "LuminaTech",
    nameEn: "Green Laser 3W",
    nameZh: "单绿激光灯 3W",
    shortDescEn: "Single-color green laser for aerial beams and tunnels.",
    shortDescZh: "单绿激光，空中光束与隧道效果。",
    descriptionEn: "Compact 3W green laser for clubs and mobile DJ setups.",
    descriptionZh: "紧凑 3W 绿激光，适合酒吧与移动 DJ。",
    price: 449,
    image: photo("laser-green"),
    specsEn: [
      { label: "Color", value: "532nm green" },
      { label: "Power", value: "3W" },
    ],
    specsZh: [
      { label: "颜色", value: "532nm 绿光" },
      { label: "功率", value: "3W" },
    ],
    highlightsEn: ["Bright aerial beams", "DMX control"],
    highlightsZh: ["高亮空中光束", "DMX 控制"],
    stock: 50,
    featured: false,
    warranty: "1 year",
    sourceUrl: "https://www.malighting.com/",
    categoryKey: "lasers",
  },
  {
    slug: "animation-laser-rgb-8w",
    sku: "LT-LSR-ANI8",
    brand: "LuminaTech",
    nameEn: "Animation Laser RGB 8W",
    nameZh: "动画激光 RGB 8W",
    shortDescEn: "Full-color animation laser with SD card and ILDA.",
    shortDescZh: "全彩动画激光，SD 卡与 ILDA。",
    descriptionEn: "8W RGB animation laser for logos, text and graphic shows.",
    descriptionZh: "8W RGB 动画激光，适合 Logo、文字与图形秀。",
    price: 1499,
    image: photo("laser-ani"),
    specsEn: [
      { label: "Power", value: "8W RGB" },
      { label: "Modes", value: "ILDA, SD, DMX, Auto" },
    ],
    specsZh: [
      { label: "功率", value: "8W RGB" },
      { label: "模式", value: "ILDA、SD、DMX、自动" },
    ],
    highlightsEn: ["Logo projection", "ILDA software ready"],
    highlightsZh: ["Logo 投影", "支持 ILDA 软件"],
    stock: 22,
    featured: false,
    warranty: "1 year",
    sourceUrl: "https://www.malighting.com/",
    categoryKey: "lasers",
  },
  {
    slug: "laser-array-bar-rgb",
    sku: "LT-LSR-BAR",
    brand: "LuminaTech",
    nameEn: "RGB Laser Array Bar",
    nameZh: "RGB 激光阵列灯条",
    shortDescEn: "Multi-beam laser bar for club walls and truss.",
    shortDescZh: "多光束激光灯条，墙面与桁架安装。",
    descriptionEn: "RGB laser array bar with independent beam control via DMX.",
    descriptionZh: "RGB 激光阵列灯条，DMX 独立光束控制。",
    price: 699,
    image: photo("laser-bar"),
    specsEn: [
      { label: "Beams", value: "8–16 RGB beams" },
      { label: "Mount", value: "Truss / wall" },
    ],
    specsZh: [
      { label: "光束", value: "8–16 路 RGB" },
      { label: "安装", value: "桁架 / 墙面" },
    ],
    highlightsEn: ["Club wall FX", "Pixel-style control"],
    highlightsZh: ["酒吧墙面效果", "类似像素控制"],
    stock: 30,
    featured: false,
    warranty: "1 year",
    sourceUrl: "https://www.malighting.com/",
    categoryKey: "lasers",
  },
];
