# Stagevio / 独立站 技术与运维手册

> 适用对象：店铺运营 / 非专职开发  
> 线上地址：https://517002650-luminatech-store.vercel.app（迁移自定义域前）  
> 代码仓库：https://github.com/517002650/luminatech-store  
> 更新日期：2026-08-26

本文档用于**上线后日常管理**：改商品、看订单、改密码、重新部署、排查故障。

**部署上线完整步骤（防忘）：** [DEPLOYMENT.md](./DEPLOYMENT.md)（Vercel + Cloudinary + PostgreSQL）  
**品牌与域名方案：** [BRAND.md](./BRAND.md)（首选 **Stagevio**；Plotnova / Voxrig 为备选）

---

## 1. 系统概览

| 项目 | 说明 |
|------|------|
| 店铺名 | **Stagevio**（正式品牌，见 [BRAND.md](./BRAND.md)） |
| 目标主域名 | `stagevio.com`（绑定后更新 §2 与 `NEXT_PUBLIC_APP_URL`） |
| 技术栈 | Next.js 16 + TypeScript + Tailwind + Prisma |
| 前台语言 | 中文 `/zh`、英文 `/en` |
| 托管 | Vercel |
| 数据库 | Neon PostgreSQL |
| 图片 | Cloudinary |
| 支付 | Stripe（信用卡 + 支付宝 + 微信支付）/ PayPal（可选，需配置后才显示） |
| 邮件 | SMTP（订单确认、发货通知，可选） |

### 核心能力

- 商品展示（中英双语、Markdown 详情、图库、搜索）
- 商品 **多规格 / 变体**（每规格独立 SKU、售价、划线价、库存；前台可选规格下单）
- 商品 **上架 / 下架**（下架后前台不可见、不可加购）
- **链接推广提成**（推广员专属 `?ref=` 链接，付款后计佣，后台结算）
- 购物车、结算、收货地址、运费与税费、优惠码
- **支付**：Stripe（信用卡 / 支付宝 / 微信支付）+ PayPal（可选）
- 用户注册/登录、订单查询、收藏、复购、已购评价
- 后台：商品/分类、订单与退款、退货、评价审核、客户留言、优惠码、运费、备份
- 邮件：下单确认、发货通知（需 SMTP）；联系表单可进后台收件箱

---

## 2. 重要网址一览

| 用途 | 地址 |
|------|------|
| 前台首页（中文） | https://517002650-luminatech-store.vercel.app/zh |
| 前台首页（英文） | https://517002650-luminatech-store.vercel.app/en |
| 商品列表 | https://517002650-luminatech-store.vercel.app/zh/products |
| 用户登录 | https://517002650-luminatech-store.vercel.app/zh/login |
| 用户注册 | https://517002650-luminatech-store.vercel.app/zh/register |
| 我的订单 | https://517002650-luminatech-store.vercel.app/zh/account/orders |
| 收藏夹 | https://517002650-luminatech-store.vercel.app/zh/account/wishlist |
| **后台登录** | https://517002650-luminatech-store.vercel.app/admin |
| GitHub 代码 | https://github.com/517002650/luminatech-store |
| Vercel 控制台 | https://vercel.com/dashboard |
| **Vercel 环境变量（直达）** | https://vercel.com/dashan4/517002650-luminatech-store/settings/environment-variables |
| Neon 数据库 | https://console.neon.tech |
| Cloudinary | https://console.cloudinary.com |
| Stripe | https://dashboard.stripe.com |
| PayPal 开发者 | https://developer.paypal.com |

### 2.1 如何进入后台管理

1. 浏览器打开：**https://517002650-luminatech-store.vercel.app/admin**  
2. **首次部署（库中尚无管理员）**：用安装口令（Vercel 的 `ADMIN_PASSWORD`）创建首个 **Owner**（邮箱 + 登录密码 ≥12 位）  
3. **之后登录**：使用 Owner/Admin 的**邮箱 + 密码**（不再用环境变量当日常登录密码）  
4. 可选：在「安全设置」开启 TOTP 两步验证；Owner 可在「团队账号」添加其他管理员

