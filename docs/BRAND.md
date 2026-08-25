# 品牌与域名方案（Stagevio）

> 决策日期：2026-08-26  
> 状态：**首选 Stagevio（代码已切换）**；Plotnova / Voxrig 为备选  
> 线上域名绑定 `stagevio.com` 与 Vercel `STORE_NAME` 等环境变量仍可能待更新，见 §5

本文记录独立站**正式品牌选型**、域名规划、商标方向与迁移清单。代码内对外品牌已统一为 Stagevio。

相关文档：[TECHNICAL.md](./TECHNICAL.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 0. 一句话结论

| 角色 | 名称 | 主域名（目标） |
|------|------|----------------|
| **首选（正式采用）** | **Stagevio** | `stagevio.com` |
| 备选 B | Plotnova | `plotnova.com` |
| 备选 C | Voxrig | `voxrig.com` |

**不要再用** LuminaTech / Luminatech / Lumina* 作为对外品牌或主联系邮箱域名（见 §5）。

---

## 1. 首选：Stagevio

### 1.1 品牌定义

| 项目 | 内容 |
|------|------|
| 英文商标 | **Stagevio** |
| 中文对外名 | Stagevio 幕光（或「Stagevio 舞台设备」） |
| 词源 | Stage（舞台）+ Vio（vivid / 鲜明光效） |
| Slogan（英） | Light up every stage |
| Slogan（中） | 点亮每一个舞台 |
| 业务匹配 | 控台 / 激光 / 舞台灯具 / 特效；中英双语；美欧英配送 |

### 1.2 域名（优先注册）

| 域名 | 用途 | 优先级 |
|------|------|--------|
| **stagevio.com** | 前台主站 + 企业邮箱 | **必买** |
| stagevio.store | 备用跳转 / 活动页 | 建议 |
| stagevio.pro | 专业感备用 | 可选 |

邮箱建议：

```text
support@stagevio.com
noreply@stagevio.com
```

### 1.3 环境变量（迁移后）

```env
STORE_NAME=Stagevio
CONTACT_EMAIL=support@stagevio.com
SMTP_FROM="Stagevio <noreply@stagevio.com>"
NEXT_PUBLIC_APP_URL=https://stagevio.com
```

Stripe Statement descriptor 建议：`STAGEVIO` 或 `STAGEVIO STORE`（长度与字符限制以 Stripe 为准）。

### 1.4 商标申请方向（需律师/代理正式检索后提交）

| 地区 | 建议类别 | 覆盖 |
|------|----------|------|
| 美国 USPTO | Class **11** + **35** | 舞台灯光装置；在线零售 |
| 中国 CNIPA | 第 **11**、**35** 类 | 照明装置；广告/网上销售 |
| 欧盟 EUIPO | 11 + 35 | 若重点做欧洲 |

正式检索入口：

- 美国：https://tmsearch.uspto.gov  
- 国际：https://www.wipo.int/branddb  
- 中国：https://sbj.cnipa.gov.cn  

> **声明**：本文为产品与运营选型记录，**不构成法律意见**。注册商标前须做正式 clearance。

### 1.5 为何选 Stagevio（相对 LuminaTech）

| 维度 | LuminaTech（旧） | Stagevio（新） |
|------|------------------|----------------|
| 同名主体 / 商标冲突 | 高（多国公司 + 美国 LUMINA 舞台灯申请） | 初步公开检索冲突较低 |
| 主域名 | `luminatech.com` 已被他人占用 | `stagevio.com` 目标可自持 |
| 行业辨识 | 易与 IT「Tech」公司混淆 | 明确舞台 / 演出 |
| 与现有视觉 | — | 可继续用 stone + amber，仅换文案 Logo |

---

## 2. 备选方案 B：Plotnova

| 项目 | 内容 |
|------|------|
| 含义 | Plot（灯位图 / 灯光编程）+ Nova（新星） |
| 适合 | 更偏灯光师、DMX、控台用户 |
| 目标域名 | `plotnova.com` |
| 风险提示 | 「Plot」在舞台圈较常见；与工业品 PLOTMARK（已放弃申请）不同业，仍建议正式检索 |
| 何时启用 | Stagevio 域名无法取得，或商标检索不可用时 |

---

## 3. 备选方案 C：Voxrig

| 项目 | 内容 |
|------|------|
| 含义 | Vox（演出语境）+ Rig（舞台设备 / rigging） |
| 适合 | 强调设备与演出工程感 |
| 目标域名 | `voxrig.com` |
| 风险提示 | 初步未见同名舞台灯品牌；仍需正式商标检索 |
| 何时启用 | Stagevio、Plotnova 均不可用时 |

---

## 4. 明确不建议使用的名称

| 名称 | 原因 |
|------|------|
| LuminaTech / Luminatech | 多家主体在用；核心 `.com` 已被占 |
| Lumina / Lumen / Lux* | 美国 LUMINA 等与舞台灯光 Class 11 相关申请 |
| Showforge | 已有 Showforge®（演出控制软件） |
| RigPlot | 已有舞台 plot 软件 |
| Showmentum | showmentum.com 娱乐公司在用 |
| CueVault | 已有其它产品占用 |
| Velum* | 法国 Velum 照明公司长期使用 |

---

## 5. 迁移清单（从 LuminaTech → Stagevio）

### 5.1 立刻可做（运营）

1. 注册 **stagevio.com**（及建议的 `.store`）  
2. 开通 `support@` / `noreply@` 邮箱  
3. 商标正式检索 → 提交 US / CN（按主体所在地）  
4. Vercel **Domains** 绑定 `stagevio.com`（步骤见 [DEPLOYMENT.md §8](./DEPLOYMENT.md)）  
5. 更新 `NEXT_PUBLIC_APP_URL`、Stripe/PayPal 回调与商户显示名 → Redeploy  

### 5.2 代码与文案（已完成 2026-08-26）

已全局切换为 Stagevio（前台/后台 Logo、i18n、邮件默认店名、发票、页面 title、seed 品牌名、备份文件名等）。

| 位置 | 说明 |
|------|------|
| `messages/en.json`、`messages/zh.json` | 品牌名与 `support@stagevio.com` |
| `.env.example` | `STORE_NAME` / `CONTACT_EMAIL` / `SMTP_FROM` |
| Header / Footer / AdminShell / 登录页 | Logo 文案 Stagevio |
| Cloudinary 新上传 | `stagevio/products`、`stagevio/downloads`（仍扫描历史 `luminatech/*`） |

**仍须运营侧完成：** 购买并绑定 `stagevio.com`、Vercel 环境变量、Stripe 商户名（见 §5.1）。

历史备份 JSON（`backups/*.json`）中的商品 `brand` 字段未改，不影响线上展示。

### 5.3 验收

- [ ] 打开 `https://stagevio.com/zh`（或绑定后的主域）首页品牌为 Stagevio  
- [ ] 联系页 / 隐私政策邮箱为 `@stagevio.com`  
- [ ] 订单邮件发件人显示 Stagevio  
- [ ] 后台侧边栏与发票抬头一致  
- [ ] 生产部署 Ready（见 [DEPLOYMENT.md §5.1](./DEPLOYMENT.md)）  

---

## 6. 视觉约定（换名可不改主题）

```text
主色：stone-900 (#1c1917) + amber-600 (#d97706)
Logo 文案：Stagevio
可选写法：Stage + 强调色 vio
```

---

## 7. 文档索引

| 文档 | 何时看 |
|------|--------|
| **本文 `docs/BRAND.md`** | 定品牌、抢域名、换标迁移 |
| `docs/TECHNICAL.md` | 日常运维；店铺名以其中 §1 为准 |
| `docs/DEPLOYMENT.md` | 绑定自定义域名、生产部署 |
| `.env.example` | 环境变量名模板 |

**维护约定**：若改用备选品牌（Plotnova / Voxrig），先更新本文 §0 结论表，再改代码与 TECHNICAL / DEPLOYMENT 中的店名与域名。
