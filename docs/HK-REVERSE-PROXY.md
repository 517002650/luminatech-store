# 香港服务器反向代理教程（宝塔 + Vercel）

> **写给未来的自己**——大陆无法直连 `*.vercel.app` 时，用香港 Lighthouse 做 Nginx 反向代理，让用户通过香港 IP / 域名访问 Vercel 上的 Stagevio 独立站。  
> 首次配置成功日期：2026-08-26  
> 相关文档：[DEPLOYMENT.md](./DEPLOYMENT.md) · [TECHNICAL.md](./TECHNICAL.md) · [BRAND.md](./BRAND.md)

---

## 0. 一句话架构

```
大陆用户浏览器
    ↓ 访问 http://香港IP/en  或  https://stagevio.com/en（买域名后）
香港 Lighthouse + 宝塔 Nginx（反向代理）
    ↓ 服务器代为请求 Vercel（Host 头必须是 vercel.app 域名）
Vercel（Next.js 网站，自动部署）
    ↓
Neon / Cloudinary / Stripe / PayPal
```

| 角色 | 做什么 | 不做什么 |
|------|--------|----------|
| **香港服务器** | Nginx 反向代理、将来挂域名 + SSL | 不跑 Next.js、不存数据库 |
| **Vercel** | 运行网站、GitHub 自动部署 | 大陆用户可能直连不了 `vercel.app` |
| **用户** | 访问香港 IP 或自有域名 | **不需要** 安装 VPN |

> **重要**：不能把 `517002650-luminatech-store.vercel.app` 的 DNS 指到香港 IP（该域名归 Vercel 管）。方向是 **香港入口 → 代理到 Vercel**，不是反过来。

---

## 1. 本项目的真实配置（备忘）

| 项目 | 值 |
|------|-----|
| 云厂商 | 腾讯云 **轻量应用服务器（Lighthouse）** |
| 地域 | 中国香港 |
| 公网 IP | `150.109.71.243` |
| 面板 | **宝塔 Linux 面板**（应用镜像自带） |
| 实例配置 | 2 核 / 2GB / 40GB SSD / 512GB·月流量 |
| Vercel 生产 URL | `https://517002650-luminatech-store.vercel.app` |
| 代理后临时入口 | `http://150.109.71.243/en`（英文）、`/zh`（中文） |
| 目标品牌域名 | `stagevio.com`（未购买前用 IP 测试） |

换 IP、换 Vercel 项目名或买域名后，请同步改本文与 [DEPLOYMENT.md §1](./DEPLOYMENT.md)。

---

## 2. 前提条件

- [ ] 已购买腾讯云香港 Lighthouse，状态 **运行中**（**新机从零购买见 §2.1**）
- [ ] 已能登录 **宝塔面板**（端口一般为 `8888`，以安装时显示为准；**查地址与密码见 §2.2**）
- [ ] Vercel 站点在海外可访问：`https://517002650-luminatech-store.vercel.app/en` 返回 200
- [ ] 知道宝塔 root 密码（腾讯云应用管理或安装邮件里）

### 2.1 从零购买新 Lighthouse（腾讯云示例）

适用于：**换了一台新香港服务器**，或第一次买机。

