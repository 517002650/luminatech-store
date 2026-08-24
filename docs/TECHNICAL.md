# LuminaTech 技术与运维手册

> 适用对象：店铺运营 / 非专职开发  
> 线上地址：https://luminatech-store2.vercel.app  
> 代码仓库：https://github.com/517002650/luminatech-store  
> 更新日期：2026-08-25

本文档用于**上线后日常管理**：改商品、看订单、改密码、重新部署、排查故障。

**部署上线完整步骤（防忘）：** [DEPLOYMENT.md](./DEPLOYMENT.md)（Vercel + Cloudinary + PostgreSQL）

---

## 1. 系统概览

| 项目 | 说明 |
|------|------|
| 店铺名 | LuminaTech |
| 技术栈 | Next.js 16 + TypeScript + Tailwind + Prisma |
| 前台语言 | 中文 `/zh`、英文 `/en` |
| 托管 | Vercel |
| 数据库 | Neon PostgreSQL |
| 图片 | Cloudinary |
| 支付 | Stripe（信用卡 + 支付宝 + 微信支付）/ PayPal（可选） |
| 邮件 | SMTP（订单确认、发货通知，可选） |

### 核心能力

- 商品展示（中英双语、Markdown 详情、图库）
- 购物车、结算、收货地址
- **支付**：Stripe（信用卡 / 支付宝 / 微信支付）+ PayPal
- 用户注册/登录、订单查询、收藏、复购、评价
- 后台：商品 CRUD、订单状态、Excel 导出、图片上传
- 邮件：下单确认、发货通知（需 SMTP）

---

## 2. 重要网址一览

| 用途 | 地址 |
|------|------|
| 前台首页（中文） | https://luminatech-store2.vercel.app/zh |
| 前台首页（英文） | https://luminatech-store2.vercel.app/en |
| 商品列表 | https://luminatech-store2.vercel.app/zh/products |
| 用户登录 | https://luminatech-store2.vercel.app/zh/login |
| 用户注册 | https://luminatech-store2.vercel.app/zh/register |
| 我的订单 | https://luminatech-store2.vercel.app/zh/account/orders |
| 收藏夹 | https://luminatech-store2.vercel.app/zh/account/wishlist |
| **后台登录** | https://luminatech-store2.vercel.app/admin |
| GitHub 代码 | https://github.com/517002650/luminatech-store |
| Vercel 控制台 | https://vercel.com/dashboard |
| Neon 数据库 | https://console.neon.tech |
| Cloudinary | https://console.cloudinary.com |
| Stripe | https://dashboard.stripe.com |
| PayPal 开发者 | https://developer.paypal.com |

---

## 3. 账号与密码（请自行妥善保管）

| 系统 | 用途 | 备注 |
|------|------|------|
| 后台 `ADMIN_PASSWORD` | 登录 `/admin` | **当前仍为默认 `admin123`**，请按下方「5.0 修改管理员密码」尽快改掉 |
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
| `ADMIN_PASSWORD` | 后台密码 | 自己设定 |
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
| `SMTP_FROM` | `"LuminaTech <noreply@yourdomain.com>"` |
| `STORE_NAME` | `LuminaTech` |
| `CONTACT_EMAIL` | 联系页展示邮箱 |

修改环境变量后，需要在 Vercel **Redeploy** 一次才会生效。

---

## 5. 日常运营操作

### 5.0 修改管理员密码（当前：默认 `admin123`）

后台密码存在 Vercel 环境变量 **`ADMIN_PASSWORD`** 里，不在网页里改。

**线上改法：**

1. Vercel → 项目 `luminatech-store2` → **Settings** → **Environment Variables**
2. 编辑或新增 `ADMIN_PASSWORD` = 你的新密码
3. **Deployments** → **Redeploy**（必须）
4. 打开 https://luminatech-store2.vercel.app/admin ，用新密码登录
5. 确认旧密码 `admin123` 不能再登录

**规则说明：**

- 若未设置 `ADMIN_PASSWORD`，系统默认接受 `admin123`
- 一旦设置了 `ADMIN_PASSWORD`，必须以环境变量里的值为准
- 忘记密码：再改一次环境变量并 Redeploy 即可

更完整步骤见：[DEPLOYMENT.md §4.1](./DEPLOYMENT.md)

### 5.1 后台改商品

1. 打开 `/admin`，输入当前管理员密码（环境变量 `ADMIN_PASSWORD`，未改前为 `admin123`）
2. **商品列表** → 编辑 / 新增 / 删除
3. 图片：点上传（自动存到 Cloudinary）
4. 详细描述支持 Markdown，可插入图片 `![](url)`
5. 规格格式：每行 `参数名 | 参数值`
6. 亮点：每行一条