| 环境 | 地址 | 说明 |
|------|------|------|
| **线上** | https://517002650-luminatech-store.vercel.app/admin | 首次用 `ADMIN_PASSWORD` 做安装口令；日常用管理员邮箱登录 |
| **本地** | http://localhost:3000/admin | 同上；未设 `ADMIN_PASSWORD` 时安装口令临时为 `admin123` |

**线上会话签名（必须）：**

- 推荐设置 `ADMIN_SECRET`（≥16 位随机串）用于签名 cookie  
- 或保留强 `ADMIN_PASSWORD`（≥12 位）作签名兜底  

忘记 **Owner 登录密码**：由另一 Owner 在「团队账号」新建账号，或清空 `AdminAccount` 表后重新引导（运维操作，慎用）。忘记 2FA：Owner 可在团队页「重置 2FA」。

---

## 3. 账号与密码（请自行妥善保管）

| 系统 | 用途 | 备注 |
|------|------|------|
| `ADMIN_PASSWORD` / `ADMIN_SECRET` | 首次引导安装口令 + 会话签名 | 日常登录用 DB 管理员邮箱；见 §2.1 |
| 后台 Owner/Admin | `/admin` 邮箱登录 | 「安全设置」改密/2FA；「团队账号」仅 Owner |
| GitHub | 代码仓库 | 不要用密码推送；用 Personal Access Token，用完删除 |
| Vercel | 部署与环境变量 | 用 GitHub 账号登录即可 |
| Neon | 数据库 | Connection string 填在 `DATABASE_URL` |
| Cloudinary | 商品图片 | Cloud name / API Key / API Secret |
| Stripe / PayPal | 收款 | 测试密钥可先用，正式营业换 Live |
| SMTP 邮箱 | 发邮件 | Gmail 需「应用专用密码」 |

> **安全原则**：密钥只放在 Vercel Environment Variables 或本地 `.env`，不要发到聊天、不要提交到 GitHub。

---

## 4. 环境变量清单（Vercel）

在 Vercel → 项目 → **Settings** → **Environment Variables** 中管理。

### 必填

| 变量名 | 含义 | 获取位置 |
|--------|------|----------|
| `DATABASE_URL` | PostgreSQL 连接串 | Neon → Connection string（建议 Pooled，带 `sslmode=require`） |
| `NEXT_PUBLIC_APP_URL` | 网站完整地址 | 如 `https://luminatech-store2.vercel.app` |
| `ADMIN_PASSWORD` | 首次创建 Owner 的安装口令；也可作会话签名兜底 | 线上 ≥12 位强密码（禁止 `admin123`） |
| `ADMIN_SECRET` | 后台会话签名（推荐） | ≥16 位随机串 |
| `USER_SESSION_SECRET` | 用户登录会话密钥 | 自己设定一长串随机字符 |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary 云名称 | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | 同上 |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | 同上 |

### 支付（要收款时填）

| 变量名 | 含义 |
|--------|------|
| `STRIPE_SECRET_KEY` | Stripe 私钥（`sk_test_` 或 `sk_live_`） |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 公钥 |
| `STRIPE_PAYMENT_METHODS` | 可选，默认 `card,alipay,wechat_pay`；需在 Stripe 后台开通对应方式 |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal Client ID（可选） |

### 邮件（要发确认/发货邮件时填）

| 变量名 | 示例 |
|--------|------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | 你的邮箱 |
| `SMTP_PASS` | 应用专用密码 |
| `SMTP_FROM` | `"Stagevio <noreply@stagevio.com>"`（迁移前可用临时发件域） |
| `STORE_NAME` | `Stagevio` |
| `CONTACT_EMAIL` | 联系页展示邮箱 |

修改环境变量后，需要在 Vercel **Redeploy** 一次才会生效。

---

## 5. 日常运营操作

### 5.0 修改管理员密码 / 2FA / 团队

日常**不要**改环境变量来换登录密码：

