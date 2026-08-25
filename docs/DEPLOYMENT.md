# 部署上线手册（Vercel + Cloudinary + PostgreSQL）

> **写给第一次成功上线的自己**——按本文重做一遍即可再次部署，不必靠记忆。  
> 首次成功日期：2026-08-25  
> 线上站点：https://517002650-luminatech-store.vercel.app  
> 代码仓库：https://github.com/517002650/luminatech-store  

相关文档：

- 日常运营：[TECHNICAL.md](./TECHNICAL.md)
- **品牌与域名（首选 Stagevio）：** [BRAND.md](./BRAND.md)
- **大陆访问 / 香港反向代理（宝塔）：** [HK-REVERSE-PROXY.md](./HK-REVERSE-PROXY.md)
- 首次部署草稿（较简）：[../DEPLOY.md](../DEPLOY.md)

---

## 0. 一句话架构

```
用户浏览器
    ↓
Vercel（Next.js 网站）
    ↓
├── Neon PostgreSQL（商品、订单、用户、评价）
├── Cloudinary（商品图片 CDN）
├── Stripe / PayPal（收款，可选）
└── SMTP 邮箱（确认/发货邮件，可选）
```

| 层级 | 用什么 | 为什么 |
|------|--------|--------|
| 网站托管 | **Vercel** | 免费、自动部署 GitHub |
| 数据库 | **Neon PostgreSQL** | Vercel 不能用本地 SQLite 文件 |
| 图片 | **Cloudinary** | Vercel 文件系统临时，图片会丢 |
| 代码 | **GitHub** | Vercel 从仓库拉取构建 |

---

## 1. 你第一次成功时的真实配置（备忘）

| 项目 | 值 |
|------|-----|
| GitHub 用户 | `517002650` |
| 仓库名 | `luminatech-store` |
| 仓库地址 | https://github.com/517002650/luminatech-store |
| Vercel 项目名 | `luminatech-store2` |
| 线上域名（当前） | https://517002650-luminatech-store.vercel.app |
| **目标品牌 / 主域** | **Stagevio** / `stagevio.com`（见 [BRAND.md](./BRAND.md)；备选 Plotnova、Voxrig） |
| 后台 | https://517002650-luminatech-store.vercel.app/admin |
| Vercel 团队 / 项目 | `dashan4` / `517002650-luminatech-store` |
| **环境变量直达** | https://vercel.com/dashan4/517002650-luminatech-store/settings/environment-variables |
| 本地代码目录 | `e:\项目\独立站\web` |
| 数据库 | Neon PostgreSQL（`DATABASE_URL`） |
| 图片 | Cloudinary（三个 `CLOUDINARY_*`） |
| 后台密码 | Vercel 环境变量 `ADMIN_PASSWORD`（线上须 ≥12 位；禁止 `admin123`，见 §4.1） |

> 若以后换了域名 / 项目名 / 品牌，改本表、[TECHNICAL.md](./TECHNICAL.md) 第 1–2 节，并同步 [BRAND.md](./BRAND.md)。

---

## 2. 账号清单（部署前准备）

按顺序注册/登录（都有免费档）：

| 顺序 | 服务 | 用途 | 注册地址 |
|------|------|------|----------|
| 1 | GitHub | 存代码 | https://github.com |
| 2 | Neon | PostgreSQL 数据库 | https://neon.tech |
| 3 | Cloudinary | 图片上传 | https://cloudinary.com |
| 4 | Vercel | 网站托管 | https://vercel.com （用 GitHub 登录最方便） |
| 5 | Stripe（可选） | 信用卡收款 | https://dashboard.stripe.com |
| 6 | 邮箱 SMTP（可选） | 订单邮件 | Gmail / Resend / SendGrid |

---

## 3. 第一次部署完整步骤（可照做）

### 步骤 A — 代码进 GitHub

1. 本地项目在 `web/` 目录，已是 Git 仓库，分支 `main`
2. GitHub 新建仓库（不要勾选 README）
3. 需要推送时，创建 **Classic Token**：
   - https://github.com/settings/tokens
   - **Generate new token (classic)**
   - 勾选 **`repo`**
   - 复制 `ghp_...`（用完立刻删除）
4. 推送示例：

