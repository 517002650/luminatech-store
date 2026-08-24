import { PrismaClient } from "@prisma/client";
import { DEFAULT_SHIPPING_SETTINGS } from "../src/lib/shipping-settings";

const prisma = new PrismaClient();

const photo = (seed: string, w = 800, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const products = [
  {
    slug: "wireless-earbuds-pro",
    sku: "LT-AE-001",
    brand: "LuminaTech",
    nameEn: "Wireless Earbuds Pro",
    nameZh: "无线降噪耳机 Pro",
    shortDescEn: "Active noise cancellation with 36-hour total battery life.",
    shortDescZh: "主动降噪，总续航 36 小时。",
    descriptionEn: `Experience immersive sound with hybrid ANC that blocks up to 98% of ambient noise.

![Earbuds detail](${photo("earbuds-detail-en", 900, 500)})

## Key Features
- Hybrid ANC + transparency mode
- Dual-device multipoint connection
- IPX5 water resistance

## In the Box
- Earbuds × 2
- Wireless charging case
- USB-C cable
- 3 sizes of ear tips`,
    descriptionZh: `混合主动降噪可隔绝高达 98% 环境噪音，带来沉浸式听感。

![耳机细节](${photo("earbuds-detail-zh", 900, 500)})

## 核心功能
- 混合降噪 + 通透模式
- 双设备多点连接
- IPX5 防水

## 包装清单
- 耳机 × 2
- 无线充电盒
- USB-C 数据线
- 耳塞 3 种尺寸`,
    categoryEn: "Audio",
    categoryZh: "音频",
    price: 89.99,
    image: photo("earbuds-main"),
    images: JSON.stringify([
      photo("earbuds-1"),
      photo("earbuds-2"),
      photo("earbuds-3"),
    ]),
    specsEn: JSON.stringify([
      { label: "Driver", value: "10mm titanium composite" },
      { label: "Bluetooth", value: "5.3 with AAC / LDAC" },
      { label: "Battery (buds)", value: "8 hours (ANC on)" },
      { label: "Battery (case)", value: "28 hours extra" },
      { label: "Charging", value: "USB-C + Qi wireless" },
      { label: "Weight", value: "5.2g per bud" },
    ]),
    specsZh: JSON.stringify([
      { label: "驱动单元", value: "10mm 钛复合振膜" },
      { label: "蓝牙", value: "5.3，支持 AAC / LDAC" },
      { label: "耳机续航", value: "8 小时（降噪开）" },
      { label: "充电盒续航", value: "额外 28 小时" },
      { label: "充电方式", value: "USB-C + 无线充电" },
      { label: "重量", value: "单耳 5.2g" },
    ]),
    highlightsEn: JSON.stringify([
      "Hybrid ANC with transparency mode",
      "Multipoint connection for 2 devices",
      "Low-latency gaming mode (60ms)",
    ]),
    highlightsZh: JSON.stringify([
      "混合降噪 + 通透模式",
      "双设备多点连接",
      "低延迟游戏模式（60ms）",
    ]),
    stock: 120,
    featured: true,
    warranty: "1 year",
  },
  {
    slug: "mechanical-keyboard-75",
    sku: "LT-KB-002",
    brand: "LuminaTech",
    nameEn: "Mechanical Keyboard 75%",
    nameZh: "75% 机械键盘",
    shortDescEn: "Hot-swap RGB keyboard with gasket mount and wireless mode.",
    shortDescZh: "热插拔 RGB，垫片结构，支持无线连接。",
    descriptionEn: `Compact 75% layout without sacrificing arrow keys.

![Keyboard](${photo("keyboard-detail-en", 900, 500)})

Gasket-mounted for a soft typing feel. Hot-swap sockets support 3-pin and 5-pin switches.`,
    descriptionZh: `紧凑 75% 配列，保留方向键与功能区。

![键盘](${photo("keyboard-detail-zh", 900, 500)})

垫片结构打字更柔和。热插拔座支持 3 脚 / 5 脚轴体。`,
    categoryEn: "Peripherals",
    categoryZh: "外设",
    price: 129.99,
    image: photo("keyboard-main"),
    images: JSON.stringify([photo("keyboard-1"), photo("keyboard-2")]),
    specsEn: JSON.stringify([
      { label: "Layout", value: "75% / 84 keys" },
      { label: "Switch", value: "Hot-swap (pre-lubed)" },
      { label: "Connection", value: "2.4G / Bluetooth / USB-C" },
      { label: "Battery", value: "4000mAh" },
      { label: "Lighting", value: "Per-key RGB" },
    ]),
    specsZh: JSON.stringify([
      { label: "配列", value: "75% / 84 键" },
      { label: "轴体", value: "热插拔（预润）" },
      { label: "连接", value: "2.4G / 蓝牙 / USB-C" },
      { label: "电池", value: "4000mAh" },
      { label: "灯效", value: "单键 RGB" },
    ]),
    highlightsEn: JSON.stringify([
      "Gasket mount soft typing feel",
      "Tri-mode wireless connectivity",
      "Mac / Windows key remapping",
    ]),
    highlightsZh: JSON.stringify([
      "垫片结构，打字更软",
      "三模无线连接",
      "Mac / Windows 键位切换",
    ]),
    stock: 80,
    featured: true,
    warranty: "1 year",
  },
  {
    slug: "usb-c-hub-8in1",
    sku: "LT-HB-003",
    brand: "LuminaTech",
    nameEn: "USB-C Hub 8-in-1",
    nameZh: "USB-C 扩展坞 8合1",
    shortDescEn: "HDMI 4K, Ethernet, SD/TF, and 100W PD pass-through.",
    shortDescZh: "HDMI 4K、千兆网口、SD/TF、100W PD 供电。",
    descriptionEn: `One cable for your entire desk setup.

![Hub](${photo("hub-detail-en", 900, 500)})

Supports 4K@60Hz HDMI and 100W Power Delivery charging.`,
    descriptionZh: `一根线搞定桌面扩展。

![扩展坞](${photo("hub-detail-zh", 900, 500)})

支持 HDMI 4K@60Hz 与 100W PD 充电。`,
    categoryEn: "Accessories",
    categoryZh: "配件",
    price: 49.99,
    image: photo("hub-main"),
    images: JSON.stringify([photo("hub-1"), photo("hub-2")]),
    specsEn: JSON.stringify([
      { label: "Ports", value: "HDMI, RJ45, USB-A x2, USB-C, SD, TF, PD" },
      { label: "HDMI", value: "4K@60Hz" },
      { label: "PD", value: "100W pass-through" },
      { label: "Ethernet", value: "1Gbps" },
    ]),
    specsZh: JSON.stringify([
      { label: "接口", value: "HDMI、网口、USB-A×2、USB-C、SD、TF、PD" },
      { label: "HDMI", value: "4K@60Hz" },
      { label: "PD", value: "100W 供电直通" },
      { label: "网口", value: "1Gbps" },
    ]),
    highlightsEn: JSON.stringify([
      "Aluminum body, compact travel size",
      "Compatible with MacBook, iPad, Windows laptops",
      "Plug and play",
    ]),
    highlightsZh: JSON.stringify([
      "铝合金机身，便携出差",
      "兼容 MacBook、iPad、Windows 笔记本",
      "即插即用",
    ]),
    stock: 200,
    featured: true,
    warranty: "1 year",
  },
  {
    slug: "portable-ssd-1tb",
    sku: "LT-SS-004",
    brand: "LuminaTech",
    nameEn: "Portable SSD 1TB",
    nameZh: "移动固态硬盘 1TB",
    shortDescEn: "1050MB/s read speeds with USB-C and rugged enclosure.",
    shortDescZh: "读取最高 1050MB/s，USB-C，三防外壳。",
    descriptionEn: `Fast external storage for creators on the go.

![SSD](${photo("ssd-detail-en", 900, 500)})

IP65 dust and water resistance with shock-absorbing silicone bumper.`,
    descriptionZh: `创作者随身高速存储。

![固态硬盘](${photo("ssd-detail-zh", 900, 500)})

IP65 防尘防水，硅胶减震套保护。`,
    categoryEn: "Storage",
    categoryZh: "存储",
    price: 99.99,
    image: photo("ssd-main"),
    images: JSON.stringify([photo("ssd-1"), photo("ssd-2")]),
    specsEn: JSON.stringify([
      { label: "Capacity", value: "1TB" },
      { label: "Read", value: "Up to 1050MB/s" },
      { label: "Write", value: "Up to 1000MB/s" },
      { label: "Interface", value: "USB 3.2 Gen2 Type-C" },
    ]),
    specsZh: JSON.stringify([
      { label: "容量", value: "1TB" },
      { label: "读取", value: "最高 1050MB/s" },
      { label: "写入", value: "最高 1000MB/s" },
      { label: "接口", value: "USB 3.2 Gen2 Type-C" },
    ]),
    highlightsEn: JSON.stringify([
      "Works with Windows, macOS, Android",
      "Hardware encryption supported",
      "Compact pocket size",
    ]),
    highlightsZh: JSON.stringify([
      "兼容 Windows、macOS、Android",
      "支持硬件加密",
      "口袋便携尺寸",
    ]),
    stock: 150,
    featured: false,
    warranty: "3 years",
  },
  {
    slug: "smart-watch-ultra",
    sku: "LT-SW-005",
    brand: "LuminaTech",
    nameEn: "Smart Watch Ultra",
    nameZh: "智能手表 Ultra",
    shortDescEn: "AMOLED display, GPS, SpO2, and 14-day battery life.",
    shortDescZh: "AMOLED 屏，GPS，血氧，续航约 14 天。",
    descriptionEn: `Track workouts and health with a bright AMOLED watch.

![Watch](${photo("watch-detail-en", 900, 500)})

Built-in GPS, heart rate, SpO2, and sleep monitoring.`,
    descriptionZh: `高亮 AMOLED 屏幕，运动与健康一站追踪。

![手表](${photo("watch-detail-zh", 900, 500)})

内置 GPS、心率、血氧与睡眠监测。`,
    categoryEn: "Wearables",
    categoryZh: "穿戴",
    price: 159.99,
    image: photo("watch-main"),
    images: JSON.stringify([photo("watch-1"), photo("watch-2")]),
    specsEn: JSON.stringify([
      { label: "Display", value: "1.43\" AMOLED" },
      { label: "Battery", value: "Up to 14 days" },
      { label: "Water", value: "5ATM" },
      { label: "Sensors", value: "HR, SpO2, GPS, accelerometer" },
    ]),
    specsZh: JSON.stringify([
      { label: "屏幕", value: "1.43 英寸 AMOLED" },
      { label: "续航", value: "最长约 14 天" },
      { label: "防水", value: "5ATM" },
      { label: "传感器", value: "心率、血氧、GPS、加速度计" },
    ]),
    highlightsEn: JSON.stringify([
      "100+ sports modes",
      "Bluetooth calling",
      "Smart notifications",
    ]),
    highlightsZh: JSON.stringify([
      "100+ 运动模式",
      "蓝牙通话",
      "智能消息提醒",
    ]),
    stock: 60,
    featured: false,
    warranty: "1 year",
  },
  {
    slug: "webcam-4k-pro",
    sku: "LT-WC-006",
    brand: "LuminaTech",
    nameEn: "Webcam 4K Pro",
    nameZh: "4K 网络摄像头 Pro",
    shortDescEn: "4K 30fps with auto-focus, HDR, and built-in dual mics.",
    shortDescZh: "4K 30fps，自动对焦，HDR，内置双麦克风。",
    descriptionEn: `Look your best on every video call with 4K clarity and autofocus.

![Webcam 4K](${photo("webcam-detail-en", 900, 500)})

HDR balances backlighting. Dual noise-reducing microphones included.`,
    descriptionZh: `4K 超清画质配合自动对焦，视频通话始终清晰。

![4K 摄像头](${photo("webcam-detail-zh", 900, 500)})

HDR 平衡逆光，双降噪麦克风，附隐私挡板。`,
    categoryEn: "Peripherals",
    categoryZh: "外设",
    price: 79.99,
    image: photo("webcam-main"),
    images: JSON.stringify([photo("webcam-1"), photo("webcam-2")]),
    specsEn: JSON.stringify([
      { label: "Resolution", value: "4K@30fps, 1080p@60fps" },
      { label: "Field of view", value: "90° diagonal" },
      { label: "Focus", value: "Auto-focus with face priority" },
      { label: "Microphone", value: "Dual stereo with noise reduction" },
      { label: "Mount", value: "Monitor clip + 1/4\" tripod thread" },
      { label: "Connection", value: "USB-C (USB 2.0)" },
    ]),
    specsZh: JSON.stringify([
      { label: "分辨率", value: "4K@30fps，1080p@60fps" },
      { label: "视场角", value: "90° 对角线" },
      { label: "对焦", value: "自动对焦，人脸优先" },
      { label: "麦克风", value: "双声道立体声降噪" },
      { label: "安装", value: "显示器夹 + 1/4 英寸螺纹" },
      { label: "连接", value: "USB-C（USB 2.0）" },
    ]),
    highlightsEn: JSON.stringify([
      "Works with Zoom, Teams, OBS, and macOS FaceTime",
      "Low-light enhancement algorithm",
      "Physical privacy cover included",
    ]),
    highlightsZh: JSON.stringify([
      "兼容 Zoom、Teams、OBS、FaceTime",
      "弱光增强算法",
      "物理隐私盖板",
    ]),
    stock: 95,
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
      await prisma.product.create({ data: product });
    }
    console.log(`Seeded ${products.length} digital products with markdown descriptions`);
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