1. 登录后台 → **安全设置**：修改自己的密码、绑定或关闭 TOTP  
2. **Owner** → **团队账号**：添加 Admin/Owner、停用账号、重置他人 2FA  

`ADMIN_PASSWORD` 仅用于：空库时创建首个 Owner 的安装口令，以及（未设 `ADMIN_SECRET` 时）会话签名兜底。

更完整部署说明见：[DEPLOYMENT.md §4.1](./DEPLOYMENT.md)

### 5.1 后台改商品（含上架 / 下架、多规格）

1. 打开 `/admin`，用管理员邮箱登录（见 §2.1）
2. **商品列表** → 编辑 / 新增 / 删除
3. **上架 / 下架**：
   - 列表「状态」列点 **下架** / **上架**
   - 或编辑页勾选 / 取消 **上架销售**
   - 下架后：前台列表、搜索、sitemap 隐藏；详情 404；购物车校验会拒绝
   - 新商品默认上架；已有商品同步 schema 后也默认上架
4. **规格与价格（可售变体）** — 编辑页「规格与价格」区块：
   - 每个规格可设：中英规格名、**SKU**、**售价**、划线价、**库存**、启用、是否默认
   - 点「+ 添加规格」可增加选项（如「标准版 / 专业套装」）
   - **至少保留 1 个规格**；仅 1 个时前台不显示选择器，直接按该规格价与库存出售
   - ≥2 个启用规格时，前台详情页出现「选择规格」；售罄规格按钮禁用
   - 购物车、结账、扣库存、退款均按所选规格（`variantId`）计价与履约
   - 商品列表上的价格 / 库存为默认规格价与各启用规格库存之和（镜像字段）
5. 图片：点上传（自动存到 Cloudinary）
6. 详细描述支持 Markdown：图片 `![](url)`；**可点击链接** `[文字](https://...)`（新窗口打开）；**内嵌视频** `![介绍视频](YouTube/Bilibili链接)`（编辑器有「插入链接 / 插入视频」）
7. **参数表**（展示用，与可售规格不同）：每行 `参数名 | 参数值`
8. 亮点：每行一条

> **升级说明**：部署含 `ProductVariant` 的版本后，构建时的 `db push` 会建表；`db:seed` 会给尚无规格的老商品自动补 1 个默认规格（复制原商品价与库存）。要卖多档价，请到后台为商品添加多个规格。

### 5.2 处理订单

1. 后台 → **订单管理**
2. 查看收货地址、商品明细、支付方式
3. 更新状态：已付款 → 处理中 → **已发货** → 已完成
4. 改为「已发货」且已配置 SMTP 时，会自动给客户发邮件
5. 可导出 Excel；支持 Stripe 退款（订单详情内）

### 5.3 评价、退货、留言

| 菜单 | 说明 |
|------|------|
| **评价审核** `/admin/reviews` | 审核已购用户评价；可开关「评价审核」（关闭后提交即展示） |
| **用户管理** `/admin/users` | 搜索用户、加入/解除评价黑名单 |
| **退货申请** `/admin/returns` | 处理客户退货请求 |
| **客户留言** `/admin/inbox` | 联系页表单提交的消息 |

### 5.3.1 固件 / 附件维护

商品编辑页 → **购买后下载**：

| 操作 | 说明 |
|------|------|
| 添加下载项 | 上传新固件/文件/插件并设版本 |
| **替换文件** | 同一条记录换新文件；默认勾选删除旧 Cloudinary 文件 |
| **删除** | 可勾选「同时删除 Cloudinary / 本地文件」；不勾选则只删数据库记录 |
| 点「文件」 | 后台试下载，用于确认链接是否正常 |

本地路径（`/downloads/...`）在线上无效，需用「替换文件」重新传到 Cloudinary。

### 5.3.2 媒体清理（孤儿图片 / 附件）

后台菜单 **媒体清理** `/admin/media`：

1. 勾选「保护历史订单中的商品图片」（默认开启）
2. 点 **扫描未引用文件**
3. 勾选要删的项 → **删除选中**

