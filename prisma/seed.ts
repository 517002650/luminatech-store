import { PrismaClient } from "@prisma/client";
import { DEFAULT_SHIPPING_SETTINGS } from "../src/lib/shipping-settings";

const prisma = new PrismaClient();

const photo = (seed: string, w = 800, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const products = [
  {
    slug: "ma2-onpc-console",
    sku: "LT-CON-001",
    brand: "Stagevio",
    nameEn: "MA2 onPC Lighting Console",
    nameZh: "MA2 onPC 灯光控制台",
    shortDescEn: "Industry-standard lighting desk with 4,096 parameters and onPC software.",
    shortDescZh: "行业标准灯光控台，4,096 参数，含 onPC 软件授权。",
    descriptionEn: `Professional lighting control for concerts, tours, and fixed installations.

![Console](${photo("ma2-console-en", 900, 500)})

## Key Features
- 4,096 control parameters
- Full MA2 software feature set
- Art-Net and sACN output
- Multi-user session support`,
    descriptionZh: `适用于演唱会、巡演与固定安装的专业灯光控制。

![控制台](${photo("ma2-console-zh", 900, 500)})

## 核心功能
- 4,096 控制参数
- 完整 MA2 软件功能
- Art-Net / sACN 输出
- 多用户会话支持`,
    categoryEn: "Lighting Consoles",
    categoryZh: "灯光控制台",
    price: 2499.0,
    image: photo("ma2-main"),
    images: JSON.stringify([photo("ma2-1"), photo("ma2-2"), photo("ma2-3")]),
    specsEn: JSON.stringify([
      { label: "Parameters", value: "4,096" },
      { label: "Outputs", value: "Art-Net, sACN, DMX512" },
      { label: "Software", value: "grandMA2 onPC" },
      { label: "Display", value: "Multi-monitor supported" },
      { label: "Power", value: "100–240V AC" },
    ]),
    specsZh: JSON.stringify([
      { label: "参数", value: "4,096" },
      { label: "输出", value: "Art-Net、sACN、DMX512" },
      { label: "软件", value: "grandMA2 onPC" },
      { label: "显示", value: "支持多显示器" },
      { label: "电源", value: "100–240V AC" },
    ]),
    highlightsEn: JSON.stringify([
      "Industry-standard for touring and rental",
      "Compatible with MA fixture profiles",
      "Includes onPC software license",
    ]),
    highlightsZh: JSON.stringify([
      "巡演与租赁行业主流控台",
      "兼容 MA 灯库文件",
      "含 onPC 软件授权",
    ]),
    stock: 15,
    featured: true,
    warranty: "2 years",
  },
  {
    slug: "rgb-laser-5w",
    sku: "LT-LSR-002",
    brand: "Stagevio",
    nameEn: "RGB Laser Projector 5W",
    nameZh: "RGB 全彩激光灯 5W",
    shortDescEn: "5W full-color ILDA laser with DMX, SD card animations, and safety key.",
    shortDescZh: "5W 全彩 ILDA 激光，DMX 控制，SD 卡动画，含安全钥匙。",
    descriptionEn: `Vivid RGB laser effects for clubs, weddings, and stage shows.

![Laser](${photo("laser-detail-en", 900, 500)})

Built-in SD card with 128 preset patterns. ILDA port for custom animations.`,
    descriptionZh: `适用于酒吧、婚礼与舞台演出的全彩激光效果。

![激光灯](${photo("laser-detail-zh", 900, 500)})

内置 SD 卡 128 组预设图案，ILDA 接口支持自定义动画。`,
    categoryEn: "Laser Systems",
    categoryZh: "激光灯",
    price: 899.0,
    image: photo("laser-main"),
    images: JSON.stringify([photo("laser-1"), photo("laser-2")]),
    specsEn: JSON.stringify([
      { label: "Power", value: "5W RGB combined" },
      { label: "Control", value: "DMX512, ILDA, Auto, Sound-active" },
      { label: "Scan speed", value: "30K @ 8°" },
      { label: "Safety", value: "Key switch + remote interlock" },
      { label: "Cooling", value: "Forced air" },
    ]),
    specsZh: JSON.stringify([
      { label: "功率", value: "5W RGB 混合" },
      { label: "控制", value: "DMX512、ILDA、自动、声控" },
      { label: "扫描速度", value: "30K @ 8°" },
      { label: "安全", value: "钥匙开关 + 远程互锁" },
      { label: "散热", value: "强制风冷" },
    ]),
    highlightsEn: JSON.stringify([
      "128 built-in laser animations",
      "DMX and ILDA control modes",
      "Safety key included for venue compliance",
    ]),
    highlightsZh: JSON.stringify([
      "128 组内置激光动画",
      "DMX 与 ILDA 双控制模式",
      "含安全钥匙，符合场馆规范",
    ]),
    stock: 40,
    featured: true,
    warranty: "1 year",
  },
  {
    slug: "350w-beam-moving-head",
    sku: "LT-FIX-003",
    brand: "Stagevio",
    nameEn: "350W Beam Moving Head",
    nameZh: "350W 光束摇头灯",
    shortDescEn: "Sharp 350W beam fixture with 14-color wheel, frost, and linear dimming.",
    shortDescZh: "350W 锐利光束，14 色盘，雾化片，线性调光。",
    descriptionEn: `High-output beam moving head for concerts and large venues.

![Moving head](${photo("beam-fixture-en", 900, 500)})

14-color + open, 17 gobos, 8-facet prism with linear dimmer 0–100%.`,
    descriptionZh: `适用于演唱会与大型场馆的高亮光束摇头灯。

![摇头灯](${photo("beam-fixture-zh", 900, 500)})

14 色 + 白光，17 图案，8 棱镜，0–100% 线性调光。`,
    categoryEn: "Stage Fixtures",
    categoryZh: "舞台灯具",
    price: 649.0,
    image: photo("beam-main"),
    images: JSON.stringify([photo("beam-1"), photo("beam-2")]),
    specsEn: JSON.stringify([
      { label: "Light source", value: "350W discharge lamp" },
      { label: "Beam angle", value: "2° narrow beam" },
      { label: "Pan / Tilt", value: "540° / 270°" },
      { label: "DMX channels", value: "16 / 20 channel modes" },
      { label: "Weight", value: "18.5 kg" },
    ]),
    specsZh: JSON.stringify([
      { label: "光源", value: "350W 气体放电泡" },
      { label: "光束角", value: "2° 窄光束" },
      { label: "XY 轴", value: "540° / 270°" },
      { label: "DMX 通道", value: "16 / 20 通道模式" },
      { label: "重量", value: "18.5 kg" },
    ]),
    highlightsEn: JSON.stringify([
      "Ultra-narrow 2° beam for aerial effects",
      "RDM compatible",
      "Flight case recommended for touring",
    ]),
    highlightsZh: JSON.stringify([
      "2° 超窄光束，空中效果出众",
      "支持 RDM 远程设备管理",
      "巡演建议配航空箱",
    ]),
    stock: 60,
    featured: true,
    warranty: "1 year",
  },
  {
    slug: "led-par-rgbwa-18x12",
    sku: "LT-FIX-004",
    brand: "Stagevio",
    nameEn: "LED PAR RGBWA 18×12W",
    nameZh: "LED 帕灯 RGBWA 18×12W",
    shortDescEn: "18×12W RGBWA PAR can with silent fan mode and power link.",
    shortDescZh: "18×12W RGBWA 帕灯，静音模式，电源串联。",
    descriptionEn: `Versatile wash fixture for uplighting, stage wash, and architectural lighting.

![PAR can](${photo("par-fixture-en", 900, 500)})

PowerCON in/out for daisy-chain setup. 3/7/8 DMX channel modes.`,
    descriptionZh: `适用于洗墙、面光与建筑照明的全能帕灯。

![帕灯](${photo("par-fixture-zh", 900, 500)})

PowerCON 入/出串联供电，3/7/8 通道 DMX 模式。`,
    categoryEn: "Stage Fixtures",
    categoryZh: "舞台灯具",
    price: 189.0,
    image: photo("par-main"),
    images: JSON.stringify([photo("par-1"), photo("par-2")]),
    specsEn: JSON.stringify([
      { label: "LEDs", value: "18×12W RGBWA 5-in-1" },
      { label: "Beam angle", value: "25°" },
      { label: "DMX", value: "3 / 7 / 8 channels" },
      { label: "Power link", value: "PowerCON in/out" },
      { label: "Noise", value: "Silent mode < 25 dB" },
    ]),
    specsZh: JSON.stringify([
      { label: "灯珠", value: "18×12W RGBWA 五合一" },
      { label: "光束角", value: "25°" },
      { label: "DMX", value: "3 / 7 / 8 通道" },
      { label: "电源串联", value: "PowerCON 入/出" },
      { label: "噪音", value: "静音模式 < 25 dB" },
    ]),
    highlightsEn: JSON.stringify([
      "True white from dedicated W + A LEDs",
      "Silent fan for wedding and church use",
      "Power link reduces cable runs",
    ]),
    highlightsZh: JSON.stringify([
      "独立 W + A 灯珠呈现真实白光",
      "静音风扇适合婚礼与教堂",
      "电源串联减少布线",
    ]),
    stock: 120,
    featured: false,
    warranty: "2 years",
  },
  {
    slug: "dmx512-wireless-transceiver",
    sku: "LT-ACC-005",
    brand: "Stagevio",
    nameEn: "DMX512 Wireless Transceiver",
    nameZh: "DMX512 无线收发器",
    shortDescEn: "2.4G ISM wireless DMX with 400m range and automatic pairing.",
    shortDescZh: "2.4G ISM 无线 DMX，400 米距离，自动配对。",
    descriptionEn: `Eliminate long DMX cable runs with reliable wireless DMX.

![Wireless DMX](${photo("dmx-wireless-en", 900, 500)})

Set as transmitter or receiver. Supports up to 512 channels.`,
    descriptionZh: `可靠无线 DMX，告别长距离信号线布线。

![无线 DMX](${photo("dmx-wireless-zh", 900, 500)})

可切换发射/接收模式，支持 512 通道。`,
    categoryEn: "Control & Accessories",
    categoryZh: "控制与配件",
    price: 129.0,
    image: photo("dmx-main"),
    images: JSON.stringify([photo("dmx-1")]),
    specsEn: JSON.stringify([
      { label: "Frequency", value: "2.4G ISM" },
      { label: "Range", value: "Up to 400m (open line of sight)" },
      { label: "Channels", value: "512 DMX channels" },
      { label: "Latency", value: "< 5ms" },
      { label: "Power", value: "5V USB / DC 9–24V" },
    ]),
    specsZh: JSON.stringify([
      { label: "频段", value: "2.4G ISM" },
      { label: "距离", value: "最远 400 米（视距）" },
      { label: "通道", value: "512 DMX 通道" },
      { label: "延迟", value: "< 5ms" },
      { label: "供电", value: "5V USB / DC 9–24V" },
    ]),
    highlightsEn: JSON.stringify([
      "Auto-pairing in seconds",
      "Works with any DMX512 console",
      "Compact for truss mount",
    ]),
    highlightsZh: JSON.stringify([
      "数秒自动配对",
      "兼容任意 DMX512 控台",
      "紧凑设计可装桁架",
    ]),
    stock: 200,
    featured: false,
    warranty: "1 year",
  },
  {
    slug: "low-fog-machine-1500w",
    sku: "LT-FX-006",
    brand: "Stagevio",
    nameEn: "Low Fog Machine 1500W",
    nameZh: "1500W 低烟机",
    shortDescEn: "1500W low-lying fog machine with DMX and timer control.",
    shortDescZh: "1500W 低烟机，DMX 与定时控制，地面贴地烟雾效果。",
    descriptionEn: `Create ground-hugging fog effects for dramatic stage reveals.

![Fog machine](${photo("fog-machine-en", 900, 500)})

Use standard fog fluid or low-lying fluid with optional chiller for floor-hugging effect.`,
    descriptionZh: `制造贴地低烟效果，适合舞台出场与氛围营造。

![烟雾机](${photo("fog-machine-zh", 900, 500)})

可使用标准烟油或低烟液，选配冷却器实现贴地效果。`,
    categoryEn: "Effects",
    categoryZh: "特效设备",
    price: 279.0,
    image: photo("fog-main"),
    images: JSON.stringify([photo("fog-1"), photo("fog-2")]),
    specsEn: JSON.stringify([
      { label: "Heater", value: "1500W" },
      { label: "Output", value: "40,000 cu.ft/min" },
      { label: "Heat-up time", value: "4 minutes" },
      { label: "Control", value: "DMX, wired remote, timer" },
      { label: "Tank", value: "2.5L removable" },
    ]),
    specsZh: JSON.stringify([
      { label: "加热", value: "1500W" },
      { label: "出烟量", value: "40,000 立方英尺/分钟" },
      { label: "预热", value: "4 分钟" },
      { label: "控制", value: "DMX、有线遥控、定时" },
      { label: "油箱", value: "2.5L 可拆卸" },
    ]),
    highlightsEn: JSON.stringify([
      "DMX controllable for automated shows",
      "Fast heat-up for quick changeovers",
      "Compatible with standard fog fluids",
    ]),
    highlightsZh: JSON.stringify([
      "DMX 控制，适合自动化演出",
      "快速预热，换场效率高",
      "兼容标准烟油",
    ]),
    stock: 75,
    featured: false,
    warranty: "1 year",
  },
];

async function main() {
  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log(`Skip seed: ${existing} products already exist`);
  } else {
    for (const product of products) {
      const created = await prisma.product.create({ data: product });
      await prisma.productVariant.create({
        data: {
          productId: created.id,
          sku: created.sku,
          nameEn: "",
          nameZh: "",
          price: created.price,
          compareAtPrice: created.compareAtPrice,
          stock: created.stock,
          active: true,
          isDefault: true,
          sortOrder: 0,
        },
      });
    }
    console.log(`Seeded ${products.length} stage lighting products`);
  }

  // Backfill default variants for legacy products (safe to re-run)
  const missing = await prisma.product.findMany({
    where: { variants: { none: {} } },
    select: {
      id: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      stock: true,
    },
  });
  for (const p of missing) {
    await prisma.productVariant.create({
      data: {
        productId: p.id,
        sku: p.sku || `SKU-${p.id.slice(-6)}`,
        nameEn: "",
        nameZh: "",
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        active: true,
        isDefault: true,
        sortOrder: 0,
      },
    });
  }
  if (missing.length > 0) {
    console.log(`Backfilled ${missing.length} default product variants`);
  }

  const couponCount = await prisma.coupon.count();
  if (couponCount === 0) {
    await prisma.coupon.createMany({
      data: [
        {
          code: "WELCOME10",
          type: "percent",
          value: 10,
          minOrder: 0,
          maxUses: 1000,
          active: true,
        },
        {
          code: "SAVE5",
          type: "fixed",
          value: 5,
          minOrder: 50,
          maxUses: null,
          active: true,
        },
      ],
    });
    console.log("Seeded sample coupons: WELCOME10, SAVE5");
  }

  const shippingExists = await prisma.shippingSettings.findUnique({
    where: { id: "default" },
  });
  if (!shippingExists) {
    await prisma.shippingSettings.create({
      data: {
        id: "default",
        freeShippingThreshold: DEFAULT_SHIPPING_SETTINGS.freeShippingThreshold,
        flatRate: DEFAULT_SHIPPING_SETTINGS.flatRate,
        euRate: DEFAULT_SHIPPING_SETTINGS.euRate,
        countryRates: JSON.stringify(DEFAULT_SHIPPING_SETTINGS.countryRates),
      },
    });
    console.log("Seeded default shipping settings");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