```powershell
cd "e:\项目\独立站\web"
& "C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/你的用户名/luminatech-store.git
& "C:\Program Files\Git\bin\git.exe" push -u origin main
```

提示输入密码时：**粘贴 Token**，不是 GitHub 登录密码。

> **安全**：Token / 密码不要发到聊天记录。用完到 tokens 页面删除。

---

### 步骤 B — 创建 Neon 数据库（PostgreSQL）

1. 登录 https://console.neon.tech → 新建 Project  
2. 打开 **Connection Details**  
3. 选择：
   - 驱动：**PostgreSQL**
   - 连接：**Pooled connection**（Vercel 推荐）
4. 复制整行 **Connection string**，形如：

```text
postgresql://用户名:密码@ep-xxxx-pooler.区域.aws.neon.tech/neondb?sslmode=require
```

要点：

- 必须带 `?sslmode=require`
- **不能**再用本地的 `file:./dev.db`（那是 SQLite，线上不可用）

---

### 步骤 C — 获取 Cloudinary 三个值

1. 登录 https://console.cloudinary.com  
2. Dashboard → **Product environment credentials**  
3. 复制：

| Cloudinary 页面上的名字 | 填到 Vercel 的变量名 |
|-------------------------|----------------------|
| Cloud name | `CLOUDINARY_CLOUD_NAME` |
| API Key | `CLOUDINARY_API_KEY` |
| API Secret | `CLOUDINARY_API_SECRET` |

---

### 步骤 D — Vercel 导入项目并填环境变量

1. 打开 https://vercel.com → **Add New Project**  
2. 导入 GitHub 仓库 `luminatech-store`  
3. 设置：
   - Framework：Next.js  
   - Root Directory：`./`（仓库根就是 `web` 内容时）  
4. 展开 **Environment Variables**，按下面表格一组组填（Key / Value），每组点 **Add More**

#### 必填变量

| Key | Value 填什么 |
|-----|----------------|
| `DATABASE_URL` | Neon 整行 Connection string |
| `NEXT_PUBLIC_APP_URL` | `https://你的项目名.vercel.app`（部署后可再改） |
| `ADMIN_PASSWORD` | 首次创建 Owner 的安装口令（**线上至少 12 位**，不要用 `admin123`） |
| `ADMIN_SECRET` | 推荐：后台会话签名（≥16 位随机串） |
| `USER_SESSION_SECRET` | 自己编一长串，如 `luminatech-session-secret-2026` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret |

#### 可选变量

| Key | 何时需要 |
|-----|----------|
| `STRIPE_SECRET_KEY` | 要测/收信用卡款 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 同上 |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | 要 PayPal |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | 要发邮件 |
| `STORE_NAME` / `CONTACT_EMAIL` | 邮件签名、联系页 |

5. 点 **Deploy**，等待构建完成（约 1–3 分钟）

---

### 步骤 E — 构建时自动做了什么（重要）

当前项目构建命令（见 `package.json` / `vercel.json`）：

```text
prisma generate && prisma db push --accept-data-loss && npm run db:seed && next build
```

含义：

1. **generate** — 生成数据库客户端  
2. **db push** — 在 Neon 上自动建表（含 `ProductVariant` 多规格表）  
3. **db:seed** — 若商品表为空，导入示例商品；**已有商品则跳过创建**；并为尚无规格的老商品**补 1 个默认规格**  
4. **next build** — 编译网站  

所以：**第一次部署成功后，一般不用再手动跑 seed**（只要 Build 日志里没有报错）。  

多规格部署后：请到后台编辑商品 → **规格与价格**，为需要分档销售的商品添加多个规格（独立售价与库存）。仅 1 个规格时前台不显示选择器。

---

### 步骤 F — 部署后验收清单

打开线上地址，逐项打勾：

- [ ] https://xxx.vercel.app/zh 能打开，有商品  
- [ ] /zh/products 商品列表正常  
- [ ] /admin 能登录（密码 = `ADMIN_PASSWORD`）  
- [ ] 后台能看到商品列表  
- [ ] 后台编辑商品可见「规格与价格」，可添加第二规格并保存  
- [ ] 前台详情（≥2 规格时）出现「选择规格」，价格随选项变化  
- [ ] 后台可新增推广员，复制 `?ref=` 链接；付款后「推广提成」出现待结算记录  
- [ ] 后台上传一张图，地址应含 `res.cloudinary.com`  
- [ ] （可选）注册用户、加购、结算页能打开  