仅扫描 `stagevio/products`、`stagevio/downloads`（图片与固件），以及历史路径 `luminatech/products`、`luminatech/downloads`。仍被商品主图/图库/详情 Markdown、附件引用的文件不会出现在列表中。

### 5.4 前台用户相关

| 功能 | 说明 |
|------|------|
| 注册/登录 | 用户可查订单、收藏、写评价 |
| 收藏夹 | `/account/wishlist` |
| 再次购买 | 订单详情页「再次购买」加入购物车 |
| 评价 | 需购买验证；后台审核后展示 |

### 5.6 推广员与提成（链接 + 优惠券）

#### 绑定前台用户（必做）

1. 合作方先在前台 **注册普通用户**（邮箱账号）
2. **自助开通（推荐）**：登录后打开 **成为推广员 / 我的推广**，可 **自动生成或手动输入推广码** 一键注册；页内醒目展示管理员联系方式，用于谈提成
3. **后台开通**：后台 → **推广员** → 新增 → 搜索用户 → 推广码可选自动/手动 → 填佣金比例
4. 对方用 **前台登录**（非后台）→ **我的账户 → 我的推广**，查看推广状态、链接与结算状态
5. 后台 → **推广员** 页顶部可配置：是否开放自助注册、默认佣金%、管理员邮箱/电话/微信/说明

#### 链接推广

1. 开通后把专属链接发给合作方，例如：`https://你的域名/zh?ref=ZHANGSAN`
2. 访客点击后 Cookie 记住推广码 **30 天**；期间下单并**付款成功** → 生成提成（状态：待结算）

#### 优惠券推广

1. 先创建推广员（同上）
2. 后台 → **优惠码** → 新增 → **绑定推广员**（选中对应推广员）
3. 把该优惠码发给合作方 / KOL；买家结算时输入券码并付款 → 订单归因到该推广员并计佣
4. **归因优先级**：若订单使用了「已绑定推广员」的优惠码，**优先按优惠券归因**；否则用链接 Cookie

#### 通用规则

- 计佣基数 = **商品小计 − 优惠**（不含运费、税）
- 后台将订单标为 **已完成** → 提成变为 **可结算**；全额退款 / 取消 → **作废**
- 后台 → **推广提成** → 人工打款后点「标记已打款」（前台同步显示「已打款」）
- 未绑定推广员的优惠码：只打折，**不产生提成**

### 5.7 财务（经营账本 + 提成结算）

后台 → **财务** `/admin/finance`：

| 模块 | 说明 |
|------|------|
| **经营账本** | 按今日 / 近 7 天 / 本月 / 自定义区间汇总：商品成交额、优惠、运费、税、实收、已退款、净收入（约） |
| **提成结算台** | 同期按推广员汇总待结算 / 可结算 / 已打款；可一键将「可结算」标为已打款 |
| **导出** | 本周期订单 Excel（含金额拆分）、本周期提成 Excel |

注意：订单详情里的「发货单打印」是装箱单，**不是**税务发票；支付通道手续费请在 Stripe / PayPal 后台查看。

---

## 6. 代码与部署流程

### 6.1 目录结构（简要）

```
web/
├── prisma/           # 数据库模型 schema.prisma、seed 示例数据
├── messages/         # 中英文翻译
├── src/app/          # 页面（前台 [locale] + 后台 admin + API）
├── src/components/   # UI 组件
├── src/lib/          # 数据库、邮件、支付、鉴权等
├── .env.example      # 环境变量模板（无真实密钥）
├── DEPLOY.md         # 部署步骤说明
└── docs/TECHNICAL.md # 本文档
```

### 6.2 本地开发

```powershell
cd "e:\项目\独立站\web"
copy .env.example .env
# 编辑 .env：DATABASE_URL 用 Neon 连接串（不要用 sqlite）
npm install
npx prisma db push
npm run db:seed
npm run dev
```

浏览器打开：http://localhost:3000

### 6.3 更新上线（标准流程）

1. 本地改代码 / 让 AI 改代码  
2. 提交 Git：
   ```powershell
   cd "e:\项目\独立站\web"
   & "C:\Program Files\Git\bin\git.exe" add .
   & "C:\Program Files\Git\bin\git.exe" -c user.name="你的名字" -c user.email="你的邮箱" commit -m "说明这次改了什么"
   ```
