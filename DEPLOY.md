# 部署指南 — Vercel + Cloudinary + PostgreSQL

## ⚠️ 安全提醒

**切勿在聊天、代码或截图中分享 GitHub 密码。**  
GitHub 已不支持用密码推送代码，请使用 **Personal Access Token (PAT)**。

若密码已泄露，请立即：
1. 打开 https://github.com/settings/security
2. 修改密码并开启两步验证 (2FA)

---

## 第一步：准备 PostgreSQL 数据库

推荐 [Neon](https://neon.tech)（免费）：

1. 注册并新建 Project
2. 复制 **Connection string**（选 `Pooled connection`，带 `?sslmode=require`）
3. 格式示例：
   ```
   postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

---

## 第二步：准备 Cloudinary

1. 注册 https://cloudinary.com
2. Dashboard 复制：
   - Cloud Name
   - API Key
   - API Secret

---

## 第三步：推送代码到 GitHub

在本机 `web` 目录的**上一级**（或直接在 `web` 内）执行：

```bash
cd web
git init -b main
git add .
git commit -m "Prepare for Vercel deployment"
```

在 GitHub 网页新建仓库（如 `luminatech-store`），**不要**勾选 README。

创建 Personal Access Token：
- https://github.com/settings/tokens → Generate new token (classic)
- 勾选 `repo` 权限

推送：

```bash
git remote add origin https://github.com/你的用户名/luminatech-store.git
git push -u origin main
```

提示输入密码时，**粘贴 Token**（不是 GitHub 登录密码）。

---

## 第四步：Vercel 部署

1. 打开 https://vercel.com 并用 GitHub 登录
2. **Add New Project** → 选择刚推送的仓库
3. **Root Directory** 设为 `web`（若仓库根目录就是 web 则留空）
4. 填入环境变量：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | Neon PostgreSQL 连接串 |
| `NEXT_PUBLIC_APP_URL` | 部署后的域名，如 `https://xxx.vercel.app` |
| `STRIPE_SECRET_KEY` | Stripe Live 密钥 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Live 公钥 |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal Live（可选） |
| `ADMIN_PASSWORD` | 强密码 |
| `USER_SESSION_SECRET` | 随机长字符串 |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary |
| `CLOUDINARY_API_KEY` | Cloudinary |
| `CLOUDINARY_API_SECRET` | Cloudinary |
| `SMTP_HOST` | 邮件（建议 Resend/SendGrid） |
| `SMTP_PORT` | 587 |
| `SMTP_USER` | |
| `SMTP_PASS` | |
| `SMTP_FROM` | `"LuminaTech <noreply@yourdomain.com>"` |
| `STORE_NAME` | LuminaTech |
| `CONTACT_EMAIL` | support@yourdomain.com |

5. 点击 **Deploy**

---

## 第五步：初始化生产数据库

部署成功后，在本地（已配置生产 `DATABASE_URL`）或 Vercel Shell 执行：

```bash
cd web
npx prisma db push
npm run db:seed
```

或在 Neon SQL Editor 中确认表已创建（首次 deploy 后若表不存在需执行上述命令）。

---

## 第六步：验证

- [ ] 首页 `/zh` 可访问
- [ ] 后台 `/admin` 可登录
- [ ] 后台上传图片（应存到 Cloudinary）
- [ ] 测试下单 + 确认邮件
- [ ] 更新 `NEXT_PUBLIC_APP_URL` 为最终域名后重新 Deploy

---

## 支付上线

- Stripe：Dashboard 切换到 Live，替换 `sk_live_` / `pk_live_`
- PayPal：创建 Live App，替换 Client ID

---

## 常见问题

**构建失败 `prisma generate`**
→ 确认 `DATABASE_URL` 已在 Vercel 环境变量中配置。

**图片上传失败**
→ 检查三个 `CLOUDINARY_*` 变量。

**本地开发**
→ `.env` 中 `DATABASE_URL` 指向 Neon 开发库或本地 Docker Postgres。
