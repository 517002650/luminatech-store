/**
 * Demo catalog: 30 products from MA Lighting, Avolites, and Chauvet Professional.
 * Images and descriptions sourced from official manufacturer websites (demo/testing only).
 * Run: npm run db:seed:brands
 */
import { PrismaClient } from "@prisma/client";
import { resolveCategoryKey, findCategoryInList, DEFAULT_CATEGORIES } from "../src/lib/categories";
import { EFFECTS_PRODUCTS } from "./effects-products";
import { LASER_PRODUCTS } from "./laser-products";

const prisma = new PrismaClient();

const maImg = (assetId: string) =>
  `https://xom.malighting.com/xom-rest/assets/${assetId}/preview?mimeType=image/png&width=1170&height=700`;

const avImg = (path: string) => `https://www.avolites.com${path}`;

type ProductSeed = {
  slug: string;
  sku: string;
  brand: string;
  nameEn: string;
  nameZh: string;
  shortDescEn: string;
  shortDescZh: string;
  descriptionEn: string;
  descriptionZh: string;
  categoryEn: string;
  categoryZh: string;
  price: number;
  image: string;
  images: string[];
  specsEn: { label: string; value: string }[];
  specsZh: { label: string; value: string }[];
  highlightsEn: string[];
  highlightsZh: string[];
  stock: number;
  featured: boolean;
  warranty: string;
  sourceUrl: string;
};