若 `/zh` 或后台登录后 500：多半是 `DATABASE_URL` 错了，或构建时 `db push` 失败——去 Vercel **Deployments → Logs** 查看。

---

## 4. 环境变量对照速查（防忘）

| 你手里拿到的东西 | Vercel Key |
|------------------|------------|
| Neon Connection string | `DATABASE_URL` |
| Cloudinary Cloud name | `CLOUDINARY_CLOUD_NAME` |
| Cloudinary API Key | `CLOUDINARY_API_KEY` |
| Cloudinary API Secret | `CLOUDINARY_API_SECRET` |
| 自己设的后台密码 | `ADMIN_PASSWORD` |
| 自己编的随机串 | `USER_SESSION_SECRET` |
| 网站完整 URL | `NEXT_PUBLIC_APP_URL` |
| 香港 IP 后台（临时） | `SERVER_ACTIONS_ALLOWED_ORIGINS`、`ADMIN_COOKIE_SECURE` — 见 [HK-REVERSE-PROXY.md §12](./HK-REVERSE-PROXY.md) |

改环境变量后必须 **Redeploy** 才生效。

---

## 4.0 如何进入后台

| 环境 | 地址 | 密码 |
|------|------|------|
| 线上（VPN / 海外） | https://517002650-luminatech-store.vercel.app/admin | 管理员邮箱 + 密码 |
| 线上（大陆经香港 IP） | http://150.109.71.243/admin | 同上；须先配 [HK-REVERSE-PROXY.md §12](./HK-REVERSE-PROXY.md) 环境变量并 Redeploy |
| 本地 | http://localhost:3000/admin | `.env` 的 `ADMIN_PASSWORD`；未设时临时可用 `admin123` |

登录后左侧有：商品列表、新增商品、分类、订单、退货、评价、**用户管理**、留言、优惠码、**推广员**、**推广提成**、运费、媒体清理、备份。

商品 **上架/下架**：商品列表点「下架/上架」，或编辑页勾选「上架销售」。下架商品前台不可见。

商品 **多规格**：编辑页「规格与价格」可为同一商品设置多档 SKU / 价格 / 库存。操作细节见 [TECHNICAL.md §5.1](./TECHNICAL.md)。

**链接 / 优惠券推广提成**：后台创建推广员；可用 `?ref=` 链接，或给优惠码**绑定推广员**。详见 [TECHNICAL.md §5.6](./TECHNICAL.md)。

日常操作细节见 [TECHNICAL.md §2.1 / §5](./TECHNICAL.md)。

---

## 4.1 修改管理员密码

后台密码**不是**在网站设置页里改的，而是改 Vercel 里的环境变量 `ADMIN_PASSWORD`。

### 当前规则

| 项目 | 值 |
|------|-----|
| 登录地址 | https://517002650-luminatech-store.vercel.app/admin |
| 密码来源 | Vercel → `ADMIN_PASSWORD` |
| 线上要求 | ≥12 位；禁止 `admin123`、`password`、`123456` 等弱口令 |
| 未配置后果 | 登录页提示配置错误，**无法登录**（生产已禁用默认口令） |

### 线上修改步骤（推荐）

> **找不到 Environment Variables？** 必须先点进**具体项目**，不要停在团队首页或账号总设置。  
> **本项目直达链接（登录 Vercel 后打开）：**  
> https://vercel.com/dashan4/517002650-luminatech-store/settings/environment-variables

1. 打开上面的直达链接；或打开 https://vercel.com/dashboard 后点进项目 `517002650-luminatech-store`  
2. 看**左侧边栏**（不是顶部账号菜单）：
   - 新版界面：左侧直接有 **Environment Variables**（环境变量）→ 点它  
   - 旧版界面：先点 **Settings（设置）**，再在设置左侧点 **Environment Variables**