1. 打开 [腾讯云 Lighthouse 购买页](https://console.cloud.tencent.com/lighthouse/instance/create)
2. **地域**：选 **中国香港**（离 Vercel 近，大陆访问也常走香港线路）
3. **镜像**：选 **应用镜像** → **宝塔 Linux 面板**（不要选纯净系统，否则要自己装宝塔）
4. **套餐**：2 核 2GB 入门型即可（与当前实例类似）
5. **时长**：按需购买 → 支付
6. 等待 1–3 分钟，实例状态变为 **运行中**
7. 在实例列表记下 **公网 IP**（下文用 `{HK_IP}` 表示，例如 `150.109.71.243`）

> 买好后先不要做反向代理，先完成 §2.2 登录宝塔、§3 装 Nginx。

### 2.2 查宝塔面板地址与初始密码

1. [Lighthouse 控制台](https://console.cloud.tencent.com/lighthouse) → 点进你的实例
2. 顶部 Tab 选 **应用管理**（或「应用详情」）
3. 找到 **宝塔面板** 信息，通常包含：
   - 面板地址：`http://{HK_IP}:8888/xxxxxxxx`（含安全入口路径）
   - 用户名：一般为 `admin` 或页面显示的值
   - 密码：点击 **显示** / **重置** 获取
4. 浏览器打开面板地址，用用户名密码登录
5. 首次登录会要求绑定宝塔账号（按提示注册/登录即可）

若 **8888 打不开**：Lighthouse → **防火墙** → 放行 TCP `8888`（建议来源限制为你的办公 IP）。

### 2.3 新服务器必须替换的占位符

文档和配置里凡出现下面两项，**换成你新机器的真实值**：

| 占位符 | 含义 | 本项目当前值 | 要改的地方 |
|--------|------|--------------|------------|
| `{HK_IP}` | 香港服务器公网 IP | `150.109.71.243` | 建站域名、防火墙、curl 测试、DNS A 记录 |
| `{VERCEL_HOST}` | Vercel 生产域名（不含 `https://`） | `517002650-luminatech-store.vercel.app` | 反向代理「目标 URL」「发送域名」、`proxy_pass`、`Host` |
| `{VERCEL_URL}` | 完整 Vercel 地址 | `https://517002650-luminatech-store.vercel.app` | `proxy_pass`、curl 测试 |

**路径中的 IP 也要改**：`/www/server/panel/vhost/nginx/proxy/{HK_IP}/`  
例如新 IP 为 `1.2.3.4`，目录为 `proxy/1.2.3.4/`。

---

## 3. 完整部署示例（新机从零到成功，约 30 分钟）

下面是一条龙示例。假设：

- 新服务器 IP：`1.2.3.4`（请换成你的 `{HK_IP}`）
- Vercel 地址不变：`https://517002650-luminatech-store.vercel.app`

### 步骤 1：买机并登录宝塔（§2.1–§2.2）

| 操作 | 示例 |
|------|------|
| 购买 | 香港 + 宝塔镜像 + 2核2G |
| 打开面板 | `http://1.2.3.4:8888/你的安全入口` |
| 登录 | 应用管理里显示的账号密码 |

### 步骤 2：只装 Nginx（§3）

弹窗选 LNMP → **只勾 Nginx** → 极速安装 → 等待完成。

### 步骤 3：放行端口（§4）

| 位置 | 操作 |
|------|------|
| 腾讯云防火墙 | 放行 TCP `80`（来源：全部） |
| 宝塔 → 安全 | 放行 `80` |

### 步骤 4：添加站点（§5）

**网站 → 添加站点**：

```
域名：        1.2.3.4
备注：        stagevio-proxy
PHP：         纯静态
FTP/数据库：  不创建
```

### 步骤 5：添加反向代理（§6）

**网站 → 1.2.3.4 → 设置 → 反向代理 → 添加**：

```
代理名称：    vercel
目标 URL：    https://517002650-luminatech-store.vercel.app
发送域名：    517002650-luminatech-store.vercel.app
开启缓存：    关
```

### 步骤 6：覆盖代理配置文件（§7，必做）

**文件** → 打开：

```text
/www/server/panel/vhost/nginx/proxy/1.2.3.4/
```

编辑其中的 `.conf`，将 `#PROXY-START` 到 `#PROXY-END` **整段替换**为 §7.2 的配置（若 Vercel 域名变了，同步改 `proxy_pass` 与 `Host`）。

### 步骤 7：注释 PHP（§8）

**网站 → 1.2.3.4 → 设置 → 配置文件**，找到并注释：

```nginx
# include enable-php-00.conf;
```

保存。

### 步骤 8：重载并测试（§9）

终端执行：

```bash
nginx -t && nginx -s reload
curl -I https://517002650-luminatech-store.vercel.app/en
curl -I http://1.2.3.4/en
```

**成功示例**（第二条命令）：

```text
HTTP/1.1 200 OK
Server: nginx
x-powered-by: Next.js
```

浏览器（关 VPN）：`http://1.2.3.4/en` → 应看到 Stagevio 英文首页。

### 步骤 9：更新本文 §1 备忘表

把新 `{HK_IP}` 写进 §1，避免以后忘记。

---

## 4. 宝塔首次初始化（只装 Nginx）

首次登录宝塔会弹出 **「初始化推荐配置」**。

### 4.1 需要装的

| 组件 | 是否安装 |
|------|----------|
| **Nginx 1.30** | ✅ **必须** |
| MySQL | ❌ 不需要（数据库在 Neon） |
| PHP | ❌ 不需要（Next.js 在 Vercel） |
| phpMyAdmin | ❌ 不需要 |
| Apache（LAMP） | ❌ 不要选 |

### 4.2 操作步骤

1. 选 **LNMP**（不要选 LAMP）
2. **取消勾选** MySQL、PHP、phpMyAdmin、Pure-Ftpd
3. **只保留 Nginx** 勾选
4. 安装方式：**极速安装**
5. 点 **一键安装**，等待几分钟

若已关掉弹窗：左侧 **软件商店** → 搜索 **Nginx** → **安装**。

---

## 5. 放行防火墙端口

### 5.1 腾讯云 Lighthouse

1. 打开 [腾讯云 Lighthouse 控制台](https://console.cloud.tencent.com/lighthouse)
2. 进入实例 → **防火墙**
3. 添加规则：

| 端口 | 协议 | 来源 | 说明 |
|------|------|------|------|
| 80 | TCP | 全部 IPv4 | HTTP（代理必需） |
| 443 | TCP | 全部 IPv4 | HTTPS（买域名后） |
| 8888 | TCP | 你的办公 IP（可选） | 宝塔面板，建议限制来源 |

### 5.2 宝塔安全

左侧 **安全** → 放行 **80**、**443**（与上面一致）。

---

## 6. 添加网站（绑定 IP）

1. 宝塔左侧 **网站**
2. 右上角 **添加站点**
3. 填写：

| 字段 | 填什么 |
|------|--------|
| 域名 | `150.109.71.243` |
| 备注 | `stagevio-proxy` |
| 根目录 | 默认 `/www/wwwroot/150.109.71.243` |
| FTP | 不创建 |
| 数据库 | 不创建 |
| PHP | **纯静态** 或关闭 PHP |

4. 点 **提交**

---

## 7. 配置反向代理（图形界面）

1. **网站** 列表 → 找到 `150.109.71.243` → **设置**
2. 左侧 **反向代理** → **添加反向代理**
3. 填写：

| 字段 | 值 |
|------|-----|
| 开启代理 | 开 |
| 开启缓存 | **关**（先关，避免干扰 Next.js） |
| 代理名称 | `vercel`（备注名，随意） |
| 目标 URL | `https://517002650-luminatech-store.vercel.app` |
| 发送域名 | `517002650-luminatech-store.vercel.app` |
| 内容替换 | 不填 |

4. 点 **确定** 保存

> 图形界面保存后，宝塔会在 `proxy/150.109.71.243/` 下生成配置文件。**仍需按下一节核对或覆盖**，否则可能出现 403。

---

## 8. 反向代理配置文件（关键，防 403）

### 8.1 文件路径

宝塔 **文件** → 打开目录：

```text
/www/server/panel/vhost/nginx/proxy/150.109.71.243/
```

里面有一个 `.conf` 文件（名称可能是随机字符，如 `9tKXUCps.conf`）。

### 8.2 完整配置（直接复制替换 `#PROXY-START` 到 `#PROXY-END`）

```nginx
#PROXY-START/

location ^~ /
{
    proxy_pass https://517002650-luminatech-store.vercel.app;
    proxy_ssl_server_name on;
    proxy_ssl_name 517002650-luminatech-store.vercel.app;

    proxy_set_header Host 517002650-luminatech-store.vercel.app;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header REMOTE-HOST $remote_addr;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;

    proxy_connect_timeout 60s;
    proxy_read_timeout 60s;
    proxy_send_timeout 60s;
    proxy_buffering off;
    proxy_redirect off;
}

#PROXY-END/
```

### 8.3 必须注意的项

| 配置项 | 正确 | 错误（会导致 403） |
|--------|------|-------------------|
| `proxy_set_header Host` | `517002650-luminatech-store.vercel.app` | `$host` 或 `150.109.71.243` |
| `proxy_ssl_server_name` | `on` | 缺失时 HTTPS 回源可能失败 |
| `proxy_pass` | 完整 `https://...vercel.app` | 缺 `https://` 或域名写错 |

---

## 9. 主站点配置（可选优化）

路径：**网站** → `150.109.71.243` → **设置** → **配置文件**

主配置中建议 **注释掉 PHP**（纯代理不需要）：

```nginx
# include enable-php-00.conf;
```

确认保留这一行（引用上面的代理配置）：

```nginx
include /www/server/panel/vhost/nginx/proxy/150.109.71.243/*.conf;
```

保存。

---

## 10. 重载 Nginx 并测试

### 10.1 重载

宝塔 **终端** 执行：

```bash
nginx -t && nginx -s reload
```

期望输出：

```text
syntax is ok
test is successful
```

### 10.2 测试命令（按顺序）

```bash
# 1. 确认服务器能直连 Vercel（应 200）
curl -I https://517002650-luminatech-store.vercel.app/en

# 2. 确认本机 Nginx 代理（应 200，不能是 403/404）
curl -I http://150.109.71.243/en

# 3. 不要用 127.0.0.1 裸测（会匹配不到 server_name，易 404）
#    若必须用 127.0.0.1，需带 Host：
curl -I -H "Host: 150.109.71.243" http://127.0.0.1/en
```

### 10.3 成功标志

```text
HTTP/1.1 200 OK
x-powered-by: Next.js
```

且响应头 **没有** `X-Vercel-Mitigated: deny`。

### 10.4 浏览器验证

**关闭 VPN**，大陆网络访问：

- 英文：`http://150.109.71.243/en`
- 中文：`http://150.109.71.243/zh`
- 后台：`http://150.109.71.243/admin`

---

## 11. 常见报错与排查

| 现象 | 原因 | 处理 |
|------|------|------|
| **403**，页面写 `403: Forbidden`，ID 含 `hkg1::` | 代理已通，但 Vercel 拒了请求；多为 `Host` 发成 IP | 按 §8 改 `proxy_set_header Host` 和 `proxy_ssl_server_name on`，重载 Nginx |
| 响应头有 `X-Vercel-Mitigated: deny` | 同上 | 同上 |
| **404**，`Server: nginx` | 反向代理未生效，或 `curl 127.0.0.1` 未带 Host | 检查 proxy 目录是否有 `location /`；用 `curl -I http://150.109.71.243/en` 测 |
| **502 Bad Gateway** | 目标 URL 错误，或服务器访问不了 Vercel | 检查 `proxy_pass` 完整 URL；在香港机 `curl -I https://...vercel.app/en` |
| 浏览器完全打不开 | 防火墙未放行 80 | 检查腾讯云防火墙 + 宝塔安全 |
| 首页能开，点链接又打不开 | 页面跳回 `vercel.app` | 买域名后改 Vercel `NEXT_PUBLIC_APP_URL`（见 §13） |
| Stripe/PayPal 结账异常 | 当前是 **HTTP + IP**，无正规 HTTPS | 买域名并申请 SSL（见 §13） |
| 后台 `/admin/login` 有表单但登录失败 / `This page couldn't load` | HTTP + 代理下 Cookie / Server Actions 被拦 | 见 **§12 IP 访问后台**；或暂用 VPN 直连 Vercel |

### 11.1 Vercel 控制台额外检查

若 Host 已改对仍 403，登录 [Vercel 项目设置](https://vercel.com/dashan4/517002650-luminatech-store/settings/deployment-protection)：

1. **Deployment Protection** — 生产环境勿限制为「仅团队成员」
2. **Firewall** — 确认未误拦代理流量

---

## 12. IP 访问后台（代码 + Vercel 环境变量）

> **适用阶段**：尚未购买 `stagevio.com`，需通过 `http://{HK_IP}/admin` 在大陆登录后台。  
> **买回域名并上 HTTPS 后**：按 **§12.4 改回正式配置**，勿长期使用 `ADMIN_COOKIE_SECURE=false`。

### 12.1 现象（情况 A）

| 步骤 | 结果 |
|------|------|
| `http://150.109.71.243/en` | ✅ 前台正常 |
| `http://150.109.71.243/admin/login` | ✅ 能看到登录表单 |
| 点击登录 / 进入 `/admin` | ❌ `This page couldn't load` 或无法保持登录 |
| VPN + `https://517002650-luminatech-store.vercel.app/admin` | ✅ 正常 |

原因：

1. **Server Actions**：浏览器 Origin 为 `http://150.109.71.243`，Vercel 收到 Host 为 `vercel.app`，Next.js 默认拒绝。
2. **Cookie Secure**：生产环境 Cookie 默认 `Secure`，在 **HTTP** 下浏览器不保存登录态。

### 12.2 代码改动说明（已在仓库中）

| 文件 | 改动 | 作用 |
|------|------|------|
| `next.config.ts` | 读取 `SERVER_ACTIONS_ALLOWED_ORIGINS`，写入 **`experimental.serverActions.allowedOrigins`**（Next.js 16 必须放 `experimental` 下，勿写顶层 `serverActions`） | 允许经香港 IP 发起的 Server Actions |
| `src/lib/admin-auth.ts` | 读取 `ADMIN_COOKIE_SECURE`（默认生产为 `true`） | HTTP 代理下可设为 `false` 以写入会话 Cookie |
| `.env.example` | 注释示例 | 本地/文档参考 |

> **注意**：`SERVER_ACTIONS_ALLOWED_ORIGINS` 在 **构建时** 写入配置，改 Vercel 环境变量后必须 **Redeploy** 才会生效。构建成功时应看到 `Experiments: serverActions`；若出现 `Unrecognized key(s): serverActions` 说明配置路径错误，见 **§16 BUG 记录**。

### 12.3 启用步骤（当前 IP 阶段）

#### 第一步 — Vercel 增加环境变量

打开 [环境变量](https://vercel.com/dashan4/517002650-luminatech-store/settings/environment-variables)，**Production** 新增或修改：

```env
SERVER_ACTIONS_ALLOWED_ORIGINS=150.109.71.243
ADMIN_COOKIE_SECURE=false
```

若香港 IP 变更，把 `150.109.71.243` 换成新 `{HK_IP}`（不要加 `http://`）。

**不要改**（此阶段仍保持）：

```env
NEXT_PUBLIC_APP_URL=https://517002650-luminatech-store.vercel.app
```

#### 第二步 — 重新部署

```powershell
cd "e:\项目\独立站\web"
npx vercel --prod --yes
```

或 Vercel Dashboard → Deployments → **Redeploy**（改 env 后建议勾选 Clear Cache）。

#### 第三步 — 验证

1. 大陆网络、**关闭 VPN**
2. 打开 `http://150.109.71.243/admin/login`
3. 用管理员**邮箱 + 密码**登录（不是 `ADMIN_PASSWORD`，除非首次 bootstrap）
4. 应进入商品列表，不再出现 `This page couldn't load`

终端可选自测（登录前）：

```bash
curl -I http://150.109.71.243/admin/login
# 期望 HTTP/1.1 200
```

### 12.4 买回域名 + HTTPS 后如何改回（正式运营）

按顺序做，避免 Cookie / Origin 再次异常。

#### A. 宝塔（香港服务器）

1. 站点绑定 `stagevio.com` / `www.stagevio.com`
2. 申请 Let's Encrypt SSL，**强制 HTTPS**
3. Nginx 反向代理配置 **保持不变**（仍指向 Vercel）

#### B. Vercel 环境变量

| 变量 | IP 临时阶段 | 域名正式阶段 |
|------|-------------|--------------|
| `NEXT_PUBLIC_APP_URL` | `https://517002650-luminatech-store.vercel.app` | `https://stagevio.com` |
| `SERVER_ACTIONS_ALLOWED_ORIGINS` | `150.109.71.243` | `stagevio.com,www.stagevio.com`（**删除 IP**） |
| `ADMIN_COOKIE_SECURE` | `false` | **删除该变量** 或设为 `true` |

域名阶段推荐完整示例：

```env
NEXT_PUBLIC_APP_URL=https://stagevio.com
SERVER_ACTIONS_ALLOWED_ORIGINS=stagevio.com,www.stagevio.com
# 删除 ADMIN_COOKIE_SECURE（恢复默认 Secure=true）
```

同时按 [BRAND.md §1.3](./BRAND.md) 更新 `CONTACT_EMAIL` / `SMTP_FROM`（若已开企业邮）。

#### C. Redeploy

```powershell
cd "e:\项目\独立站\web"
npx vercel --prod --yes
```

#### D. 验证改回成功

| 检查项 | 期望 |
|--------|------|
| `https://stagevio.com/en` | 200，前台正常 |
| `https://stagevio.com/admin` | 可登录，Cookie 为 **Secure** |
| `http://150.109.71.243/admin` | 不再作为正式入口（可 301 到域名或停用） |
| 浏览器 DevTools → Application → Cookies | `admin_session` 带 **Secure** 标志 |

#### E. 同步文档

更新本文 §1 备忘表中的 IP/域名，以及 [TECHNICAL.md](./TECHNICAL.md) 第 2 节网址。

### 12.5 安全提醒

| 项 | 说明 |
|----|------|
| `ADMIN_COOKIE_SECURE=false` | 仅用于 **HTTP + IP** 过渡期；会话 Cookie 可被明文 HTTP 窃听，**勿长期开启** |
| `SERVER_ACTIONS_ALLOWED_ORIGINS` | 只填你控制的域名/IP，不要填 `*` 或无关域名 |
| 正式运营 | 务必 `https://stagevio.com` + `ADMIN_COOKIE_SECURE` 默认（true） |
| 代码是否要删 | **不用删代码**；通过环境变量切换即可，域名阶段改 env 并 Redeploy |

### 12.6 检查清单

**启用 IP 后台（§12.3）**

- [ ] Vercel 已设 `SERVER_ACTIONS_ALLOWED_ORIGINS=150.109.71.243`
- [ ] Vercel 已设 `ADMIN_COOKIE_SECURE=false`
- [ ] 已 Redeploy 且 Deployment 为 **Ready**
- [ ] `http://150.109.71.243/admin/login` 登录成功进入后台

**改回域名正式（§12.4）**

- [ ] 宝塔 SSL + 强制 HTTPS 已开
- [ ] `NEXT_PUBLIC_APP_URL=https://stagevio.com`
- [ ] `SERVER_ACTIONS_ALLOWED_ORIGINS` 仅含 `stagevio.com,www.stagevio.com`（已去掉 IP）
- [ ] 已删除 `ADMIN_COOKIE_SECURE=false` 或改为 `true`
- [ ] 已 Redeploy
- [ ] `https://stagevio.com/admin` 登录正常，Cookie 为 Secure

---

## 13. 买域名后的升级步骤（stagevio.com）

当前用 IP 仅适合 **测试**。正式运营建议：

### 13.1 DNS

在域名注册商添加 **A 记录**：

| 主机记录 | 类型 | 记录值 |
|----------|------|--------|
| `@` | A | `150.109.71.243` |
| `www` | A | `150.109.71.243` |

### 13.2 宝塔

1. **网站** → 站点设置 → 把域名改为 `stagevio.com`（或添加多域名）
2. **SSL** → Let's Encrypt → 申请证书 → **强制 HTTPS**
3. 代理配置 **不用改**（仍代理到同一 Vercel URL）

### 13.3 Vercel 环境变量

域名解析生效且 HTTPS 可访问后，在 [Vercel 环境变量](https://vercel.com/dashan4/517002650-luminatech-store/settings/environment-variables) 修改（**完整对照见 §12.4**）：

```env
NEXT_PUBLIC_APP_URL=https://stagevio.com
```

然后 **Redeploy**（见 [DEPLOYMENT.md §5.1](./DEPLOYMENT.md)）。

可选：Vercel → **Settings** → **Domains** 添加 `stagevio.com`（验证归属）。

详细品牌与邮箱迁移见 [BRAND.md §1.3](./BRAND.md)。

---

## 14. 流量与运维提醒

| 项目 | 说明 |
|------|------|
| 月流量包 | 512GB；主要走代理的是 HTML/API，商品图多在 Cloudinary，一般够用 |
| 服务器内存 | 2GB，**不要**在宝塔装 MySQL/PHP 等无用组件 |
| Vercel 部署 | 仍由 GitHub push / `npx vercel --prod` 触发，**香港机无需重新部署代码** |
| 改 Vercel 项目名 | 需同步改本文 §1、`proxy_pass`、`Host` 三处 |
| 合规 | 面向大陆长期运营可能涉及 ICP 等要求；面向海外客户压力较小 |

---

## 15. 检查清单（配置时逐项打勾）

### 首次配置

- [ ] 宝塔只安装了 **Nginx**
- [ ] 腾讯云防火墙放行 **80**（443 买域名后再开）
- [ ] 宝塔安全放行 **80**
- [ ] 已添加站点，域名 `150.109.71.243`
- [ ] 反向代理目标 URL、发送域名填写正确
- [ ] `proxy/{HK_IP}/*.conf` 已按 §8 覆盖，`Host` 为 vercel 域名
- [ ] 主配置已注释 `enable-php-00.conf`
- [ ] `nginx -t` 通过并已 reload
- [ ] `curl -I http://150.109.71.243/en` 返回 **200**
- [ ] 大陆网络（关 VPN）浏览器能打开首页

### 绑定域名后

- [ ] DNS A 记录指向香港 IP
- [ ] 宝塔 SSL 已申请并强制 HTTPS
- [ ] 已按 **§12.4** 改 Vercel 环境变量（去掉 IP、`ADMIN_COOKIE_SECURE` 恢复 Secure）
- [ ] `NEXT_PUBLIC_APP_URL=https://stagevio.com` 并 Redeploy
- [ ] 结账、登录、邮件链接在大陆/海外各测一遍

---

## 16. BUG 修复记录

### 2026-08-26 — 香港 IP 访问后台：登录页能开，登录后 `This page couldn't load`

| 项目 | 内容 |
|------|------|
| **现象** | `http://150.109.71.243/en` 前台正常；`/admin/login` 能看到表单；点击登录或进入 `/admin` 报 `This page couldn't load` / `A server error occurred` |
| **对照** | VPN + `https://517002650-luminatech-store.vercel.app/admin` 完全正常 |
| **判定** | 不是数据库/Vercel 应用坏了，是 **HTTP + 反向代理** 与 Next.js 安全策略冲突 |

#### 根因（两层）

**1. 业务层（预期行为）**

| 原因 | 说明 |
|------|------|
| Server Actions Origin 校验 | 浏览器 Origin 为 `http://150.109.71.243`，Nginx 转给 Vercel 的 Host 为 `517002650-luminatech-store.vercel.app`，Next.js 默认拒绝 Server Action / 部分 RSC 请求 |
| Cookie `Secure` | 生产环境管理员 Cookie 默认 `Secure=true`，在 **HTTP** 下浏览器不保存会话，登录无法保持 |

**2. 实现层（本次修复中发现的配置 BUG）**

| 原因 | 说明 |
|------|------|
| `next.config.ts` 路径错误 | 首次把 `serverActions.allowedOrigins` 写在顶层；Next.js **16.3.2** 构建告警 `Unrecognized key(s): serverActions`，**环境变量实际未生效** |
| 正确写法 | 必须写在 `experimental.serverActions.allowedOrigins` 下；构建日志应出现 `Experiments: serverActions` |

#### 修复内容

| 层级 | 改动 |
|------|------|
| **Vercel 环境变量** | `SERVER_ACTIONS_ALLOWED_ORIGINS=150.109.71.243`、`ADMIN_COOKIE_SECURE=false`（Production） |
| **代码** | `next.config.ts`：`experimental.serverActions.allowedOrigins`；`admin-auth.ts`：读取 `ADMIN_COOKIE_SECURE` |
| **文档** | 本文 §12；`TECHNICAL.md` 环境变量表；`DEPLOYMENT.md` 后台入口 |
| **Git** | `9792578`（功能+文档）、`b5ba62e`（修正 `experimental` 路径） |
| **部署** | `git push origin main` + `npx vercel --prod --yes` × 2（第二次才使 `allowedOrigins` 真正生效） |

#### 验证通过标准

- [ ] 构建日志 **无** `Unrecognized key(s): serverActions`，且有 `Experiments: serverActions`
- [ ] 大陆关 VPN：`http://150.109.71.243/admin/login` 邮箱登录成功进入商品列表
- [ ] `https://517002650-luminatech-store.vercel.app/zh` → 200；`/admin` 未登录 → 307 `/admin/login`

#### 若以后再遇到类似问题

1. 确认 Vercel Production 已设 §12.3 两个环境变量并已 **Redeploy**
2. 打开最新 Deployment **Build Logs**，搜 `serverActions` / `Unrecognized key`
3. 对照 §12.2 确认 `next.config.ts` 使用 `experimental.serverActions`
4. 买回 `stagevio.com` 后按 **§12.4** 改回 Secure Cookie，勿长期 `ADMIN_COOKIE_SECURE=false`

---

## 17. 文档索引

| 文档 | 何时看 |
|------|--------|
| **本文 `docs/HK-REVERSE-PROXY.md`** | 香港反向代理配置、403 排查、**§16 BUG 记录**、忘步骤时 |
| `docs/DEPLOYMENT.md` | Vercel / Neon / Cloudinary 首次部署 |
| `docs/BRAND.md` | stagevio.com 域名与品牌环境变量 |
| `docs/TECHNICAL.md` | 日常改商品、订单、后台运营 |

---

**维护约定**：更换香港 IP、Vercel 生产域名或宝塔版本后，请同步更新本文 §1 备忘表、§2.3 占位符、§8 配置与 **§12 环境变量**。