3. 推送到 GitHub（需要 Personal Access Token，勾选 `repo`）：
   ```powershell
   & "C:\Program Files\Git\bin\git.exe" push origin main
   ```
4. Vercel 自动构建部署（约 1–3 分钟）
5. 打开线上网站验证

### 6.4 构建时自动做的事

当前 `package.json` / `vercel.json` 构建命令包含：

1. `prisma generate` — 生成数据库客户端  
2. `prisma db push` — 同步表结构到 PostgreSQL  
3. `npm run db:seed` — **仅当商品表为空时**导入示例商品  
4. `next build` — 构建网站  

因此：上线后你在后台改的商品**不会**被 seed 覆盖（已有商品会跳过 seed）。

---

## 7. 数据库说明

### 主要数据表

| 表 | 内容 |
|----|------|
| `Product` | 商品（中英字段、图片、`active` 上下架等；`price`/`stock`/`sku` 为默认规格镜像） |
| `ProductVariant` | 可售规格（独立 SKU、中英名、售价、划线价、库存、默认标记） |
| `Coupon` | 优惠码（可选 `affiliateId` 绑定推广员） |
| `Affiliate` | 推广员（code、佣金率、**绑定 User**） |
| `Commission` | 订单提成（pending/approved/paid/void） |
| `Order` | 订单（含 `affiliateCode` / `affiliateId`、商品 JSON 含 `variantId`） |
| `User` | 前台用户 |
| `WishlistItem` | 收藏（商品级，不含规格） |
| `Review` | 商品评价（含审核状态） |
| `ReturnRequest` | 退货申请 |
| `ContactMessage` | 联系页留言 |

### 常用命令

```powershell
cd "e:\项目\独立站\web"
$env:DATABASE_URL="你的Neon连接串"

npx prisma db push      # 同步表结构（含 ProductVariant）
npm run db:seed         # 仅空库时导入示例商品；并为无规格商品补默认规格
npx tsx scripts/backfill-variants.ts   # 可选：仅回填缺失的默认规格
npx prisma studio       # 可视化查看/编辑数据（浏览器打开）
```

---

## 8. 支付与邮件

### Stripe：信用卡 / 支付宝 / 微信支付

本站通过 **Stripe Checkout** 收款。同一支付按钮可进入收银台，选择：

- 信用卡 / 借记卡  
- **支付宝（Alipay）**  
- **微信支付（WeChat Pay）**

#### 开通步骤（必做，否则收银台可能只有卡）

1. 登录 https://dashboard.stripe.com  
2. **Settings（设置）→ Payment methods（支付方式）**  
3. 找到 **Alipay**、**WeChat Pay**，点 **Turn on / 开启**  
4. 按提示完成审核（部分账号需企业信息；测试模式通常可先打开）  
5. 确认 Vercel / `.env` 已配置：
   ```env
   STRIPE_SECRET_KEY=sk_test_...或 sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...或 pk_live_...
   # 可选，默认已是下面这行
   STRIPE_PAYMENT_METHODS=card,alipay,wechat_pay
   ```
6. 改完环境变量后 **Redeploy**

> 若账号尚未开通支付宝/微信，系统会**自动回退为仅信用卡**，避免整单失败。

#### Stripe 测试

- 卡号：`4242 4242 4242 4242`，任意未来日期和 CVC  
- 支付宝 / 微信：在 Stripe 测试模式按收银台提示操作（以 Dashboard 说明为准）

#### 说明（重要）

- 这是 **Stripe 跨境支付宝/微信**，适合海外独立站收款到 Stripe 账户  
- **不是**国内「支付宝开放平台 / 微信商户平台」直连（那需要国内主体与另行对接）  
- 可用性取决于 Stripe 账户所在国家/地区与审核状态  

### PayPal

配置 `NEXT_PUBLIC_PAYPAL_CLIENT_ID` 后结算页显示 PayPal 按钮。