3. 找到 **`ADMIN_PASSWORD`**：
   - **已有该变量**：右侧 `⋯` → Edit，改 Value，保存
   - **没有该变量**：点 **Add** / **Create**，Key 填 `ADMIN_PASSWORD`，Value 填新密码（≥12 位），勾选 **Production**（建议也勾 Preview），保存
4. 回到左侧 **Deployments** → 最新一次右侧 `⋯` → **Redeploy**（必须；只改变量不生效）
5. 等待 Deploy 变成 **Ready**
6. 打开 https://517002650-luminatech-store.vercel.app/admin ，用**新密码**登录
7. 旧密码将失效

**仍找不到时的对照：**

| 你现在在哪 | 对不对 |
|------------|--------|
| 直达链接 `/settings/environment-variables` | ✅ 正确页 |
| 仪表盘项目列表（还没点进项目） | ❌ 先点项目卡片 |
| 项目打开后左侧有 Overview / Deployments / Settings | ✅ 再找 Environment Variables 或 Settings |
| `/settings/deployment-protection`（部署保护） | ❌ 错页；请改用环境变量直达链接 |
| 左上角头像 → Account Settings | ❌ 那是账号设置，没有项目环境变量 |
| 团队 Settings → Environment Variables | ⚠️ 那是团队级；本站密码应配在**项目**里 |

### 密码建议

- 至少 **12** 位，含字母 + 数字（可再加符号）
- 不要用生日、店铺名、`admin123`、`123456` 等
- 新密码记在密码管理器或安全备忘录，**不要发到聊天**

### 本地开发一并修改（可选）

若本机也跑 `npm run dev`，编辑 `web/.env`：

```env
ADMIN_PASSWORD=你的新密码
```

保存后重启 `npm run dev`。`.env` 不要提交到 GitHub。

### 忘记新密码怎么办

1. 再进入 Vercel → Environment Variables → 把 `ADMIN_PASSWORD` 改成你记得住的新值  
2. **Redeploy**  
3. 用刚设的值登录  

无需改代码、无需动数据库。

### 改完后自检

- [ ] Vercel 中 `ADMIN_PASSWORD` 已不是弱口令且 ≥12 位
- [ ] 已 Redeploy 成功
- [ ] 用新密码能进后台
- [ ] 用 `admin123` 无法登录
- [ ] 本文档第 1 节密码备注已与现状一致（可选）

---

## 5. 以后如何更新网站（第二次及以后）

1. 本地改代码（或让 AI 改）  
2. 提交并推送：

```powershell
cd "e:\项目\独立站\web"
& "C:\Program Files\Git\bin\git.exe" add .
& "C:\Program Files\Git\bin\git.exe" -c user.name="Lichanghe" -c user.email="517002650@qq.com" commit -m "说明改了什么"
& "C:\Program Files\Git\bin\git.exe" push origin main
```

3. **触发生产重新部署**（见下方 §5.1；仅改文档/规则可不部署）  
4. 打开线上网站验证关键页面  

不需要重新创建 Neon / Cloudinary，环境变量一般也不用重填。

### 5.1 如何触发重新部署（生产生效）

线上站点只跑 **Vercel Production** 上的构建产物。`git push` 有时不会自动部署（Hobby 账号、作者邮箱、Webhook 等），**功能改动要上线时请主动触发部署**，不要假设 push 一定生效。