const products: ProductSeed[] = [
  // ── MA Lighting grandMA3 (10) ──────────────────────────────────────────
  {
    slug: "grandma3-full-size",
    sku: "MA-4010501",
    brand: "MA Lighting",
    nameEn: "grandMA3 full-size",
    nameZh: "grandMA3 full-size 旗舰控台",
    shortDescEn: "Flagship grandMA3 console for major tours — massive screens and playback.",
    shortDescZh: "巡演旗舰 grandMA3 控台，超大触摸屏与回放区。",
    descriptionEn: `The grandMA3 full-size is MA Lighting's flagship lighting control console, used on the world's biggest tours and events.

![grandMA3 full-size](${maImg("5a56c7f0-5f67-414d-8ca1-dfec17233ee0")})

## Highlights
- Huge multi-touch screen real-estate
- Up to 250,000 parameters with processing units
- Native GDTF / MVR support
- grandMA2 Mode2 compatibility

Source: [MA Lighting — grandMA3](https://www.malighting.com/grandma3/)`,
    descriptionZh: `grandMA3 full-size 是 MA Lighting 旗舰灯光控台，广泛应用于全球大型巡演与演出。

![grandMA3 full-size](${maImg("5a56c7f0-5f67-414d-8ca1-dfec17233ee0")})

## 亮点
- 超大 Multi-Touch 触摸屏
- 配合处理单元最高 250,000 参数
- 原生 GDTF / MVR 支持
- 兼容 grandMA2 Mode2

来源：[MA Lighting 官网](https://www.malighting.com/grandma3/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 89900,
    image: maImg("5a56c7f0-5f67-414d-8ca1-dfec17233ee0"),
    images: [maImg("5a56c7f0-5f67-414d-8ca1-dfec17233ee0")],
    specsEn: [
      { label: "Parameters", value: "Up to 250,000 (with PU)" },
      { label: "Protocol", value: "MA-Net3, Art-Net, sACN" },
      { label: "Software", value: "grandMA3 / Mode2 (grandMA2)" },
    ],
    specsZh: [
      { label: "参数", value: "最高 250,000（含处理单元）" },
      { label: "协议", value: "MA-Net3、Art-Net、sACN" },
      { label: "软件", value: "grandMA3 / Mode2" },
    ],
    highlightsEn: ["Industry flagship for touring", "Motorized playback faders", "Dual encoders"],
    highlightsZh: ["巡演行业旗舰", "电动回放推子", "双编码器"],
    stock: 5,
    featured: true,
    warranty: "2 years",
    sourceUrl: "https://www.malighting.com/grandma3/",
  },
  {
    slug: "grandma3-light",
    sku: "MA-4010502",
    brand: "MA Lighting",
    nameEn: "grandMA3 light",
    nameZh: "grandMA3 light 控台",
    shortDescEn: "Compact grandMA3 console — full power with a smaller footprint.",
    shortDescZh: "紧凑版 grandMA3，功能完整、体积更小。",
    descriptionEn: `The grandMA3 light delivers professional grandMA3 control in a more compact form factor — ideal when space on tour buses or tech desks is limited.

![grandMA3 light](${maImg("22ea1a65-8443-46b1-87a1-e075ba751ce0")})

Source: [MA Lighting — grandMA3](https://www.malighting.com/grandma3/)`,
    descriptionZh: `grandMA3 light 在更紧凑的机身中提供完整 grandMA3 控制能力，适合空间有限的应用场景。

![grandMA3 light](${maImg("22ea1a65-8443-46b1-87a1-e075ba751ce0")})

来源：[MA Lighting 官网](https://www.malighting.com/grandma3/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 54900,
    image: maImg("22ea1a65-8443-46b1-87a1-e075ba751ce0"),
    images: [maImg("22ea1a65-8443-46b1-87a1-e075ba751ce0")],
    specsEn: [
      { label: "Form factor", value: "Compact touring console" },
      { label: "Faders", value: "Motorized playback faders" },
      { label: "Compatibility", value: "grandMA2 / grandMA3" },
    ],
    specsZh: [
      { label: "形态", value: "紧凑巡演控台" },
      { label: "推子", value: "电动回放推子" },
      { label: "兼容", value: "grandMA2 / grandMA3" },
    ],
    highlightsEn: ["Smaller than full-size", "Full grandMA3 feature set", "Tour-ready build"],
    highlightsZh: ["比 full-size 更紧凑", "完整 grandMA3 功能", "巡演级结构"],
    stock: 8,
    featured: true,
    warranty: "2 years",
    sourceUrl: "https://www.malighting.com/grandma3/",
  },
  {
    slug: "grandma3-compact-xt",
    sku: "MA-4010505",
    brand: "MA Lighting",
    nameEn: "grandMA3 compact XT",
    nameZh: "grandMA3 compact XT",
    shortDescEn: "8,192 parameters, 2 foldable touchscreens, 60 playbacks — compact powerhouse.",
    shortDescZh: "8192 参数、双折叠触摸屏、60 回放 — 紧凑强力控台。",
    descriptionEn: `The grandMA3 compact XT is the larger compact model with 8,192 parameters, dual foldable multi-touch monitors, 5 dual encoders and 60 physical playbacks.

![grandMA3 compact XT](${maImg("9b9aadb2-3763-4689-bace-d93a83613691")})

Source: [MA Lighting — grandMA3 compact XT](https://www.malighting.com/product/grandma3-compact-xt-4010505/)`,
    descriptionZh: `grandMA3 compact XT 配备 8192 参数、双折叠 Multi-Touch 屏、5 组双编码器与 60 路物理回放。

![grandMA3 compact XT](${maImg("9b9aadb2-3763-4689-bace-d93a83613691")})

来源：[MA Lighting 官网](https://www.malighting.com/product/grandma3-compact-xt-4010505/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 24900,
    image: maImg("9b9aadb2-3763-4689-bace-d93a83613691"),
    images: [maImg("9b9aadb2-3763-4689-bace-d93a83613691")],
    specsEn: [
      { label: "Parameters", value: "8,192 (HTP/LTP)" },
      { label: "DMX", value: "6 out / 1 in" },
      { label: "Weight", value: "20 kg / 45 lbs" },
    ],
    specsZh: [
      { label: "参数", value: "8,192（HTP/LTP）" },
      { label: "DMX", value: "6 路输出 / 1 路输入" },
      { label: "重量", value: "20 kg" },
    ],
    highlightsEn: ["8,192 parameters standard", "Foldable dual screens", "16 assignable X-keys"],
    highlightsZh: ["标配 8192 参数", "双屏可折叠", "16 个 X-Key"],
    stock: 12,
    featured: true,
    warranty: "2 years",
    sourceUrl: "https://www.malighting.com/product/grandma3-compact-xt-4010505/",
  },
  {
    slug: "grandma3-compact",
    sku: "MA-4010506",
    brand: "MA Lighting",
    nameEn: "grandMA3 compact",
    nameZh: "grandMA3 compact",
    shortDescEn: "Ultra-portable grandMA3 compact console for owner/operators.",
    shortDescZh: "超便携 grandMA3 compact，适合个体经营者。",
    descriptionEn: `The grandMA3 compact offers full system benefits in the smallest grandMA3 hardware format — easy to transport for clubs, churches and rental.

![grandMA3 compact](${maImg("dd5d9ddc-5021-42c6-8a5b-ab3d7396534f")})

Source: [MA Lighting — grandMA3](https://www.malighting.com/product/grandma3/)`,
    descriptionZh: `grandMA3 compact 是最小尺寸的 grandMA3 硬件，便于运输，适合酒吧、教堂与租赁。

![grandMA3 compact](${maImg("dd5d9ddc-5021-42c6-8a5b-ab3d7396534f")})

来源：[MA Lighting 官网](https://www.malighting.com/product/grandma3/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 18900,
    image: maImg("dd5d9ddc-5021-42c6-8a5b-ab3d7396534f"),
    images: [maImg("dd5d9ddc-5021-42c6-8a5b-ab3d7396534f")],
    specsEn: [
      { label: "Format", value: "Compact foldable console" },
      { label: "Target use", value: "Clubs, HOAs, rental" },
      { label: "Software", value: "grandMA3 / Mode2" },
    ],
    specsZh: [
      { label: "形态", value: "紧凑折叠控台" },
      { label: "适用", value: "酒吧、教堂、租赁" },
      { label: "软件", value: "grandMA3 / Mode2" },
    ],
    highlightsEn: ["Lightweight chassis", "Owner/operator friendly", "Scalable with PU"],
    highlightsZh: ["轻量机身", "个体经营者友好", "可扩展处理单元"],
    stock: 15,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://www.malighting.com/product/grandma3/",
  },
  {
    slug: "grandma3-onpc-command-wing-xt",
    sku: "MA-4010509",
    brand: "MA Lighting",
    nameEn: "grandMA3 onPC command wing XT",
    nameZh: "grandMA3 onPC command wing XT",
    shortDescEn: "Tactile grandMA3 onPC control surface — XT wing with full command area.",
    shortDescZh: "grandMA3 onPC 控台扩展翼 — XT 版完整命令区。",
    descriptionEn: `Combine grandMA3 onPC software with the command wing XT for tactile control without the full console price point.

![command wing XT](${maImg("b6846373-d6b1-40ea-b3d7-3f58c0da7085")})

Source: [MA Lighting — grandMA3 onPC](https://www.malighting.com/grandma3/)`,
    descriptionZh: `配合 grandMA3 onPC 软件使用 command wing XT，以更低成本获得实体操控体验。

![command wing XT](${maImg("b6846373-d6b1-40ea-b3d7-3f58c0da7085")})

来源：[MA Lighting 官网](https://www.malighting.com/grandma3/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 8900,
    image: maImg("b6846373-d6b1-40ea-b3d7-3f58c0da7085"),
    images: [maImg("b6846373-d6b1-40ea-b3d7-3f58c0da7085")],
    specsEn: [
      { label: "Requires", value: "grandMA3 onPC software" },
      { label: "Parameters", value: "Up to 4,096 (with DMX-key)" },
      { label: "Connection", value: "USB to PC/Mac" },
    ],
    specsZh: [
      { label: "需要", value: "grandMA3 onPC 软件" },
      { label: "参数", value: "最高 4096（含 DMX-key）" },
      { label: "连接", value: "USB 至 PC/Mac" },
    ],
    highlightsEn: ["Compact XT form", "Full command section", "Ideal for pre-programming"],
    highlightsZh: ["XT 紧凑外形", "完整命令区", "适合预编程"],
    stock: 20,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://www.malighting.com/grandma3/",
  },
  {
    slug: "grandma3-onpc-command-wing",
    sku: "MA-4010508",
    brand: "MA Lighting",
    nameEn: "grandMA3 onPC command wing",
    nameZh: "grandMA3 onPC command wing",
    shortDescEn: "Entry onPC wing — tactile faders and keys for grandMA3 onPC.",
    shortDescZh: "入门 onPC 扩展翼，实体推子与按键。",
    descriptionEn: `The grandMA3 onPC command wing adds physical playbacks and encoders to grandMA3 onPC software installations.

![command wing](${maImg("d7826640-bb2e-4474-83a6-ba4e233494ab")})

Source: [MA Lighting — grandMA3](https://www.malighting.com/grandma3/)`,
    descriptionZh: `grandMA3 onPC command wing 为 onPC 软件系统增加实体回放与编码器控制。

![command wing](${maImg("d7826640-bb2e-4474-83a6-ba4e233494ab")})

来源：[MA Lighting 官网](https://www.malighting.com/grandma3/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 5900,
    image: maImg("d7826640-bb2e-4474-83a6-ba4e233494ab"),
    images: [maImg("d7826640-bb2e-4474-83a6-ba4e233494ab")],
    specsEn: [
      { label: "Type", value: "onPC control surface" },
      { label: "OS", value: "Windows 11/10, macOS" },
      { label: "Use case", value: "Education, backup, pre-viz" },
    ],
    specsZh: [
      { label: "类型", value: "onPC 控制面板" },
      { label: "系统", value: "Windows 11/10、macOS" },
      { label: "场景", value: "教学、备份、预编程" },
    ],
    highlightsEn: ["Affordable MA ecosystem entry", "USB plug-and-play", "Training friendly"],
    highlightsZh: ["MA 生态入门", "USB 即插即用", "适合培训"],
    stock: 25,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://www.malighting.com/grandma3/",
  },
  {
    slug: "grandma3-onpc-fader-wing",
    sku: "MA-4010510",
    brand: "MA Lighting",
    nameEn: "grandMA3 onPC fader wing",
    nameZh: "grandMA3 onPC fader wing",
    shortDescEn: "Additional playback faders for grandMA3 onPC systems.",
    shortDescZh: "为 grandMA3 onPC 增加回放推子扩展。",
    descriptionEn: `Expand playback capacity of a grandMA3 onPC setup with dedicated motorized fader wing.

![fader wing](${maImg("fff9dc32-473f-4d03-862a-dd1d4bac4f05")})

Source: [MA Lighting — grandMA3](https://www.malighting.com/grandma3/)`,
    descriptionZh: `通过 fader wing 扩展 grandMA3 onPC 系统的回放推子数量。

![fader wing](${maImg("fff9dc32-473f-4d03-862a-dd1d4bac4f05")})

来源：[MA Lighting 官网](https://www.malighting.com/grandma3/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 3200,
    image: maImg("fff9dc32-473f-4d03-862a-dd1d4bac4f05"),
    images: [maImg("fff9dc32-473f-4d03-862a-dd1d4bac4f05")],
    specsEn: [
      { label: "Function", value: "Playback fader expansion" },
      { label: "Requires", value: "grandMA3 onPC + command wing" },
      { label: "Faders", value: "Motorized playback" },
    ],
    specsZh: [
      { label: "功能", value: "回放推子扩展" },
      { label: "需要", value: "onPC + command wing" },
      { label: "推子", value: "电动回放" },
    ],
    highlightsEn: ["More playbacks for busking", "RGB fader light pipes", "Road case available"],
    highlightsZh: ["更多回放路数", "RGB 推子灯条", "可选航空箱"],
    stock: 18,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://www.malighting.com/grandma3/",
  },
  {
    slug: "grandma3-replay-unit",
    sku: "MA-4010503",
    brand: "MA Lighting",
    nameEn: "grandMA3 replay unit",
    nameZh: "grandMA3 replay unit 回放单元",
    shortDescEn: "Dedicated replay / tech-desk unit for grandMA3 sessions.",
    shortDescZh: "grandMA3 专用回放/技术台扩展单元。",
    descriptionEn: `The grandMA3 replay unit provides additional playback control for multi-operator grandMA3 systems.

![replay unit](${maImg("a59e56cd-d1e6-496f-99d0-02964516ef00")})

Source: [MA Lighting — grandMA3](https://www.malighting.com/product/grandma3/)`,
    descriptionZh: `grandMA3 replay unit 为多操作员 grandMA3 系统提供额外回放控制。

![replay unit](${maImg("a59e56cd-d1e6-496f-99d0-02964516ef00")})

来源：[MA Lighting 官网](https://www.malighting.com/product/grandma3/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 12900,
    image: maImg("a59e56cd-d1e6-496f-99d0-02964516ef00"),
    images: [maImg("a59e56cd-d1e6-496f-99d0-02964516ef00")],
    specsEn: [
      { label: "Role", value: "Replay / tech desk" },
      { label: "Network", value: "MA-Net3 session" },
      { label: "Use", value: "FOH + tech split" },
    ],
    specsZh: [
      { label: "角色", value: "回放 / 技术台" },
      { label: "网络", value: "MA-Net3 会话" },
      { label: "用途", value: "FOH 与技术台分工" },
    ],
    highlightsEn: ["Multi-user sessions", "Tour tech desk standard", "Compact footprint"],
    highlightsZh: ["多用户会话", "巡演技术台标配", "紧凑体积"],
    stock: 10,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://www.malighting.com/product/grandma3/",
  },
  {
    slug: "grandma3-processing-unit-l",
    sku: "MA-4010513",
    brand: "MA Lighting",
    nameEn: "grandMA3 processing unit L",
    nameZh: "grandMA3 processing unit L",
    shortDescEn: "Scale grandMA3 parameter count for large rigs.",
    shortDescZh: "扩展 grandMA3 参数规模，适配大型系统。",
    descriptionEn: `grandMA3 processing units expand the parameter capacity of a grandMA3 session up to 250,000 parameters.

![processing unit](${maImg("63be3420-8251-42b3-b672-9ae54f51e233")})

Source: [MA Lighting — grandMA3 Processing](https://www.malighting.com/product/grandma3/)`,
    descriptionZh: `grandMA3 处理单元可将系统参数扩展至最高 250,000。

![processing unit](${maImg("63be3420-8251-42b3-b672-9ae54f51e233")})

来源：[MA Lighting 官网](https://www.malighting.com/product/grandma3/)`,
    categoryEn: "Control & Accessories",
    categoryZh: "控制与配件",
    price: 15900,
    image: maImg("63be3420-8251-42b3-b672-9ae54f51e233"),
    images: [maImg("63be3420-8251-42b3-b672-9ae54f51e233")],
    specsEn: [
      { label: "Size", value: "L (Large)" },
      { label: "Max parameters", value: "250,000 (stacked)" },
      { label: "Mount", value: "Rack mount" },
    ],
    specsZh: [
      { label: "规格", value: "L（大）" },
      { label: "最大参数", value: "250,000（堆叠）" },
      { label: "安装", value: "机架式" },
    ],
    highlightsEn: ["Arena-scale rigs", "Redundant options", "MA-Net3 backbone"],
    highlightsZh: ["场馆级系统", "可冗余", "MA-Net3 骨干网"],
    stock: 8,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://www.malighting.com/product/grandma3/",
  },
  {
    slug: "grandma3-onpc-4port-node-4k",
    sku: "MA-4010521",
    brand: "MA Lighting",
    nameEn: "grandMA3 onPC 4Port Node 4k",
    nameZh: "grandMA3 onPC 4Port Node 4k",
    shortDescEn: "4-port DMX node for grandMA3 onPC — 4,096 parameters.",
    shortDescZh: "grandMA3 onPC 四路 DMX 节点，4096 参数。",
    descriptionEn: `Network DMX node for standalone grandMA3 onPC systems — 4 universes, 4,096 parameters.

![4Port Node](${maImg("f70bdb78-e99f-4fe5-a468-437f90d1b4b4")})

Source: [MA Lighting — grandMA3 DMX Distribution](https://www.malighting.com/product/grandma3/)`,
    descriptionZh: `grandMA3 onPC 独立系统的网络 DMX 节点 — 4 宇宙，4096 参数。

![4Port Node](${maImg("f70bdb78-e99f-4fe5-a468-437f90d1b4b4")})

来源：[MA Lighting 官网](https://www.malighting.com/product/grandma3/)`,
    categoryEn: "Control & Accessories",
    categoryZh: "控制与配件",
    price: 2800,
    image: maImg("f70bdb78-e99f-4fe5-a468-437f90d1b4b4"),
    images: [maImg("f70bdb78-e99f-4fe5-a468-437f90d1b4b4")],
    specsEn: [
      { label: "Ports", value: "4 × DMX512 out" },
      { label: "Parameters", value: "4,096" },
      { label: "Network", value: "etherCON / MA-Net3" },
    ],
    specsZh: [
      { label: "端口", value: "4 × DMX512 输出" },
      { label: "参数", value: "4,096" },
      { label: "网络", value: "etherCON / MA-Net3" },
    ],
    highlightsEn: ["Standalone onPC output", "Tour-grade connectors", "Rack or truss mount"],
    highlightsZh: ["onPC 独立输出", "巡演级接口", "机架/桁架安装"],
    stock: 30,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://www.malighting.com/product/grandma3/",
  },

  // ── Avolites Titan (10) ────────────────────────────────────────────────
  {
    slug: "avolites-d9-330",
    sku: "AV-D9-330",
    brand: "Avolites",
    nameEn: "Avolites D9-330",
    nameZh: "Avolites D9-330 旗舰控台",
    shortDescEn: "Flagship Titan console — 3×15.6″ touchscreens, 30 motorized faders.",
    shortDescZh: "Titan 旗舰控台 — 3 块 15.6 寸触摸屏，30 路电动推子。",
    descriptionEn: `Our flagship console, designed by visual designers for visual designers — the D9-330 powers the most demanding shows.

![D9-330](${avImg("/app/uploads/intervention/cache/studio_front_light_v2_WEB-e1641818729581-1257699191.png")})

- 30 motorized Penny & Giles faders
- 70 optical rotary playback encoders
- Titan Net Processor expansion

Source: [Avolites — D9-330](https://www.avolites.com/products/d9-330/)`,
    descriptionZh: `Avolites 旗舰 Titan 控台 D9-330，为视觉设计师打造，驱动最苛刻的演出。

![D9-330](${avImg("/app/uploads/intervention/cache/studio_front_light_v2_WEB-e1641818729581-1257699191.png")})

- 30 路 Penny & Giles 电动推子
- 70 路光学旋转回放编码器
- 可扩展 Titan Net Processor

来源：[Avolites 官网](https://www.avolites.com/products/d9-330/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 65000,
    image: avImg("/app/uploads/intervention/cache/studio_front_light_v2_WEB-e1641818729581-1257699191.png"),
    images: [avImg("/app/uploads/intervention/cache/studio_front_light_v2_WEB-e1641818729581-1257699191.png")],
    specsEn: [
      { label: "Screens", value: "3 × 15.6″ touch" },
      { label: "Weight", value: "68 kg" },
      { label: "Software", value: "Titan" },
    ],
    specsZh: [
      { label: "屏幕", value: "3 × 15.6 寸触摸" },
      { label: "重量", value: "68 kg" },
      { label: "软件", value: "Titan" },
    ],
    highlightsEn: ["Key Frame Shapes effects", "Synergy Ai video ready", "Multi-user networking"],
    highlightsZh: ["Key Frame Shapes 效果", "Synergy Ai 视频联动", "多用户联网"],
    stock: 4,
    featured: true,
    warranty: "2 years",
    sourceUrl: "https://www.avolites.com/products/d9-330/",
  },
  {
    slug: "avolites-d9-215",
    sku: "AV-D9-215",
    brand: "Avolites",
    nameEn: "Avolites D9-215",
    nameZh: "Avolites D9-215",
    shortDescEn: "Flagship D9 in a compact 2-screen layout.",
    shortDescZh: "旗舰 D9 双屏紧凑版。",
    descriptionEn: `The D9-215 brings D9 flagship capability to a more compact two-screen footprint.

![D9-215](${avImg("/app/uploads/intervention/cache/studio_front_light_v2_WEB-e1641818729581-3199457559.png")})

Source: [Avolites — D9-215](https://www.avolites.com/products/d9-215/)`,
    descriptionZh: `D9-215 在双屏紧凑布局中保留 D9 旗舰能力。

![D9-215](${avImg("/app/uploads/intervention/cache/studio_front_light_v2_WEB-e1641818729581-3199457559.png")})

来源：[Avolites 官网](https://www.avolites.com/products/d9-215/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 52000,
    image: avImg("/app/uploads/intervention/cache/studio_front_light_v2_WEB-e1641818729581-3199457559.png"),
    images: [avImg("/app/uploads/intervention/cache/studio_front_light_v2_WEB-e1641818729581-3199457559.png")],
    specsEn: [
      { label: "Series", value: "D9 Titan" },
      { label: "Layout", value: "2-screen compact" },
      { label: "Software", value: "Titan" },
    ],
    specsZh: [
      { label: "系列", value: "D9 Titan" },
      { label: "布局", value: "双屏紧凑" },
      { label: "软件", value: "Titan" },
    ],
    highlightsEn: ["Same Titan engine as D9-330", "Tour-friendly size", "Motorized faders"],
    highlightsZh: ["与 D9-330 同 Titan 内核", "更适合巡演", "电动推子"],
    stock: 6,
    featured: true,
    warranty: "2 years",
    sourceUrl: "https://www.avolites.com/products/d9-215/",
  },
  {
    slug: "avolites-d7-330",
    sku: "AV-D7-330",
    brand: "Avolites",
    nameEn: "Avolites D7-330",
    nameZh: "Avolites D7-330",
    shortDescEn: "Maximum programming power with minimal weight — D7 flagship.",
    shortDescZh: "D7 旗舰 — 最强编程能力，重量更轻。",
    descriptionEn: `Maximum control and programming power for minimal weight — the D7-330 Titan console.

![D7-330](${avImg("/app/uploads/intervention/cache/Avolites-First-D7s-in-Serbia-202A0645-Edit-2-835800640.jpg")})

Source: [Avolites — D7-330](https://www.avolites.com/products/d7-330/)`,
    descriptionZh: `D7-330 在更轻机身中提供最强 Titan 编程与控制能力。

![D7-330](${avImg("/app/uploads/intervention/cache/Avolites-First-D7s-in-Serbia-202A0645-Edit-2-835800640.jpg")})

来源：[Avolites 官网](https://www.avolites.com/products/d7-330/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 42000,
    image: avImg("/app/uploads/intervention/cache/Avolites-First-D7s-in-Serbia-202A0645-Edit-2-835800640.jpg"),
    images: [avImg("/app/uploads/intervention/cache/Avolites-First-D7s-in-Serbia-202A0645-Edit-2-835800640.jpg")],
    specsEn: [
      { label: "Series", value: "D7 Titan" },
      { label: "Target", value: "Tour & performance" },
      { label: "Software", value: "Titan" },
    ],
    specsZh: [
      { label: "系列", value: "D7 Titan" },
      { label: "定位", value: "巡演与演出" },
      { label: "软件", value: "Titan" },
    ],
    highlightsEn: ["Lighter than D9", "Full Titan feature set", "Pixel mapping ready"],
    highlightsZh: ["比 D9 更轻", "完整 Titan 功能", "支持像素映射"],
    stock: 7,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://www.avolites.com/products/d7-330/",
  },
  {
    slug: "avolites-d7-215",
    sku: "AV-D7-215",
    brand: "Avolites",
    nameEn: "Avolites D7-215",
    nameZh: "Avolites D7-215",
    shortDescEn: "The ultimate travel and performance console.",
    shortDescZh: "终极旅行与演出控台。",
    descriptionEn: `The D7-215 is Avolites' ultimate travel and performance console — compact D7 power.

![D7-215](${avImg("/app/uploads/intervention/cache/Avolites-First-D7s-in-Serbia-202A0645-Edit-2-1042179752.jpg")})

Source: [Avolites — D7-215](https://www.avolites.com/products/d7-215/)`,
    descriptionZh: `D7-215 是 Avolites 终极旅行与演出控台，紧凑 D7 动力。

![D7-215](${avImg("/app/uploads/intervention/cache/Avolites-First-D7s-in-Serbia-202A0645-Edit-2-1042179752.jpg")})

来源：[Avolites 官网](https://www.avolites.com/products/d7-215/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 35000,
    image: avImg("/app/uploads/intervention/cache/Avolites-First-D7s-in-Serbia-202A0645-Edit-2-1042179752.jpg"),
    images: [avImg("/app/uploads/intervention/cache/Avolites-First-D7s-in-Serbia-202A0645-Edit-2-1042179752.jpg")],
    specsEn: [
      { label: "Series", value: "D7" },
      { label: "Format", value: "2-screen travel" },
      { label: "Software", value: "Titan" },
    ],
    specsZh: [
      { label: "系列", value: "D7" },
      { label: "形态", value: "双屏旅行版" },
      { label: "软件", value: "Titan" },
    ],
    highlightsEn: ["Fly-friendly footprint", "Titan Net expansion", "Quicksketch labelling"],
    highlightsZh: ["适合航空托运", "Titan Net 扩展", "Quicksketch 标签"],
    stock: 8,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://www.avolites.com/products/d7-215/",
  },
  {
    slug: "avolites-d3-110",
    sku: "AV-D3-110",
    brand: "Avolites",
    nameEn: "Avolites D3-110",
    nameZh: "Avolites D3-110",
    shortDescEn: "Compact 24U Titan console with touchscreen.",
    shortDescZh: "紧凑 24U Titan 控台，带触摸屏。",
    descriptionEn: `Compact 24U Titan console with touchscreen — D3 series power for mid-size rigs.

![D3-110](${avImg("/app/uploads/intervention/cache/D3-110-Front-Transparent-1-1257699191.png")})

Source: [Avolites — D3-110](https://www.avolites.com/products/d3-110/)`,
    descriptionZh: `紧凑 24U Titan 控台，触摸屏操作，适合中型系统。

![D3-110](${avImg("/app/uploads/intervention/cache/D3-110-Front-Transparent-1-1257699191.png")})

来源：[Avolites 官网](https://www.avolites.com/products/d3-110/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 22000,
    image: avImg("/app/uploads/intervention/cache/D3-110-Front-Transparent-1-1257699191.png"),
    images: [avImg("/app/uploads/intervention/cache/D3-110-Front-Transparent-1-1257699191.png")],
    specsEn: [
      { label: "Rack units", value: "24U form" },
      { label: "Software", value: "Titan" },
      { label: "Touch", value: "Integrated touchscreen" },
    ],
    specsZh: [
      { label: "规格", value: "24U 形态" },
      { label: "软件", value: "Titan" },
      { label: "触摸", value: "集成触摸屏" },
    ],
    highlightsEn: ["Mid-size venue sweet spot", "Rental fleet favorite", "TNP expandable"],
    highlightsZh: ["中型场馆首选", "租赁车队常用", "可扩展 TNP"],
    stock: 10,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://www.avolites.com/products/d3-110/",
  },
  {
    slug: "avolites-d3-010",
    sku: "AV-D3-010",
    brand: "Avolites",
    nameEn: "Avolites D3-010",
    nameZh: "Avolites D3-010",
    shortDescEn: "Titan power in a compact 8U console.",
    shortDescZh: "8U 紧凑 Titan 控台。",
    descriptionEn: `Titan power in a compact 8U console — ideal for clubs and regional tours.

![D3-010](${avImg("/app/uploads/intervention/cache/D3-010-Front-Transparent-1-1257699191.png")})

Source: [Avolites — D3-010](https://www.avolites.com/products/d3-010/)`,
    descriptionZh: `8U 紧凑机身中的 Titan 动力，适合酒吧与区域巡演。

![D3-010](${avImg("/app/uploads/intervention/cache/D3-010-Front-Transparent-1-1257699191.png")})

来源：[Avolites 官网](https://www.avolites.com/products/d3-010/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 14500,
    image: avImg("/app/uploads/intervention/cache/D3-010-Front-Transparent-1-1257699191.png"),
    images: [avImg("/app/uploads/intervention/cache/D3-010-Front-Transparent-1-1257699191.png")],
    specsEn: [
      { label: "Rack units", value: "8U" },
      { label: "Software", value: "Titan" },
      { label: "Use", value: "Club / regional tour" },
    ],
    specsZh: [
      { label: "规格", value: "8U" },
      { label: "软件", value: "Titan" },
      { label: "场景", value: "酒吧 / 区域巡演" },
    ],
    highlightsEn: ["Entry to Titan ecosystem", "Compact footprint", "Full personality library"],
    highlightsZh: ["Titan 生态入门", "紧凑体积", "完整灯库"],
    stock: 14,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://www.avolites.com/products/d3-010/",
  },
  {
    slug: "avolites-d3-wing",
    sku: "AV-D3-WING",
    brand: "Avolites",
    nameEn: "Avolites D3 Wing",
    nameZh: "Avolites D3 Wing 扩展翼",
    shortDescEn: "Add more control to your D3 setup.",
    shortDescZh: "为 D3 系统增加控制扩展。",
    descriptionEn: `Add more playback and control to your D3 Titan setup with the D3 Wing.

![D3 Wing](${avImg("/app/uploads/intervention/cache/D3-Wing-Transparent-1-1257699191.png")})

Source: [Avolites — D3 Wing](https://www.avolites.com/products/d3-wing/)`,
    descriptionZh: `D3 Wing 为 D3 Titan 系统增加回放与控制扩展。

![D3 Wing](${avImg("/app/uploads/intervention/cache/D3-Wing-Transparent-1-1257699191.png")})

来源：[Avolites 官网](https://www.avolites.com/products/d3-wing/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 6800,
    image: avImg("/app/uploads/intervention/cache/D3-Wing-Transparent-1-1257699191.png"),
    images: [avImg("/app/uploads/intervention/cache/D3-Wing-Transparent-1-1257699191.png")],
    specsEn: [
      { label: "Type", value: "D3 expansion wing" },
      { label: "Requires", value: "D3 console" },
      { label: "Software", value: "Titan" },
    ],
    specsZh: [
      { label: "类型", value: "D3 扩展翼" },
      { label: "需要", value: "D3 控台" },
      { label: "软件", value: "Titan" },
    ],
    highlightsEn: ["More playbacks", "Matches D3 aesthetics", "Rental stackable"],
    highlightsZh: ["更多回放", "与 D3 外观一致", "租赁可堆叠"],
    stock: 16,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://www.avolites.com/products/d3-wing/",
  },
  {
    slug: "avolites-t1",
    sku: "AV-T1",
    brand: "Avolites",
    nameEn: "Avolites Titan T1",
    nameZh: "Avolites Titan T1",
    shortDescEn: "Compact Titan USB interface — bus-powered console surface.",
    shortDescZh: "紧凑 Titan USB 接口控台，总线供电。",
    descriptionEn: `The Titan T1 brings Avolites Titan control to a ultra-compact USB surface.

![T1](${avImg("/app/uploads/intervention/cache/T1_Bus1-835800640.jpg")})

Source: [Avolites — T1](https://www.avolites.com/products/t1/)`,
    descriptionZh: `Titan T1 将 Avolites Titan 控制集成到超紧凑 USB 控制面板。

![T1](${avImg("/app/uploads/intervention/cache/T1_Bus1-835800640.jpg")})

来源：[Avolites 官网](https://www.avolites.com/products/t1/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 1200,
    image: avImg("/app/uploads/intervention/cache/T1_Bus1-835800640.jpg"),
    images: [avImg("/app/uploads/intervention/cache/T1_Bus1-835800640.jpg")],
    specsEn: [
      { label: "Connection", value: "USB" },
      { label: "Software", value: "Titan PC Suite" },
      { label: "Power", value: "Bus powered" },
    ],
    specsZh: [
      { label: "连接", value: "USB" },
      { label: "软件", value: "Titan PC Suite" },
      { label: "供电", value: "总线供电" },
    ],
    highlightsEn: ["Learn Titan on a budget", "Portable laptop wing", "Education standard"],
    highlightsZh: ["低成本学 Titan", "笔记本扩展翼", "教学常用"],
    stock: 40,
    featured: false,
    warranty: "1 year",
    sourceUrl: "https://www.avolites.com/products/t1/",
  },
  {
    slug: "avolites-sapphire-touch",
    sku: "AV-SAPPHIRE",
    brand: "Avolites",
    nameEn: "Avolites Sapphire Touch",
    nameZh: "Avolites Sapphire Touch",
    shortDescEn: "All-in-one Titan touchscreen console.",
    shortDescZh: "一体化 Titan 触摸控台。",
    descriptionEn: `Sapphire Touch — an all-in-one Avolites Titan touchscreen console for fast programming.

![Sapphire Touch](${avImg("/app/uploads/intervention/cache/sapphire-touch-front-1257699191.png")})

Source: [Avolites — Sapphire Touch](https://www.avolites.com/products/sapphire-touch/)`,
    descriptionZh: `Sapphire Touch 是一体化 Avolites Titan 触摸控台，快速编程。

![Sapphire Touch](${avImg("/app/uploads/intervention/cache/sapphire-touch-front-1257699191.png")})

来源：[Avolites 官网](https://www.avolites.com/products/sapphire-touch/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 9800,
    image: avImg("/app/uploads/intervention/cache/sapphire-touch-front-1257699191.png"),
    images: [avImg("/app/uploads/intervention/cache/sapphire-touch-front-1257699191.png")],
    specsEn: [
      { label: "Interface", value: "Multi-touch screen" },
      { label: "Software", value: "Titan" },
      { label: "Use", value: "Club, corporate, rental" },
    ],
    specsZh: [
      { label: "界面", value: "Multi-Touch 屏" },
      { label: "软件", value: "Titan" },
      { label: "场景", value: "酒吧、商演、租赁" },
    ],
    highlightsEn: ["Touch-first workflow", "Built-in Titan", "Fast cue building"],
    highlightsZh: ["触摸优先工作流", "内置 Titan", "快速建 cue"],
    stock: 12,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://www.avolites.com/products/sapphire-touch/",
  },
  {
    slug: "avolites-t3",
    sku: "AV-T3",
    brand: "Avolites",
    nameEn: "Avolites Titan T3",
    nameZh: "Avolites Titan T3",
    shortDescEn: "Mid-size Titan USB wing with more playbacks.",
    shortDescZh: "中型 Titan USB 扩展翼，更多回放。",
    descriptionEn: `The Titan T3 USB wing adds more playbacks and control to Titan PC Suite setups.

![T3](${avImg("/app/uploads/intervention/cache/T1_Bus1-1042179752.jpg")})

Source: [Avolites — T3](https://www.avolites.com/products/t3/)`,
    descriptionZh: `Titan T3 USB 扩展翼为 Titan PC Suite 增加更多回放与控制。

![T3](${avImg("/app/uploads/intervention/cache/T1_Bus1-1042179752.jpg")})

来源：[Avolites 官网](https://www.avolites.com/products/t3/)`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 2400,
    image: avImg("/app/uploads/intervention/cache/T1_Bus1-1042179752.jpg"),
    images: [avImg("/app/uploads/intervention/cache/T1_Bus1-1042179752.jpg")],
    specsEn: [
      { label: "Connection", value: "USB" },
      { label: "Software", value: "Titan PC Suite" },
      { label: "Vs T1", value: "More playbacks" },
    ],
    specsZh: [
      { label: "连接", value: "USB" },
      { label: "软件", value: "Titan PC Suite" },
      { label: "对比 T1", value: "更多回放" },
    ],
    highlightsEn: ["Step up from T1", "Portable busking", "Titan personality share"],
    highlightsZh: ["T1 升级选择", "便携 busking", "共享 Titan 灯库"],
    stock: 22,
    featured: false,
    warranty: "1 year",
    sourceUrl: "https://www.avolites.com/products/t3/",
  },

  // ── Chauvet Professional & other fixtures (10) ──────────────────────────
  {
    slug: "chauvet-maverick-mk3-profile",
    sku: "CP-MK3-PRO",
    brand: "Chauvet Professional",
    nameEn: "Maverick MK3 Profile",
    nameZh: "Maverick MK3 Profile 切割灯",
    shortDescEn: "820W LED profile — 51,000 source lumens, CMY+CTO, 9:1 zoom.",
    shortDescZh: "820W LED 切割灯 — 51000 源光通量，CMY+CTO，9:1 变焦。",
    descriptionEn: `A powerful LED profile fixture delivering immense output, four-blade framing, CMY + CTO, and adjustable CRI — for touring, theatre and broadcast.

![Maverick MK3 Profile](https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-PROFILE-FRONT-FEAT.png)

Source: [Chauvet Professional](https://chauvetprofessional.com/product/maverick-mk3-profile/)`,
    descriptionZh: `820W LED 切割灯，四叶片造型、CMY+CTO 混色、可调 CRI，适合巡演、剧院与广播。

![Maverick MK3 Profile](https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-PROFILE-FRONT-FEAT.png)

来源：[Chauvet Professional 官网](https://chauvetprofessional.com/product/maverick-mk3-profile/)`,
    categoryEn: "Stage Fixtures",
    categoryZh: "舞台灯具",
    price: 8999,
    image: "https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-PROFILE-FRONT-FEAT.png",
    images: ["https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-PROFILE-FRONT-FEAT.png"],
    specsEn: [
      { label: "Source", value: "820 W LED" },
      { label: "Lumens", value: "51,000 source" },
      { label: "Zoom", value: "9:1 (5.9°–64.1°)" },
      { label: "Control", value: "DMX, sACN, Art-Net, W-DMX" },
    ],
    specsZh: [
      { label: "光源", value: "820 W LED" },
      { label: "光通量", value: "51,000 源光通量" },
      { label: "变焦", value: "9:1（5.9°–64.1°）" },
      { label: "控制", value: "DMX、sACN、Art-Net、W-DMX" },
    ],
    highlightsEn: ["4-blade framing shutter", "Adjustable CRI 74–93", "Dual gobo wheels + animation"],
    highlightsZh: ["四叶片切割", "CRI 74–93 可调", "双图案轮 + 动画轮"],
    stock: 18,
    featured: true,
    warranty: "2 years",
    sourceUrl: "https://chauvetprofessional.com/product/maverick-mk3-profile/",
  },
  {
    slug: "chauvet-maverick-mk3-spot",
    sku: "CP-MK3-SPOT",
    brand: "Chauvet Professional",
    nameEn: "Maverick MK3 Spot",
    nameZh: "Maverick MK3 Spot 光束灯",
    shortDescEn: "820W LED spot with extreme output for large-scale touring.",
    shortDescZh: "820W LED 光束灯，大型巡演高输出。",
    descriptionEn: `High-output Maverick MK3 Spot for concerts and arena-scale touring.

![Maverick MK3 Spot](https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-SPOT-FRONT-FEAT.png)

Source: [Chauvet Professional](https://chauvetprofessional.com/product/maverick-mk3-spot/)`,
    descriptionZh: `Maverick MK3 Spot 高输出 LED 光束灯，适合演唱会与大型场馆巡演。

![Maverick MK3 Spot](https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-SPOT-FRONT-FEAT.png)

来源：[Chauvet Professional 官网](https://chauvetprofessional.com/product/maverick-mk3-spot/)`,
    categoryEn: "Stage Fixtures",
    categoryZh: "舞台灯具",
    price: 8499,
    image: "https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-SPOT-FRONT-FEAT.png",
    images: ["https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-SPOT-FRONT-FEAT.png"],
    specsEn: [
      { label: "Source", value: "820 W LED" },
      { label: "Type", value: "Spot moving head" },
      { label: "Control", value: "DMX, sACN, Art-Net" },
    ],
    specsZh: [
      { label: "光源", value: "820 W LED" },
      { label: "类型", value: "光束摇头灯" },
      { label: "控制", value: "DMX、sACN、Art-Net" },
    ],
    highlightsEn: ["Tour-grade output", "Rich gobo effects", "RDM capable"],
    highlightsZh: ["巡演级亮度", "丰富图案效果", "支持 RDM"],
    stock: 20,
    featured: true,
    warranty: "2 years",
    sourceUrl: "https://chauvetprofessional.com/product/maverick-mk3-spot/",
  },
  {
    slug: "chauvet-maverick-mk3-wash",
    sku: "CP-MK3-WASH",
    brand: "Chauvet Professional",
    nameEn: "Maverick MK3 Wash",
    nameZh: "Maverick MK3 Wash 染色灯",
    shortDescEn: "820W LED wash moving head for even field coverage.",
    shortDescZh: "820W LED 染色摇头灯，均匀铺光。",
    descriptionEn: `Maverick MK3 Wash — powerful LED wash fixture for even coverage on stage.

![Maverick MK3 Wash](https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-WASH-FRONT-FEAT-1024x1024.png)

Source: [Chauvet Professional](https://chauvetprofessional.com/product/maverick-mk3-wash/)`,
    descriptionZh: `Maverick MK3 Wash 大功率 LED 染色灯，舞台均匀铺光。

![Maverick MK3 Wash](https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-WASH-FRONT-FEAT-1024x1024.png)

来源：[Chauvet Professional 官网](https://chauvetprofessional.com/product/maverick-mk3-wash/)`,
    categoryEn: "Stage Fixtures",
    categoryZh: "舞台灯具",
    price: 7999,
    image: "https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-WASH-FRONT-FEAT-1024x1024.png",
    images: ["https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-WASH-FRONT-FEAT-1024x1024.png"],
    specsEn: [
      { label: "Source", value: "820 W LED wash" },
      { label: "Beam", value: "Even wash field" },
      { label: "Control", value: "DMX, sACN, Art-Net" },
    ],
    specsZh: [
      { label: "光源", value: "820 W LED 染色" },
      { label: "光场", value: "均匀洗光" },
      { label: "控制", value: "DMX、sACN、Art-Net" },
    ],
    highlightsEn: ["MK3 family matching", "Silent modes available", "Tour power supply"],
    highlightsZh: ["MK3 系列配套", "可选静音模式", "巡演电源"],
    stock: 22,
    featured: true,
    warranty: "2 years",
    sourceUrl: "https://chauvetprofessional.com/product/maverick-mk3-wash/",
  },
  {
    slug: "chauvet-maverick-mk3-profile-cx",
    sku: "CP-MK3-PROCX",
    brand: "Chauvet Professional",
    nameEn: "Maverick MK3 Profile CX",
    nameZh: "Maverick MK3 Profile CX 广播切割灯",
    shortDescEn: "High-CRI 92 profile for broadcast and fashion — 41,000+ lumens.",
    shortDescZh: "CRI 92 高显切割灯，适合广播与时尚秀场。",
    descriptionEn: `High-CRI LED profile with superb skin tone rendering for broadcast, fashion, theatre and events.

![MK3 Profile CX](https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-PROFILE-CX-FRONT-FEAT.png)

Source: [Chauvet Professional](https://chauvetprofessional.com/product/maverick-mk3-profile-cx/)`,
    descriptionZh: `高 CRI 切割灯，卓越肤色还原，适合广播、时尚、剧院与活动。

![MK3 Profile CX](https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-PROFILE-CX-FRONT-FEAT.png)

来源：[Chauvet Professional 官网](https://chauvetprofessional.com/product/maverick-mk3-profile-cx/)`,
    categoryEn: "Stage Fixtures",
    categoryZh: "舞台灯具",
    price: 9299,
    image: "https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-PROFILE-CX-FRONT-FEAT.png",
    images: ["https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK3-PROFILE-CX-FRONT-FEAT.png"],
    specsEn: [
      { label: "CRI", value: "92 typical" },
      { label: "Lumens", value: "41,000+ source" },
      { label: "Framing", value: "4-blade, 120° rotate" },
    ],
    specsZh: [
      { label: "CRI", value: "典型 92" },
      { label: "光通量", value: "41000+ 源光通量" },
      { label: "切割", value: "四叶片，120° 旋转" },
    ],
    highlightsEn: ["Broadcast skin tones", "CMY + CTO mixing", "Animation wheel"],
    highlightsZh: ["广播级肤色", "CMY + CTO 混色", "动画轮"],
    stock: 14,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://chauvetprofessional.com/product/maverick-mk3-profile-cx/",
  },
  {
    slug: "chauvet-colorado-solo-batten",
    sku: "CP-COLO-SOLO",
    brand: "Chauvet Professional",
    nameEn: "Colorado Solo Batten",
    nameZh: "Colorado Solo Batten 条灯",
    shortDescEn: "Tour-grade RGBW LED batten for wash and pixel effects.",
    shortDescZh: "巡演级 RGBW LED 条灯，洗光与像素效果。",
    descriptionEn: `Colorado Solo Batten — rugged tour LED batten for wash and pixel-mapped looks.

![Colorado Solo Batten](https://chauvetprofessional.com/wp-content/uploads/2025/10/COLORADO-SOLO-BATTEN-FRONT-FEAT.png)

Source: [Chauvet Professional](https://chauvetprofessional.com/product/colorado-solo-batten/)`,
    descriptionZh: `Colorado Solo Batten 坚固巡演 LED 条灯，洗光与像素映射。

![Colorado Solo Batten](https://chauvetprofessional.com/wp-content/uploads/2025/10/COLORADO-SOLO-BATTEN-FRONT-FEAT.png)

来源：[Chauvet Professional 官网](https://chauvetprofessional.com/product/colorado-solo-batten/)`,
    categoryEn: "Stage Fixtures",
    categoryZh: "舞台灯具",
    price: 2499,
    image: "https://chauvetprofessional.com/wp-content/uploads/2025/10/COLORADO-SOLO-BATTEN-FRONT-FEAT.png",
    images: ["https://chauvetprofessional.com/wp-content/uploads/2025/10/COLORADO-SOLO-BATTEN-FRONT-FEAT.png"],
    specsEn: [
      { label: "Type", value: "RGBW LED batten" },
      { label: "Use", value: "Wash / pixel map" },
      { label: "Control", value: "DMX, sACN" },
    ],
    specsZh: [
      { label: "类型", value: "RGBW LED 条灯" },
      { label: "用途", value: "洗光 / 像素" },
      { label: "控制", value: "DMX、sACN" },
    ],
    highlightsEn: ["Tour rugged housing", "Pixel mapping", "Power link"],
    highlightsZh: ["巡演级外壳", "像素映射", "电源串联"],
    stock: 35,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://chauvetprofessional.com/product/colorado-solo-batten/",
  },
  {
    slug: "chauvet-ovation-ed-200ww",
    sku: "CP-OV-ED200",
    brand: "Chauvet Professional",
    nameEn: "Ovation ED-200WW",
    nameZh: "Ovation ED-200WW 椭球灯",
    shortDescEn: "LED ellipsoidal for theatre — warm white, shutter cuts.",
    shortDescZh: "剧院 LED 椭球灯，暖白，闸刀切割。",
    descriptionEn: `Ovation ED-200WW ellipsoidal delivers theatre-grade warm white from an efficient LED source.

![Ovation ED-200WW](https://chauvetprofessional.com/wp-content/uploads/2025/10/OVATION-ED-200WW-FRONT-FEAT.png)

Source: [Chauvet Professional](https://chauvetprofessional.com/product/ovation-ed-200ww/)`,
    descriptionZh: `Ovation ED-200WW 椭球灯，LED 高效光源呈现剧院级暖白。

![Ovation ED-200WW](https://chauvetprofessional.com/wp-content/uploads/2025/10/OVATION-ED-200WW-FRONT-FEAT.png)

来源：[Chauvet Professional 官网](https://chauvetprofessional.com/product/ovation-ed-200ww/)`,
    categoryEn: "Stage Fixtures",
    categoryZh: "舞台灯具",
    price: 899,
    image: "https://chauvetprofessional.com/wp-content/uploads/2025/10/OVATION-ED-200WW-FRONT-FEAT.png",
    images: ["https://chauvetprofessional.com/wp-content/uploads/2025/10/OVATION-ED-200WW-FRONT-FEAT.png"],
    specsEn: [
      { label: "Type", value: "LED ellipsoidal" },
      { label: "Color", value: "Warm white" },
      { label: "Use", value: "Theatre / house of worship" },
    ],
    specsZh: [
      { label: "类型", value: "LED 椭球灯" },
      { label: "色温", value: "暖白" },
      { label: "场景", value: "剧院 / 教堂" },
    ],
    highlightsEn: ["Theatre shutter cuts", "Low heat", "DMX dimming"],
    highlightsZh: ["剧院闸刀切割", "低热量", "DMX 调光"],
    stock: 50,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://chauvetprofessional.com/product/ovation-ed-200ww/",
  },
  {
    slug: "chauvet-rogue-r2-wash",
    sku: "CP-R2-WASH",
    brand: "Chauvet Professional",
    nameEn: "Rogue R2 Wash",
    nameZh: "Rogue R2 Wash 染色灯",
    shortDescEn: "Bright moving wash for rental and install — RGBW mix.",
    shortDescZh: "高亮染色摇头灯，租赁与安装皆宜。",
    descriptionEn: `Rogue R2 Wash moving fixture — bright RGBW wash for rental fleets and installs.

![Rogue R2 Wash](https://chauvetprofessional.com/wp-content/uploads/2025/10/ROGUE_R2_WASH-FRONT-FEAT.png)

Source: [Chauvet Professional](https://chauvetprofessional.com/product/rogue-r2-wash/)`,
    descriptionZh: `Rogue R2 Wash 染色摇头灯，RGBW 混色，适合租赁车队与固定安装。

![Rogue R2 Wash](https://chauvetprofessional.com/wp-content/uploads/2025/10/ROGUE_R2_WASH-FRONT-FEAT.png)

来源：[Chauvet Professional 官网](https://chauvetprofessional.com/product/rogue-r2-wash/)`,
    categoryEn: "Stage Fixtures",
    categoryZh: "舞台灯具",
    price: 2199,
    image: "https://chauvetprofessional.com/wp-content/uploads/2025/10/ROGUE_R2_WASH-FRONT-FEAT.png",
    images: ["https://chauvetprofessional.com/wp-content/uploads/2025/10/ROGUE_R2_WASH-FRONT-FEAT.png"],
    specsEn: [
      { label: "Type", value: "Moving wash" },
      { label: "Color", value: "RGBW" },
      { label: "Control", value: "DMX, RDM" },
    ],
    specsZh: [
      { label: "类型", value: "染色摇头" },
      { label: "混色", value: "RGBW" },
      { label: "控制", value: "DMX、RDM" },
    ],
    highlightsEn: ["Rental workhorse", "Zoom wash field", "Flight case friendly"],
    highlightsZh: ["租赁主力", "变焦洗光", "适合航空箱"],
    stock: 40,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://chauvetprofessional.com/product/rogue-r2-wash/",
  },
  {
    slug: "chauvet-ovation-e910fc",
    sku: "CP-OV-E910",
    brand: "Chauvet Professional",
    nameEn: "Ovation E-910FC",
    nameZh: "Ovation E-910FC 全彩椭球灯",
    shortDescEn: "Full-color LED ellipsoidal with RGBA-Lime for theatre.",
    shortDescZh: "全彩 LED 椭球灯，RGBA-Lime，剧院应用。",
    descriptionEn: `Ovation E-910FC full-color ellipsoidal with RGBA-Lime LED engine for theatre and broadcast.

![Ovation E-910FC](https://chauvetprofessional.com/wp-content/uploads/2025/10/OVATION-E910FC-FRONT-FEAT.png)

Source: [Chauvet Professional](https://chauvetprofessional.com/product/ovation-e-910fc/)`,
    descriptionZh: `Ovation E-910FC 全彩椭球灯，RGBA-Lime 灯珠，适合剧院与广播。

![Ovation E-910FC](https://chauvetprofessional.com/wp-content/uploads/2025/10/OVATION-E910FC-FRONT-FEAT.png)

来源：[Chauvet Professional 官网](https://chauvetprofessional.com/product/ovation-e-910fc/)`,
    categoryEn: "Stage Fixtures",
    categoryZh: "舞台灯具",
    price: 1299,
    image: "https://chauvetprofessional.com/wp-content/uploads/2025/10/OVATION-E910FC-FRONT-FEAT.png",
    images: ["https://chauvetprofessional.com/wp-content/uploads/2025/10/OVATION-E910FC-FRONT-FEAT.png"],
    specsEn: [
      { label: "Engine", value: "RGBA-Lime LED" },
      { label: "Type", value: "Ellipsoidal ERS" },
      { label: "Use", value: "Theatre / broadcast" },
    ],
    specsZh: [
      { label: "灯珠", value: "RGBA-Lime LED" },
      { label: "类型", value: "椭球反射器" },
      { label: "场景", value: "剧院 / 广播" },
    ],
    highlightsEn: ["Full color mixing", "Flat field", "DMX + RDM"],
    highlightsZh: ["全彩混色", "均匀光场", "DMX + RDM"],
    stock: 28,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://chauvetprofessional.com/product/ovation-e-910fc/",
  },
  {
    slug: "chauvet-maverick-mk2-wash",
    sku: "CP-MK2-WASH",
    brand: "Chauvet Professional",
    nameEn: "Maverick MK2 Wash",
    nameZh: "Maverick MK2 Wash 染色灯",
    shortDescEn: "Proven MK2 wash moving head — rental fleet staple.",
    shortDescZh: "经典 MK2 染色摇头，租赁车队常备。",
    descriptionEn: `Maverick MK2 Wash — proven moving wash fixture trusted on rental fleets worldwide.

![Maverick MK2 Wash](https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK2-WASH-FRONT-FEAT.png)

Source: [Chauvet Professional](https://chauvetprofessional.com/product/maverick-mk2-wash/)`,
    descriptionZh: `Maverick MK2 Wash 经典染色摇头灯，全球租赁车队广泛使用。

![Maverick MK2 Wash](https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK2-WASH-FRONT-FEAT.png)

来源：[Chauvet Professional 官网](https://chauvetprofessional.com/product/maverick-mk2-wash/)`,
    categoryEn: "Stage Fixtures",
    categoryZh: "舞台灯具",
    price: 4599,
    image: "https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK2-WASH-FRONT-FEAT.png",
    images: ["https://chauvetprofessional.com/wp-content/uploads/2025/10/MAVERICK-MK2-WASH-FRONT-FEAT.png"],
    specsEn: [
      { label: "Series", value: "Maverick MK2" },
      { label: "Type", value: "Moving wash" },
      { label: "Control", value: "DMX, Art-Net, sACN" },
    ],
    specsZh: [
      { label: "系列", value: "Maverick MK2" },
      { label: "类型", value: "染色摇头" },
      { label: "控制", value: "DMX、Art-Net、sACN" },
    ],
    highlightsEn: ["Rental proven", "Even wash field", "Road case available"],
    highlightsZh: ["租赁验证", "均匀洗光", "可选航空箱"],
    stock: 26,
    featured: false,
    warranty: "2 years",
    sourceUrl: "https://chauvetprofessional.com/product/maverick-mk2-wash/",
  },
];

function toDbRow(p: ProductSeed & { categoryKey?: string }) {
  const categoryKey = resolveCategoryKey({
    categoryKey: p.categoryKey,
    categoryEn: p.categoryEn,
    slug: p.slug,
  });
  const category = findCategoryInList(DEFAULT_CATEGORIES, categoryKey);

  return {
    slug: p.slug,
    sku: p.sku,
    brand: p.brand,
    nameEn: p.nameEn,
    nameZh: p.nameZh,
    shortDescEn: p.shortDescEn,
    shortDescZh: p.shortDescZh,
    descriptionEn: p.descriptionEn,
    descriptionZh: p.descriptionZh,
    categoryKey,
    categoryEn: category.en,
    categoryZh: category.zh,
    price: p.price,
    image: p.image,
    images: JSON.stringify(p.images),
    specsEn: JSON.stringify(p.specsEn),
    specsZh: JSON.stringify(p.specsZh),
    highlightsEn: JSON.stringify(p.highlightsEn),
    highlightsZh: JSON.stringify(p.highlightsZh),
    stock: p.stock,
    featured: p.featured,
    warranty: p.warranty,
  };
}

async function main() {
  const effectRows = EFFECTS_PRODUCTS.map((p) =>
    toDbRow({
      ...p,
      categoryEn: "Effects",
      categoryZh: "特效设备",
      images: [p.image],
    }),
  );
  const laserRows = LASER_PRODUCTS.map((p) =>
    toDbRow({
      ...p,
      categoryEn: "Laser Systems",
      categoryZh: "激光灯",
      images: [p.image],
    }),
  );
  const allRows = [
    ...products.map((p) => toDbRow(p)),
    ...effectRows,
    ...laserRows,
  ];

  console.log(`Replacing catalog with ${allRows.length} brand demo products…`);

  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.product.deleteMany();

  for (const row of allRows) {
    await prisma.product.create({ data: row });
  }

  const created = await prisma.product.findMany({ select: { brand: true, categoryKey: true } });
  console.log(`Seeded ${created.length} products:`);
  console.log(`  MA Lighting: ${created.filter((p) => p.brand === "MA Lighting").length}`);
  console.log(`  Avolites: ${created.filter((p) => p.brand === "Avolites").length}`);
  console.log(`  Chauvet Professional: ${created.filter((p) => p.brand === "Chauvet Professional").length}`);
  console.log(`  Consoles: ${created.filter((p) => p.categoryKey === "consoles").length}`);
  console.log(`  Lasers: ${created.filter((p) => p.categoryKey === "lasers").length}`);
  console.log(`  Fixtures: ${created.filter((p) => p.categoryKey === "fixtures").length}`);
  console.log(`  Effects: ${created.filter((p) => p.categoryKey === "effects").length}`);
  console.log(`  Accessories: ${created.filter((p) => p.categoryKey === "accessories").length}`);
  console.log("Images hotlink official manufacturer CDN — demo/testing only.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