### Stripe Tax（推荐正式开卖前开启）

1. Stripe Dashboard → **Settings → Tax** 开通税务  
2. Vercel 环境变量设 `STRIPE_TAX_ENABLED=true` 并 Redeploy  
3. 结账页显示「支付时由 Stripe Tax 计算」；收银台按收货地址精确计税  
4. 未开启时仍用 `TAX_*` / 内置国别扁率估算（仅适合测试）

退货后台支持全额 / 部分退款：全额会 Stripe 退款 + 回库存 + 取消订单；部分退款仅退款记账不改库存。支付履约在同一事务内扣库存；库存不足会自动退款。

### 划线价 / 促销价

后台在**每个规格**上可填「划线价」（`compareAtPrice`），须大于该规格售价；前台选中该规格时显示删除线原价。列表卡上的划线价取自默认规格。

### 多规格示例（本地）

本地可用脚本给某个商品写入 3 档演示规格（标准 / 专业 / 入门）：

```powershell
cd "e:\项目\独立站\web"
npx tsx scripts/seed-multi-variants.ts
```

然后打开该商品的前台详情页即可看到规格选择器。线上请用后台「规格与价格」手工配置。

### 地址簿

登录用户可在「我的账户 → 收货地址」保存地址；结算页可一键选用默认地址。

### GA4 购买事件

配置 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 且用户同意分析 Cookie 后，支付成功页在订单落库后发送 GA4 `purchase` 事件。

### 发票 / 装箱单

后台订单详情可打印发票（订单号、地址、明细、金额）。

### 邮件触发时机

| 时机 | 邮件 |
|------|------|
| 支付成功、订单创建 | 订单确认邮件（含商品、地址） |
| 后台状态改为「已发货」 | 发货通知邮件 |

未配置 SMTP 时：订单仍正常，只是不发信。

---