| 方式 | 命令 / 操作 | 何时用 |
|------|-------------|--------|
| **推荐：CLI 生产部署** | 见下方 PowerShell | 功能已 commit，要立刻上线；或 push 后线上仍是旧版 |
| Dashboard Redeploy | [Deployments](https://vercel.com/dashan4/517002650-luminatech-store) → 选一次 → **Redeploy**（改 env 后勾选 Clear Cache 更稳） | 只改了环境变量、或 CLI 不便时 |
| 仅靠 `git push` | `git push origin main` | 可能自动部署，**不可依赖**；上线后务必用 §5.2 验收 |

**CLI 一键生产部署（本机已 `npx vercel login` 过）：**

```powershell
cd "e:\项目\独立站\web"
npx vercel --prod --yes
```

成功标志：输出含 `Aliased` 与生产域名 `https://517002650-luminatech-store.vercel.app`，`status: ok`。  
构建日志 / 详情：https://vercel.com/dashan4/517002650-luminatech-store  

**改环境变量后**：在 Vercel Environment Variables 保存后，必须再 **Redeploy** 或再跑一次 `npx vercel --prod --yes`，否则线上仍用旧 env。

**Redeploy 入口（Deployments）：**  
https://vercel.com/dashan4/517002650-luminatech-store/deployments  
→ 最新一条右侧 **⋯** → **Redeploy** → 确认。

**常见部署失败：**

| 报错 | 含义 | 处理 |
|------|------|------|
| `Edge Function "_middleware" size ... limit is 1 MB` | middleware 打进了 Prisma 等重依赖 | middleware 只引用 Edge 安全小模块（如 `affiliate-cookie.ts`），禁止从含 `@prisma/client` 的文件再导出进 middleware |
| `prisma db push` / DB 连接失败 | `DATABASE_URL` 无效或 Neon 休眠/限额 | 查 Vercel env 与 Neon 控制台 |
| `Use the --accept-data-loss flag`（见下方 §5.1.1） | 构建跑的 `db push` **没有** `--accept-data-loss` | 按 §5.1.1 修复后 Redeploy |
| Build 成功但线上路由 404 | 当前 Production 仍是旧 Deployment | 再跑 CLI 部署，或 Dashboard 把最新 Ready **Promote to Production** |

#### 5.1.1 踩坑：`prisma db push` 要求 `--accept-data-loss`（已踩过，2026-08）

**典型日志：**

```text
Error: Use the --accept-data-loss flag to ignore the data loss warnings
  like prisma db push --accept-data-loss
Error: Command "prisma generate && prisma db push && npm run db:seed && next build" exited with 1
```

注意失败命令里是 `prisma db push`（**没有** `--accept-data-loss`）。  
仓库正确命令应是：

```text
prisma generate && prisma db push --accept-data-loss && npm run db:seed && next build
```

（已写在 `package.json` 的 `scripts.build` 与 `vercel.json` 的 `buildCommand`。）

**为何会跑错命令？**

| 情况 | 说明 |
|------|------|
| Build Command **Override 开着** 且填了旧命令 | 控制台覆盖仓库，最常见原因 |
| Override **关着**（推荐） | 应走 `npm run build` → 用仓库带 flag 的命令；若仍失败，确认最新 commit 已含正确 `package.json` |

**正确界面路径（不在 General）：**

1. 打开 [Build and Deployment](https://vercel.com/dashan4/517002650-luminatech-store/settings/build-and-deployment)  
   （Settings → 左侧 **Build and Deployment**，不是 General）  
2. 找到 **Framework Settings → Build Command**  
3. 看右侧 **Override**：  
   - **关（默认，推荐）**：灰色开关在左。此时用仓库命令，**不用手填**。  
   - **开**：必须把完整命令改成带 `--accept-data-loss` 的那一行，再 Save。  
4. 去 [Deployments](https://vercel.com/dashan4/517002650-luminatech-store/deployments) → 最新一条 **⋯** → **Redeploy**  
5. 新构建日志中应出现：`prisma db push --accept-data-loss`，最后 `status: Ready`

**若加了 flag 仍失败（唯一约束冲突）：**

可能是 `Affiliate.userId` 等字段有重复数据。到 Neon SQL 检查：

```sql
SELECT "userId", COUNT(*)
FROM "Affiliate"
WHERE "userId" IS NOT NULL
GROUP BY "userId"
HAVING COUNT(*) > 1;
```

有重复则先清理多余行，再 Redeploy。

### 5.2 部署后快速验收

| 检查 | 期望 |
|------|------|
| `https://517002650-luminatech-store.vercel.app/zh` | 200 |
| 新后台路径（如 `/admin/affiliates`） | 未登录应为 **307→登录**，不是 **404** |
| Vercel Deployments 最新一条 | **Ready** 且已挂到 Production 别名 |

---

## 6. 第一次踩过的坑（务必记住）

| 坑 | 正确做法 |
|----|----------|
| 把 GitHub **登录密码**当 Token 用 | GitHub 推送只用 **PAT（ghp_...）**，勾选 `repo` |
| 细粒度 Token 没写权限 | 用 Classic Token，或给 Contents: Read and write |
| 线上仍用 `DATABASE_URL=file:./dev.db` | 必须换成 Neon 的 `postgresql://...?sslmode=require` |
| 只部署代码、不建表 | 靠构建里的 `prisma db push`；失败则检查 `DATABASE_URL` |
| 前台 500、后台登录页却正常 | 登录页不查库；进后台/首页才查库 → 就是数据库问题 |
| Vercel 上本地上传图片 | 必须配 Cloudinary |
| Token 发到聊天 | 用完立刻在 GitHub Settings → Tokens 删除 |
| 改了环境变量网站没变 | 需要 Redeploy：https://vercel.com/dashan4/517002650-luminatech-store/deployments |
| `Use the --accept-data-loss flag` 构建失败 | 见 **§5.1.1**：Build Command 在 **Build and Deployment**（不在 General）；Override 建议关；Redeploy |
| 买家/后台下载报 `download_failed` | 见 **§7.2**；多数是 Cloudinary 密钥或 zip 签名方式问题 |
| 直接打开 `res.cloudinary.com/...zip` 链接 | 会 401；必须走网站内「下载」按钮（`/api/downloads/...`） |
| 本地备份同步后固件仍下不了 | 检查附件 URL 是否是 `/downloads/...` 本地路径，线上需重新上传到 Cloudinary |
| 用 `.env.example` 占位符填了 Cloudinary | Vercel 三个 `CLOUDINARY_*` 必须是控制台里的**真实值**，且与文件所在 cloud name 一致 |

---

## 7. 换电脑 / 重装后如何恢复部署能力

1. 安装 Git、Node.js  
2. `git clone https://github.com/517002650/luminatech-store.git`  
3. 复制 `.env.example` → `.env`，填 Neon / Cloudinary（可与线上相同库，注意别误删生产数据）  
4. `npm install` → `npm run dev`  
5. 推送仍用临时 Classic Token  

Vercel / Neon / Cloudinary **账号里的配置还在**，不用重做，除非主动删除项目。

---

## 7.1 数据库备份（推荐：不用命令）

### 方式 B — 后台一键下载 / 上传同步（最省事）

1. 打开后台：`/admin` → 左侧或顶部点 **数据备份**  
2. **下载数据库备份** → 存到电脑  
3. 要把**本地商品同步到线上**：  
   - 本机 `/admin/backup` 先下载  
   - 再到**线上** `/admin/backup` → **上传同步** → 选「只同步商品/分类」  

手机端顶部也会显示「数据备份」快捷入口。

### 方式 A — Neon 云端快照（防误删）

1. 打开 [https://console.neon.tech](https://console.neon.tech) 登录  
2. 进入商店用的那个项目  
3. 左侧点 **Branches**  
4. 点 **Create branch**，名称例如 `backup-2026-08-25`  
5. 创建成功 = 留了一份当时数据；出事可在 Branches 里对照/恢复  

免费版保留时间有限，**重要节点请同时做方式 B**。

### 进阶（开发者命令，可忽略）

备份文件也可通过脚本导出到 `web/backups/`（已 gitignore）：

```powershell
cd "e:\项目\独立站\web"
npm run db:backup
# 或同步 Neon → 本地：
$env:BACKUP_DATABASE_URL="postgresql://...@neon.tech/neondb?sslmode=require"
npm run db:sync:local
```

---

## 7.2 固件/文件下载失败（`download_failed`）快速修复

> **首次踩坑日期：** 2026-08-25  
> **相关代码：** `src/lib/asset-delivery.ts`、`/api/downloads/[id]`、`/api/admin/asset`  
> **线上自检接口（需先登录后台）：** `/api/admin/cloudinary-health`

### 现象

| 表现 | 说明 |
|------|------|
| 买家点「下载」返回 `{"error":"download_failed"}` | 服务端取 Cloudinary 文件失败 |
| 后台商品附件点「文件」同样失败 | 同上 |
| 浏览器直接打开 `https://res.cloudinary.com/.../xxx.zip` | 常见 **401**，属正常（zip 不能公开直链） |
| Vercel Runtime Logs 出现 `cloudinary_fetch_failed` | 密钥或签名 URL 有问题 |

### 根因（按出现频率）

1. **Vercel 上 Cloudinary 环境变量无效**  
   - 仍使用 `.env.example` 占位符（如 `your_cloud_name`）→ API 返回 `unknown api_key`  
   - `CLOUDINARY_CLOUD_NAME` 与数据库里 `fileUrl` 的 cloud name **不一致**（例如文件在 `tvv56z0q`，Vercel 配了别的账号）

2. **不能用 Cloudinary 直链下载 zip**  
   - 固件/zip 属于 **raw** 资源，需服务端用 API Secret 生成**签名下载 URL**  
   - 网站已改为：用户点下载 → `/api/downloads/[id]` → 服务端代理取文件（见 `asset-delivery.ts`）

3. **raw 文件的 public_id 含扩展名**  
   - 例如 `luminatech/downloads/1787619246345-7e9700a8-_.zip`  
   - 若错误地把 `.zip` 拆成 format，签名 URL 会 **404**  
   - 当前修复：使用 `cloudinary.utils.private_download_url(publicId, "", {...})`（format 传空字符串）

4. **附件仍是本地路径**  
   - 数据库里 `fileUrl` 为 `/downloads/xxx.pkg` 时，**只在本地开发有效**  
   - Vercel 无持久磁盘，线上必须在后台**重新上传**附件（会存到 Cloudinary）

5. **清空买家账号不能修复下载**  
   - 下载失败与订单/用户无关，不要指望清空账号解决

### 5 分钟排查清单

```
□ 1. 登录后台 → 商品编辑 → 附件区域
     若出现黄色「Cloudinary 未正确配置」→ 先修环境变量

□ 2. 浏览器访问（已登录后台时）：
     https://你的域名/api/admin/cloudinary-health
     期望：{ "ok": true, "pingOk": true, "cloudMatch": true }

□ 3. Vercel → Settings → Environment Variables
     CLOUDINARY_CLOUD_NAME  = 控制台 Cloud name（与 fileUrl 里一致）
     CLOUDINARY_API_KEY     = 控制台 API Key
     CLOUDINARY_API_SECRET  = 控制台 API Secret
     Production + Preview 都要改 → Save → Redeploy

□ 4. 后台 → 商品编辑 → 附件 → 点「文件」测 Cloudinary 上的 zip
     不要复制 Cloudinary 链接到地址栏

□ 5. 买家端：登录 → 已付款订单 → 订单资料 → 下载
     （需有 paid/completed 订单；无订单则先下单测试）

□ 6. 若某附件 fileUrl 以 /downloads/ 开头 → 在线上后台重新上传该文件
```

### 本地验证命令（开发者可选）

在 `web/` 目录，临时注入与线上一致的三个 Cloudinary 变量后执行：

```powershell
cd "e:\项目\独立站\web"
$env:CLOUDINARY_CLOUD_NAME="你的cloud_name"
$env:CLOUDINARY_API_KEY="你的api_key"
$env:CLOUDINARY_API_SECRET="你的api_secret"
npx tsx scripts/verify-cloudinary.ts
```

期望输出：`ping { status: 'ok' }` 且 `download 200 application/zip ...`  
**不要把 Secret 提交到 Git 或发到公开聊天。**

### 修复记录（2026-08-25）

| 步骤 | 内容 |
|------|------|
| 环境变量 | Vercel 更新为 `tvv56z0q` 账号的真实 Key/Secret |
| 代码 | `asset-delivery.ts` 改用 `private_download_url`，raw zip 不拆分扩展名 |
| 部署 | `git push` 或 `npx vercel --prod --yes`，改 env 后必须 Redeploy |
| 验证 | `/api/admin/cloudinary-health` 全绿；Cloudinary zip 附件下载 200 |

### 仍失败时

1. Vercel → Deployments → 最新 Ready 版本 → **Runtime Logs**，搜索 `Download delivery failed`  
2. Cloudinary 控制台 → Media Library → `stagevio/downloads` 或历史 `luminatech/downloads` 确认文件还在  
3. 文件被删但数据库有记录 → 后台重新上传，或从备份 JSON「只同步商品/分类/附件」恢复  

---

## 8. 绑定自定义域名（Stagevio 目标域）

目标品牌见 [BRAND.md](./BRAND.md)：首选 **`stagevio.com`**（备选 `plotnova.com` / `voxrig.com`）。

> **未购买域名：跳过本节，勿改 `NEXT_PUBLIC_APP_URL`。**  
> 继续用 `https://517002650-luminatech-store.vercel.app`。买好并解析生效后再做下面步骤。

1. 在注册商购买并持有域名（先确认可注册）  
2. Vercel → 项目 → **Settings** → **Domains** → 添加域名（如 `stagevio.com`、`www.stagevio.com`）  
3. 按提示改 DNS（A / CNAME）  
4. 确认浏览器能打开新域名后，再把 `NEXT_PUBLIC_APP_URL` 改成 `https://stagevio.com`  
5. 将 `CONTACT_EMAIL` / `SMTP_FROM` 从 QQ（`517002650@qq.com`）改为 `@stagevio.com`（企业邮已开通时；见 BRAND.md §1.3）；`STORE_NAME=Stagevio` 可提前改  
6. Redeploy（`npx vercel --prod --yes` 或 Dashboard）  
7. Stripe / PayPal 回调 URL 与商户显示名一并更新  
8. 更新本文 §1 配置表与 [TECHNICAL.md](./TECHNICAL.md) 第 2 节网址  

---

## 9. 回滚 / 紧急恢复

| 情况 | 做法 |
|------|------|
| 新版本坏了 | Vercel → Deployments → 选上一个成功版本 → **Promote to Production** |
| 数据库误删表 | 再部署一次（会 `db push`）；商品需重新 seed 或后台录入 |
| 忘记后台密码 | 见 **§4.1**：Vercel 改 `ADMIN_PASSWORD` → Redeploy |
| 固件/文件下载失败 | 见 **§7.2**：修 Cloudinary 环境变量 → Redeploy；本地路径附件需重新上传 |

---

## 10. 检查清单（打印或收藏）

### 首次部署

- [ ] GitHub 仓库已有 `main` 代码  
- [ ] Neon Connection string 已复制  
- [ ] Cloudinary 三个值已复制  
- [ ] **Cloudinary 为真实密钥（非占位符）**，且 cloud name 与附件一致  
- [ ] 后台附件「文件」或 `/api/admin/cloudinary-health` 检测通过  
- [ ] Vercel 环境变量 7 个必填项已填  
- [ ] Deploy 成功（Build 无红色报错）  
- [ ] `/zh` 有商品、`/admin` 能进商品列表  
- [ ] GitHub Token 已删除  
- [ ] **已设置 ≥12 位强密码 `ADMIN_PASSWORD`**（见 §4.1）并 Redeploy 验证 

### 每次更新（功能需上线时）

- [ ] 本地改完已 commit  
- [ ] `git push origin main` 成功  
- [ ] 已触发重新部署：`npx vercel --prod --yes` 或 Dashboard Redeploy（见 §5.1）  
- [ ] Vercel 新 Deployment 显示 **Ready** 且已是 Production  
- [ ] 打开线上点验关键页面（新路由勿为 404）  

---

## 11. 文档索引

| 文档 | 何时看 |
|------|--------|
| **本文 `docs/DEPLOYMENT.md`** | 部署 / **§5.1 触发重新部署** / **§5.1.1 accept-data-loss 构建失败** / 忘记上线步骤时 |
| `docs/HK-REVERSE-PROXY.md` | **香港宝塔反向代理**：大陆访问 Vercel、403 排查、Nginx 配置、**§16 IP 后台 BUG 记录** |
| `docs/BRAND.md` | **品牌与域名**：首选 Stagevio，备选 Plotnova / Voxrig |
| `.cursor/rules/vercel-deploy.mdc` | AI：功能提交后必须生产部署的约定 |
| `docs/TECHNICAL.md` | 日常改商品、订单、排错 |
| `DEPLOY.md` | 补充说明与安全提醒 |
| `README.md` | 功能介绍与本地启动 |
| `.env.example` | 环境变量名模板 |

---

**维护约定**：若更换 Vercel 项目名、域名、数据库提供商或品牌（Stagevio ↔ 备选），请同步更新本文第 1 节「真实配置」表与 [BRAND.md](./BRAND.md)。