### 5.2 处理订单

1. 后台 → **订单管理**
2. 查看收货地址、商品明细、支付方式
3. 更新状态：已付款 → 处理中 → **已发货** → 已完成
4. 改为「已发货」且已配置 SMTP 时，会自动给客户发邮件
5. 可导出 Excel

### 5.3 前台用户相关

| 功能 | 说明 |
|------|------|
| 注册/登录 | 用户可查订单、收藏、写评价 |
| 收藏夹 | `/account/wishlist` |
| 再次购买 | 订单详情页「再次购买」加入购物车 |
| 评价 | 商品详情页，登录后可写星级评论 |

### 5.4 修改店铺文案 / 语言

- 中文文案：`messages/zh.json`
- 英文文案：`messages/en.json`
- 改完后提交代码并推送到 GitHub，Vercel 自动重新部署

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
| `Product` | 商品（中英字段、价格、库存、图片等） |
| `Order` | 订单（邮箱、金额、状态、商品 JSON、收货地址 JSON） |
| `User` | 前台用户 |
| `WishlistItem` | 收藏 |
| `Review` | 商品评价 |

### 常用命令

```powershell
cd "e:\项目\独立站\web"
$env:DATABASE_URL="你的Neon连接串"

npx prisma db push      # 同步表结构
npm run db:seed         # 仅空库时导入示例商品
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

### 正式收款前

1. Stripe / PayPal 完成商户认证  
2. 把 Vercel 里的密钥换成 **Live**  
3. 确认 `NEXT_PUBLIC_APP_URL` 为正式域名  
4. 确认 Live 模式下 Alipay / WeChat Pay 已开启  

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
| 上传图片失败 | Cloudinary 未配或配错 | 检查三个 `CLOUDINARY_*`，Redeploy |
| 改了环境变量不生效 | 未重新部署 | Vercel → Deployments → Redeploy |
| 支付提示 `Stripe is not configured` | 未配置 `STRIPE_SECRET_KEY` | 见下方「配置 Stripe 密钥」 |
| 支付按钮无效 | 未配 Stripe/PayPal | 同上 |
| 收不到邮件 | 未配 SMTP 或邮箱拦截 | 检查 SMTP 变量；看垃圾箱 |
| 推送 Git 失败 | Token 无效/无 repo 权限 | 新建 Classic Token，勾选 `repo`，用完删除 |
| 本地与线上数据不一致 | 本地/线上是不同数据库 | 正常现象；线上数据只在 Neon |

### 配置 Stripe 密钥（解决 `Stripe is not configured`）

1. 打开 https://dashboard.stripe.com/test/apikeys （确认是 **Test mode**）
2. 复制 **Secret key**（`sk_test_...`）和 **Publishable key**（`pk_test_...`）
3. Vercel → `luminatech-store2` → **Settings** → **Environment Variables**，新增：
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

- [ ] 将 `ADMIN_PASSWORD` 从 `admin123` 改为强密码并 Redeploy（步骤见 §5.0 / [DEPLOYMENT.md §4.1](./DEPLOYMENT.md)）  
- [ ] 确认 GitHub Token 用完即删，勿长期放在聊天里  
- [ ] `.env` 不要提交到 Git（已在 `.gitignore`）  
- [ ] 正式营业前切换 Stripe/PayPal 为 Live 密钥  
- [ ] 建议绑定自定义域名，并更新 `NEXT_PUBLIC_APP_URL`  
- [ ] 定期到 Neon / Cloudinary 查看用量（免费额度）  

---

## 11. 以后让 AI 帮忙时可以怎么说

直接复制下面这类指令即可：

- 「把后台密码环境变量说明写进文档」  
- 「给商品加库存预警」  
- 「绑定自定义域名后要改哪些配置」  
- 「接入正式 Stripe Live 密钥的步骤」  
- 「首页 Banner 换成大图」  
- 「导出订单增加快递单号列」  

仓库路径：`e:\项目\独立站\web`  
线上项目名：`luminatech-store2`

---

## 12. 相关文档

| 文件 | 内容 |
|------|------|
| `README.md` | 功能介绍与本地快速开始 |
| `DEPLOY.md` | 首次部署补充说明 |
| `docs/DEPLOYMENT.md` | **部署上线防忘手册**（Vercel + Cloudinary + PostgreSQL） |
| `docs/TECHNICAL.md` | 日常运维与技术说明 |
| `.env.example` | 环境变量模板 |

---

**维护建议**：每次重大改动（新支付方式、换域名、改数据库）后，更新本文档第 2、4、10 节中的地址与清单。