## 9. 常见问题排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 前台 `/zh` 500 或空白 | 数据库连不上 / 表未建 | 检查 `DATABASE_URL`，Redeploy；看 Build 日志是否有 `db push` 成功 |
| 后台登录后报错 | 同上 | 同上；修复后应看到商品列表 |
| 后台登录页提示会话密钥未配置 | 未设 `ADMIN_SECRET` 且 `ADMIN_PASSWORD` 过弱/缺失 | Vercel 设 `ADMIN_SECRET`（≥16）或强 `ADMIN_PASSWORD` 并 Redeploy |
| 部署后要求创建 Owner | 正常：空库首次引导 | 用安装口令 + 邮箱创建首个 Owner |
| 下架商品仍出现在前台 | 缓存未刷新或未点保存 | 后台再点一次上下架；硬刷新前台 |
| 前台没有「选择规格」 | 该商品只有 1 个启用规格 | 后台编辑 → 规格与价格 → 添加更多规格并保存 |
| 选规格后加购价格不对 | 旧购物车缓存 / 未保存规格 | 清空购物车再加；确认后台该规格售价已保存 |
| 某规格无法点击 | 该规格库存为 0 或未启用 | 后台提高库存或勾选「启用」 |
| 上传图片失败 | Cloudinary 未配或配错 | 检查三个 `CLOUDINARY_*`，Redeploy |
| 改了环境变量不生效 | 未重新部署 | Vercel → Deployments → Redeploy |
| 支付提示 `Stripe is not configured` | 未配置 `STRIPE_SECRET_KEY` | 见下方「配置 Stripe 密钥」 |
| 支付按钮无效 | 未配 Stripe/PayPal | 同上 |
| 收不到邮件 | 未配 SMTP 或邮箱拦截 | 检查 SMTP 变量；看垃圾箱 |
| 推送 Git 失败 | Token 无效/无 repo 权限 | 新建 Classic Token，勾选 `repo`，用完删除 |
| 本地与线上数据不一致 | 本地/线上是不同数据库 | 正常现象；线上数据只在 Neon |
| 买家/后台下载 `download_failed` | Cloudinary 密钥错、账号不一致、或附件为本地路径 | 见 [DEPLOYMENT.md §7.2](./DEPLOYMENT.md#72-固件文件下载失败download_failed快速修复) |
| 直接打开 Cloudinary zip 链接 401 | raw/zip 禁止公开直链 | 必须在网站内点「下载」，走 `/api/downloads/[id]` |

### 固件/文件下载失败（详细）

完整排查步骤、根因与验证命令见 **[DEPLOYMENT.md §7.2](./DEPLOYMENT.md#72-固件文件下载失败download_failed快速修复)**。

**30 秒速查：**

1. 后台登录后打开 `/api/admin/cloudinary-health` → 要 `ok: true`  
2. Vercel 三个 `CLOUDINARY_*` 必须是 [Cloudinary 控制台](https://console.cloudinary.com) 真实值，且 **cloud name 与附件 URL 一致**  
3. 改完环境变量 → **Redeploy**  
4. 附件 `fileUrl` 若是 `/downloads/...` → 线上**重新上传**到 Cloudinary  
5. **清空买家账号不能修复下载**（与 Cloudinary 配置无关）

---

1. 打开 https://dashboard.stripe.com/test/apikeys （确认是 **Test mode**）
2. 复制 **Secret key**（`sk_test_...`）和 **Publishable key**（`pk_test_...`）
3. Vercel → 项目 → **Settings** → **Environment Variables**，新增：
   - `STRIPE_SECRET_KEY` = `sk_test_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
4. **Deployments** → **Redeploy**
5. 再用测试卡 `4242 4242 4242 4242` 试一次

密钥不要发到聊天、不要提交 GitHub。

### 查看日志

1. Vercel → 项目 → **Deployments** → 最新一次 → **Building / Runtime Logs**  
2. 刷新出错页面，对照红色报错  

---

## 10. 上线后安全清单

- [ ] `ADMIN_PASSWORD` 已设为 ≥12 位强密码（非 `admin123`）并 Redeploy（§5.0 / [DEPLOYMENT.md §4.1](./DEPLOYMENT.md)）  
- [ ] 确认 GitHub Token 用完即删，勿长期放在聊天里  
- [ ] `.env` 不要提交到 Git（已在 `.gitignore`）  
- [ ] 正式营业前切换 Stripe/PayPal 为 Live 密钥  
- [ ] 建议绑定自定义域名（目标 `stagevio.com`，见 [BRAND.md](./BRAND.md)），并更新 `NEXT_PUBLIC_APP_URL`  
- [ ] 品牌迁移后：联系邮箱为 `@stagevio.com`（代码默认已改；Vercel 须同步 `CONTACT_EMAIL` / `STORE_NAME`）  
- [ ] 定期到 Neon / Cloudinary 查看用量（免费额度）  

---

## 11. 以后让 AI 帮忙时可以怎么说

直接复制下面这类指令即可：

- 「把后台密码环境变量说明写进文档」  
- 「给商品加库存预警」  
- 「给某个商品加三个规格，各自不同价格」  
- 「绑定自定义域名后要改哪些配置」  
- 「接入正式 Stripe Live 密钥的步骤」  
- 「首页 Banner 换成大图」  
- 「导出订单增加快递单号列」  

仓库路径：`e:\项目\独立站\web`  
线上域名：`517002650-luminatech-store.vercel.app`（绑定 Stagevio 自定义域后改此行）

---

## 12. 相关文档

| 文件 | 内容 |
|------|------|
| `README.md` | 功能介绍与本地快速开始 |
| `DEPLOY.md` | 首次部署补充说明 |
| `docs/BRAND.md` | **品牌与域名**：首选 Stagevio，备选 Plotnova / Voxrig |
| `docs/DEPLOYMENT.md` | **部署上线防忘手册**（Vercel + Cloudinary + PostgreSQL） |
| `docs/TECHNICAL.md` | 日常运维与技术说明 |
| `.env.example` | 环境变量模板 |

---

**维护建议**：每次重大改动（新支付方式、换域名、改数据库、完成品牌迁移）后，更新本文档第 1、2、4、10 节与 [BRAND.md](./BRAND.md)。
