# 部署上线手册（Vercel + Cloudinary + PostgreSQL）

> **写给第一次成功上线的自己**——按本文重做一遍即可再次部署，不必靠记忆。  
> 首次成功日期：2026-08-25  
> 线上站点：https://luminatech-store2.vercel.app  
> 代码仓库：https://github.com/517002650/luminatech-store  

相关文档：

- 日常运营：[TECHNICAL.md](./TECHNICAL.md)
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
| 线上域名 | https://luminatech-store2.vercel.app |
| 后台 | https://luminatech-store2.vercel.app/admin |
| 本地代码目录 | `e:\项目\独立站\web` |
| 数据库 | Neon PostgreSQL（`DATABASE_URL`） |
| 图片 | Cloudinary（三个 `CLOUDINARY_*`） |
| 后台默认密码 | `admin123`（**目前仍在使用默认，见下方「修改管理员密码」**） |

> 若以后换了域名 / 项目名，只改本表和 [TECHNICAL.md](./TECHNICAL.md) 第 2 节即可。

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
| `ADMIN_PASSWORD` | 后台密码（可先 `admin123`，事后改） |
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
prisma generate && prisma db push && npm run db:seed && next build
```

含义：

1. **generate** — 生成数据库客户端  
2. **db push** — 在 Neon 上自动建表  
3. **db:seed** — 若商品表为空，导入 6 个示例商品；**已有商品则跳过**（不会覆盖你后台改的数据）  
4. **next build** — 编译网站  

所以：**第一次部署成功后，一般不用再手动跑 seed**（只要 Build 日志里没有报错）。

---

### 步骤 F — 部署后验收清单

打开线上地址，逐项打勾：

- [ ] https://xxx.vercel.app/zh 能打开，有商品  
- [ ] /zh/products 商品列表正常  
- [ ] /admin 能登录（密码 = `ADMIN_PASSWORD`）  
- [ ] 后台能看到商品列表  
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

改环境变量后必须 **Redeploy** 才生效。

---

## 4.1 修改管理员密码（当前仍是默认 `admin123`）

后台密码**不是**在网站设置页里改的，而是改 Vercel 里的环境变量 `ADMIN_PASSWORD`。

### 当前状态

| 项目 | 值 |
|------|-----|
| 登录地址 | https://luminatech-store2.vercel.app/admin |
| 当前密码 | `admin123`（代码默认；若 Vercel 已设 `ADMIN_PASSWORD` 则以环境变量为准） |
| 建议 | 正式给人用之前尽快改成强密码 |

### 线上修改步骤（推荐）

1. 打开 https://vercel.com/dashboard → 进入项目 **`luminatech-store2`**
2. 点 **Settings** → **Environment Variables**
3. 找到 **`ADMIN_PASSWORD`**：
   - **已有该变量**：点右侧编辑（Edit / 铅笔），把 Value 改成新密码，保存
   - **没有该变量**：点 Add，Key 填 `ADMIN_PASSWORD`，Value 填新密码，Environment 勾选 Production（以及 Preview 可选）
4. 回到 **Deployments** → 最新一次右侧 `⋯` → **Redeploy**（必须重新部署，只改变量不生效）
5. 等待 Deploy 变成 **Ready**
6. 打开 https://luminatech-store2.vercel.app/admin ，用**新密码**登录
7. 旧密码 `admin123` 将失效

### 密码建议

- 至少 8 位，含字母 + 数字（可再加符号）
- 不要用生日、店铺名、`123456` 等
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

- [ ] Vercel 中 `ADMIN_PASSWORD` 已不是 `admin123`
- [ ] 已 Redeploy 成功
- [ ] 用新密码能进后台
- [ ] 用 `admin123` 无法登录
- [ ] 本文档第 1 节「后台默认密码」备注已改为「已修改」（可选）

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

3. Vercel 自动重新部署  
4. 打开线上网站验证  

不需要重新创建 Neon / Cloudinary，环境变量一般也不用重填。

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
| 改了环境变量网站没变 | 需要 Redeploy |

---

## 7. 换电脑 / 重装后如何恢复部署能力

1. 安装 Git、Node.js  
2. `git clone https://github.com/517002650/luminatech-store.git`  
3. 复制 `.env.example` → `.env`，填 Neon / Cloudinary（可与线上相同库，注意别误删生产数据）  
4. `npm install` → `npm run dev`  
5. 推送仍用临时 Classic Token  

Vercel / Neon / Cloudinary **账号里的配置还在**，不用重做，除非主动删除项目。

---

## 7.1 数据库备份与同步本地

备份文件在 `web/backups/`（已 gitignore，含订单/邮箱，勿上传仓库）。

```powershell
cd "e:\项目\独立站\web"

# A) 只备份当前 .env 指向的库（本地 SQLite）
npm run db:backup

# B) 备份线上 Neon（不改 .env）
$env:BACKUP_DATABASE_URL="postgresql://...@ep-xxxx.neon.tech/neondb?sslmode=require"
npm run db:backup

# C) 一键：Neon → 本地 prisma/dev.db（覆盖本地数据）
$env:BACKUP_DATABASE_URL="postgresql://...@ep-xxxx.neon.tech/neondb?sslmode=require"
npm run db:sync:local

# D) 从某份 JSON 恢复到指定库（需 --yes）
$env:RESTORE_DATABASE_URL="file:./prisma/dev.db"
npm run db:restore -- backups/latest.json --yes
```

建议：每周执行一次 `db:backup`（对 Neon），并把 `backups\db-*.json` 拷到网盘。

---

## 8. 绑定自定义域名（以后可选）

1. Vercel → 项目 → **Settings** → **Domains** → 添加域名  
2. 按提示改 DNS  
3. 把 `NEXT_PUBLIC_APP_URL` 改成 `https://你的域名`  
4. Redeploy  
5. Stripe/PayPal 回调域名一并更新  

---

## 9. 回滚 / 紧急恢复

| 情况 | 做法 |
|------|------|
| 新版本坏了 | Vercel → Deployments → 选上一个成功版本 → **Promote to Production** |
| 数据库误删表 | 再部署一次（会 `db push`）；商品需重新 seed 或后台录入 |
| 忘记后台密码 | 见 **§4.1**：Vercel 改 `ADMIN_PASSWORD` → Redeploy |

---

## 10. 检查清单（打印或收藏）

### 首次部署

- [ ] GitHub 仓库已有 `main` 代码  
- [ ] Neon Connection string 已复制  
- [ ] Cloudinary 三个值已复制  
- [ ] Vercel 环境变量 7 个必填项已填  
- [ ] Deploy 成功（Build 无红色报错）  
- [ ] `/zh` 有商品、`/admin` 能进商品列表  
- [ ] GitHub Token 已删除  
- [ ] **已把默认 `admin123` 改成强密码**（见 §4.1）并 Redeploy 验证 

### 每次更新

- [ ] 本地改完已 commit  
- [ ] `git push origin main` 成功  
- [ ] Vercel 新 Deployment 显示 Ready  
- [ ] 打开线上点验关键页面  

---

## 11. 文档索引

| 文档 | 何时看 |
|------|--------|
| **本文 `docs/DEPLOYMENT.md`** | 部署 / 重部署 / 忘记上线步骤时 |
| `docs/TECHNICAL.md` | 日常改商品、订单、排错 |
| `DEPLOY.md` | 补充说明与安全提醒 |
| `README.md` | 功能介绍与本地启动 |
| `.env.example` | 环境变量名模板 |

---

**维护约定**：若更换 Vercel 项目名、域名或数据库提供商，请同步更新本文第 1 节「真实配置」表。
