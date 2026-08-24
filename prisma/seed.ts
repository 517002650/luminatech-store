import { PrismaClient } from "@prisma/client";

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
    slug: "mechanical-keyboard-rgb",
    sku: "LT-KB-002",
    brand: "LuminaTech",
    nameEn: "Mechanical Keyboard RGB",
    nameZh: "机械键盘 RGB",
    shortDescEn: "Hot-swappable switches with per-key RGB and aluminum frame.",
    shortDescZh: "热插拔轴体，逐键 RGB，铝合金机身。",
    descriptionEn: `A compact 75% layout mechanical keyboard built for productivity and gaming.

![Keyboard angle](${photo("keyboard-detail-en", 900, 500)})

Pre-lubed stabilizers deliver a smooth typing feel. Supports VIA configurator for full key remapping.`,
    descriptionZh: `75% 紧凑配列，兼顾办公与游戏，预润卫星轴敲击顺滑。

![键盘细节](${photo("keyboard-detail-zh", 900, 500)})

支持 VIA 全键改键，附 USB-C 可拆线及 USB-A 转接头。`,
    categoryEn: "Peripherals",
    categoryZh: "外设",
    price: 129.0,
    image: photo("keyboard-main"),
    images: JSON.stringify([
      photo("keyboard-1"),
      photo("keyboard-2"),
      photo("keyboard-3"),
    ]),
    specsEn: JSON.stringify([
      { label: "Layout", value: "75% (84 keys)" },
      { label: "Switch", value: "Hot-swap Gateron compatible" },
      { label: "Polling rate", value: "1000Hz" },
      { label: "Material", value: "CNC aluminum case" },
      { label: "Backlight", value: "South-facing RGB" },
      { label: "Connection", value: "Wired USB-C" },
    ]),
    specsZh: JSON.stringify([
      { label: "配列", value: "75%（84 键）" },
      { label: "轴体", value: "热插拔，兼容 Gateron" },
      { label: "回报率", value: "1000Hz" },
      { label: "材质", value: "CNC 铝合金外壳" },
      { label: "背光", value: "下灯位 RGB" },
      { label: "连接", value: "有线 USB-C" },
    ]),
    highlightsEn: JSON.stringify([
      "Gasket-mount structure for softer feel",
      "Foam-filled for reduced ping",
      "Mac & Windows dual-system keys",
    ]),
    highlightsZh: JSON.stringify([
      "Gasket 结构，手感更软弹",
      "多层消音填充，减少空腔音",
      "Mac / Windows 双系统键帽",
    ]),
    stock: 85,
    featured: true,
    warranty: "2 years",
  },
  {
    slug: "usb-c-hub-7in1",
    sku: "LT-HB-003",
    brand: "LuminaTech",
    nameEn: "USB-C Hub 7-in-1",
    nameZh: "USB-C 扩展坞 7合1",
    shortDescEn: "4K HDMI, 100W PD, SD card reader in one compact hub.",
    shortDescZh: "4K HDMI、100W 快充、读卡器，一坞搞定。",
    descriptionEn: `Expand a single USB-C port into 7 essential interfaces.

![USB-C Hub](${photo("hub-detail-en", 900, 500)})

Power Delivery passthrough charges your laptop while peripherals stay connected.`,
    descriptionZh: `一个 USB-C 扩展为 7 个常用接口，PD 透传可同时充电。

![扩展坞](${photo("hub-detail-zh", 900, 500)})

铝合金外壳散热更好，即插即用免驱动。`,
    categoryEn: "Accessories",
    categoryZh: "配件",
    price: 49.99,
    image: photo("hub-main"),
    images: JSON.stringify([photo("hub-1"), photo("hub-2")]),
    specsEn: JSON.stringify([
      { label: "Ports", value: "HDMI 4K@60Hz, 2×USB-A 3.0, USB-C, SD/TF, PD 100W" },
      { label: "Data speed", value: "5Gbps" },
      { label: "PD input", value: "Up to 100W" },
      { label: "Material", value: "Aluminum alloy" },
      { label: "Cable", value: "15cm braided USB-C" },
      { label: "Compatibility", value: "Thunderbolt 3/4, USB-C" },
    ]),
    specsZh: JSON.stringify([
      { label: "接口", value: "HDMI 4K@60Hz、2×USB-A 3.0、USB-C、SD/TF、PD 100W" },
      { label: "传输速率", value: "5Gbps" },
      { label: "PD 输入", value: "最高 100W" },
      { label: "材质", value: "铝合金" },
      { label: "线缆", value: "15cm 编织 USB-C" },
      { label: "兼容", value: "Thunderbolt 3/4、USB-C" },
    ]),
    highlightsEn: JSON.stringify([
      "Simultaneous 4K display + charging",
      "Individual port surge protection",
      "Compact travel-friendly design",
    ]),
    highlightsZh: JSON.stringify([
      "4K 投屏与充电同时进行",
      "各接口独立防浪涌保护",
      "紧凑设计，差旅便携",
    ]),
    stock: 200,
    featured: true,
    warranty: "18 months",
  },
  {
    slug: "portable-ssd-1tb",
    sku: "LT-SS-004",
    brand: "LuminaTech",
    nameEn: "Portable SSD 1TB",
    nameZh: "移动固态硬盘 1TB",
    shortDescEn: "1050MB/s read speed in a pocket-size NVMe enclosure.",
    shortDescZh: "口袋大小 NVMe 移动硬盘，读速 1050MB/s。",
    descriptionEn: `Transfer a 4K movie in seconds with USB 3.2 Gen2 speeds.

![Portable SSD](${photo("ssd-detail-en", 900, 500)})

Hardware encryption keeps your files safe. Shock-resistant metal body.`,
    descriptionZh: `USB 3.2 Gen2 高速传输，4K 电影秒传，硬件加密保护数据。

![移动固态硬盘](${photo("ssd-detail-zh", 900, 500)})

金属机身抗摔，兼容 PC、Mac、PlayStation 及 Android OTG。`,
    categoryEn: "Storage",
    categoryZh: "存储",
    price: 99.99,
    image: photo("ssd-main"),
    images: JSON.stringify([photo("ssd-1"), photo("ssd-2")]),
    specsEn: JSON.stringify([
      { label: "Capacity", value: "1TB" },
      { label: "Read / Write", value: "1050 / 1000 MB/s" },
      { label: "Interface", value: "USB 3.2 Gen2 (10Gbps)" },
      { label: "Encryption", value: "AES 256-bit hardware" },
      { label: "Dimensions", value: "85 × 54 × 10 mm" },
      { label: "Weight", value: "45g" },
    ]),
    specsZh: JSON.stringify([
      { label: "容量", value: "1TB" },
      { label: "读 / 写", value: "1050 / 1000 MB/s" },
      { label: "接口", value: "USB 3.2 Gen2（10Gbps）" },
      { label: "加密", value: "AES 256 硬件加密" },
      { label: "尺寸", value: "85 × 54 × 10 mm" },
      { label: "重量", value: "45g" },
    ]),
    highlightsEn: JSON.stringify([
      "Real-world 10Gbps performance",
      "Password-protected encryption",
      "Includes USB-C to C and C to A cables",
    ]),
    highlightsZh: JSON.stringify([
      "真实 10Gbps 级传输体验",
      "支持密码加密",
      "附 USB-C 双头及 C 转 A 线",
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
    shortDescEn: "AMOLED display, GPS, and 14-day battery in a rugged design.",
    shortDescZh: "AMOLED 大屏，GPS 定位，14 天续航，坚固设计。",
    descriptionEn: `Track 120+ sport modes with dual-band GPS for accurate outdoor routes.

![Smart Watch](${photo("watch-detail-en", 900, 500)})

1.43" AMOLED screen stays readable in direct sunlight. 5ATM water resistance.`,
    descriptionZh: `支持 120+ 运动模式，双频 GPS 精准记录户外轨迹。

![智能手表](${photo("watch-detail-zh", 900, 500)})

1.43 英寸 AMOLED 屏，5ATM 防水，可游泳佩戴。`,
    categoryEn: "Wearables",
    categoryZh: "穿戴",
    price: 199.0,
    image: photo("watch-main"),
    images: JSON.stringify([
      photo("watch-1"),
      photo("watch-2"),
      photo("watch-3"),
    ]),
    specsEn: JSON.stringify([
      { label: "Display", value: '1.43" AMOLED, 466×466' },
      { label: "Battery", value: "Up to 14 days (typical use)" },
      { label: "GPS", value: "Dual-band L1 + L5" },
      { label: "Water resistance", value: "5ATM / IP68" },
      { label: "Sensors", value: "HR, SpO2, accelerometer, gyro" },
      { label: "Compatibility", value: "iOS 13+ / Android 8+" },
    ]),
    specsZh: JSON.stringify([
      { label: "屏幕", value: "1.43 英寸 AMOLED，466×466" },
      { label: "续航", value: "典型使用最长 14 天" },
      { label: "GPS", value: "双频 L1 + L5" },
      { label: "防水", value: "5ATM / IP68" },
      { label: "传感器", value: "心率、血氧、加速度、陀螺仪" },
      { label: "兼容", value: "iOS 13+ / Android 8+" },
    ]),
    highlightsEn: JSON.stringify([
      "Always-on display option",
      "Offline map support for hiking",
      "100+ customizable watch faces",
    ]),
    highlightsZh: JSON.stringify([
      "支持常亮显示",
      "离线地图，徒步更安心",
      "100+ 表盘随心换",
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
  await prisma.product.deleteMany();
  await prisma.order.deleteMany();

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log(`Seeded ${products.length} digital products with markdown descriptions`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
