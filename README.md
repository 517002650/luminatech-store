# LuminaStore — AI 协助开发的独立站

面向海外市场的电商 MVP，支持 **Stripe** 和 **PayPal** 支付。

> 不会写代码也没关系：按下面步骤运行，后续改商品、改页面都可以让 AI 帮你做。

## 功能

- 首页 + 商品列表 + 商品详情（规格 / 亮点 / 图库）
- **中英文切换**（`/en` 英文，`/zh` 中文，右上角切换）
- 购物车（本地保存，刷新不丢失）
- Stripe 结账（信用卡）
- PayPal 结账
- 6 个数码类示例商品（耳机、键盘、扩展坞等）
- **后台管理**（商品增删改、订单管理、Excel 导出、发货邮件）
- **详细描述支持 Markdown + 图片**
- **用户注册 / 登录**（订单查询、收藏夹、再次购买）
- **商品评价**（星级评分 + 评论，提升转化）
- **收货地址**（结算页填写，后台/用户中心可查看）
- **订单确认邮件**（支付成功后自动发送，需配置 SMTP）

## 快速开始

### 1. 进入项目目录

```bash
cd web
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入你的密钥：

```bash
copy .env.example .env
```

| 变量 | 说明 | 必填 |
|------|------|------|
| `STRIPE_SECRET_KEY` | Stripe 测试密钥 | 用 Stripe 时必填 |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal 沙盒 Client ID | 用 PayPal 时必填 |
| `NEXT_PUBLIC_APP_URL` | 网站地址 | 本地默认即可 |
| `ADMIN_PASSWORD` | 后台登录密码 | 建议修改，默认 `admin123` |
| `CLOUDINARY_*` | 图片云存储（**Vercel 必填**） | 上线必填 |
| `SMTP_*` | 发货通知邮件 | 可选 |

**获取 Stripe 测试密钥：** https://dashboard.stripe.com/test/apikeys  
**获取 PayPal 沙盒密钥：** https://developer.paypal.com → Apps & Credentials → Sandbox

### 3. 初始化数据库并填入示例商品

```bash
npx prisma db push
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

浏览器打开 http://localhost:3000

## 后台管理

地址：**http://localhost:3000/admin**

| 功能 | 说明 |
|------|------|
| 商品列表 | 查看所有商品、库存、是否精选 |
| 新增 / 编辑 | 中英文名称、描述、规格、亮点、**本地上传图片** |
| 删除 | 点击删除并确认 |
| **订单管理** | 查看订单、导出 Excel、更新状态、自动发发货邮件 |

默认密码：`admin123`（请在 `.env` 中设置 `ADMIN_PASSWORD` 修改）

**图片上传**：
- 本地开发：保存到 `public/uploads/`
- **Vercel 上线**：必须配置 Cloudinary（见下方部署说明）

**详细描述**：支持 Markdown，可点击「上传并插入图片」，语法 `![](url)`

规格填写格式：每行 `参数名 | 参数值`  
亮点填写格式：每行一条  
图库：可本地上传或每行一个 URL

## 用户账户（前台）

| 页面 | 地址 | 说明 |
|------|------|------|
| 注册 | `/register` | 创建账户 |
| 登录 | `/login` | 登录后查看订单、收藏 |
| 我的订单 | `/account/orders` | 历史订单列表 |
| 订单详情 | `/account/orders/[id]` | 查看明细、**再次购买** |
| 收藏夹 | `/account/wishlist` | 心愿单管理 |

商品详情页支持 **收藏** 和 **星级评价**（登录后可写评论）。结账时若已登录，订单会自动关联账户。

> 也可接入 Judge.me 等第三方评价插件；当前为内置轻量评价系统，无需额外费用。

## 常用命令

| 命令 | 作用 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run build` | 构建生产版本 |
| `npm run db:seed` | 重新填入示例商品 |
| `npm run db:studio` | 可视化编辑数据库（商品、订单） |

## 项目结构

```
web/
├── prisma/           # 数据库模型与示例数据
├── src/
│   ├── app/          # 页面（前台 + /admin 后台）
│   ├── components/   # UI 组件（含 admin/）
│   ├── lib/          # 工具（数据库、Stripe）
│   └── store/        # 购物车状态
└── .env              # 密钥配置（不要提交到 Git）
```

## 如何让 AI 帮你改

你可以直接对我说，例如：

- 「把店铺名改成 XXX」
- 「加 10 个新商品，品类是宠物用品」
- 「首页改成大图 Banner 风格」
- 「给后台加订单管理」
- 「部署到 Vercel」

## 部署（上线）

推荐 **Vercel**（免费、简单）：

1. 把代码推到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入项目，根目录选 `web`
3. 在 Vercel 环境变量里填入 `.env` 中的密钥
4. 生产环境把 Stripe / PayPal 换成正式密钥

### Vercel 图片存储（重要）

Vercel 的文件系统是临时的，**本地上传的图片重启后会丢失**。上线前请配置 **Cloudinary**：

1. 免费注册 [cloudinary.com](https://cloudinary.com)
2. Dashboard 获取 `Cloud Name`、`API Key`、`API Secret`
3. 填入 Vercel 环境变量：
   ```
   CLOUDINARY_CLOUD_NAME=xxx
   CLOUDINARY_API_KEY=xxx
   CLOUDINARY_API_SECRET=xxx
   ```
4. 配置后，后台上传的图片会自动存到 Cloudinary CDN

本地开发不配 Cloudinary 也可以，图片会存在 `public/uploads/`。

### 发货通知邮件

在 `.env` 配置 SMTP 后：
- **下单成功**：自动发送订单确认邮件（含商品明细与收货地址）
- **已发货**：后台将订单状态改为「**已发货**」时自动发邮件

常用 SMTP 示例：
- **Gmail**：`SMTP_HOST=smtp.gmail.com`，`SMTP_PORT=587`，使用 [应用专用密码](https://myaccount.google.com/apppasswords)
- **SendGrid / Resend**：按服务商文档填写

### 订单导出

后台「订单管理」页点击 **导出 Excel**，下载 `.xlsx` 文件。

## 测试支付

**Stripe 测试卡号：** `4242 4242 4242 4242`，任意未来日期和 CVC  
**PayPal：** 使用 PayPal Developer 沙盒测试账户
