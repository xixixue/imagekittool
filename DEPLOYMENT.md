# ImageKitTools 生产部署实施清单

目标架构：**Vercel（应用）+ Neon（数据库）+ Cloudflare R2（对象存储）+ Resend（邮件）**。

四个服务都有免费档，足够上线初期使用。本文档分两栏职责：
- **【你做】**：需要你（负责人）注册账号、创建资源、拿凭证、配 DNS。这些是 AGENTS §22 规定「不得编造」的配置，只有你能完成。
- **【我做】**：拿到凭证后，我来改代码、接适配器、跑构建验证。

> 全程不要把任何凭证发到代码仓库或 `.env`（`.env` 已被 gitignore）。凭证只填到 Vercel 的环境变量里。

---

## 0. 总览与执行顺序

```
你的域名 (DNS 托管到 Cloudflare)
        │
        ├── Cloudflare R2 ──→ 对象存储（原图/结果图）
        ├── Resend ─────────→ 验证/重置邮件（发件域名在此验证）
        └── GSC 验证记录 ────→ 搜索引擎索引
                │
   Vercel ──→ 跑 Next.js 应用 ──→ 连 Neon (PostgreSQL)
                              ──→ 调 R2 (存储)
                              ──→ 调 Resend (邮件)
                              ──→ 加载 GA4/Sentry (条件化)
```

**务必按此顺序**（后一步依赖前一步的域名/凭证）：

1. 注册域名 + 把 DNS 托管到 Cloudflare（§1）
2. 建 R2 存储桶 + 拿凭证（§2）
3. 建 Neon 数据库 + 拿连接串（§3）
4. 注册 Resend + 验证发件域名 + 拿 API Key（§4）
5. 把代码推到 GitHub（§5）
6. Vercel 导入仓库 + 填全部环境变量 + 部署（§6）
7. Vercel 绑定自定义域名 + 在 Cloudflare 加解析（§7）
8. 配 GA4（§8）、Sentry（§9）
9. Google Search Console 验证 + 提交 sitemap（§10）

---

## 1. 前置：域名 + Cloudflare DNS

**【你做】**
1. 在任意注册商买一个域名（例如 `imagekittool.com`）。Cloudflare Registrar、Namecheap、阿里云均可。
2. 注册 Cloudflare 账号（cloudflare.com）。
3. Cloudflare 控制台 → **Add a site** → 输入你的域名 → 选 **Free** 计划。
4. Cloudflare 会给你两个 **nameserver**（形如 `xxx.ns.cloudflare.com`）。
5. 回到你的域名注册商，把域名的 **Nameserver** 改成 Cloudflare 给的那两个。
6. 等 DNS 生效（几分钟到几小时）。Cloudflare 控制台显示 **Active** 即成功。

**为什么要先做这步**：后面 R2 的存储、Resend 的发件域名、GSC 的验证记录、Vercel 的自定义域名，都要在这同一个 Cloudflare DNS 里加解析记录。先把 DNS 大门搭好。

> 之后所有「加一条 DNS 记录」的操作都在 Cloudflare 控制台 → 你的域名 → **DNS → Records → Add record** 里完成。

---

## 2. Cloudflare R2（对象存储）

**它是什么**：S3 兼容的对象存储，存用户主动保存的原图/结果图。**出口流量免费**（相比 AWS S3 省钱）。Bucket 设为私有，只有通过预签名 URL 才能读写——符合 SPEC「Bucket 私有」。

### 【你做】
1. Cloudflare 控制台左侧 **R2 Object Storage** → 开通（可能需要绑一张卡做验证，但免费档不会扣费：10 GB 存储 + 100 万次/月 A 类操作免费）。
2. **Create bucket** → 名称例如 `imagekittool-prod`（小写、无下划线）→ Location 选 Auto → **Create**。记下这个 bucket 名。
3. 回到 R2 总览页 → 右上角 **Manage R2 API Tokens** → **Create API token**。
4. 权限选 **Object Read & Write**（如需列出对象再勾 Admin Read）。指定可用 bucket 为刚建的那个（或 Apply to all buckets）。
5. 创建后会显示**四样东西**（只显示一次，立刻复制保存）：
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint**（本项目的真实值：`https://<account_id>.r2.cloudflarestorage.com`）
   - （可选）**Jurisdiction** / region

### 填到 Vercel 环境变量（§6 一起填）
| 变量名 | 值（密钥完整值见 `.env.vercel`） |
|---|---|
| `S3_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
| `S3_REGION` | `auto` |
| `S3_BUCKET` | `imagekittool-prod` |
| `S3_ACCESS_KEY_ID` | `<owner-provided>`（完整见 `.env.vercel`） |
| `S3_SECRET_ACCESS_KEY` | `<owner-provided>`（完整见 `.env.vercel`） |

### 【我做】
- 实现 `S3StorageAdapter`（用 `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`，指向 R2 endpoint）。**依赖披露**：`@aws-sdk/client-s3` + presigner，Apache-2.0，AWS 官方维护，仅进服务端 bundle（不增加前端体积），用于预签名 PUT/GET、head、delete、list。符合 AGENTS 规则 6。
- 之后 `isCloudStorageEnabled()` 在生产会返回 true，云功能自动可用。

### ⚠️ R2 CORS（必须配，否则浏览器直传失败）
浏览器直接 PUT/GET R2 是跨域请求，必须在 bucket 上配 CORS，否则上传报错：
1. Cloudflare R2 → 你的 bucket → **Settings → CORS Policy → Add CORS policy**。
2. 粘贴下面这段（已填好你的域名 `imagekittool.com`；如换域名再替换两处 origin）：
   ```json
   [{
     "AllowedOrigins": ["https://imagekittool.com", "https://www.imagekittool.com"],
     "AllowedMethods": ["GET", "PUT"],
     "AllowedHeaders": ["Content-Type", "Content-Length"],
     "ExposeHeaders": ["ETag"],
     "MaxAgeSeconds": 3600
   }]
   ```
3. **本地浏览器测试**也要加 `http://localhost:3000`（否则浏览器直传报 CORS）：
   ```json
   { "AllowedOrigins": ["http://localhost:3000"], "AllowedMethods": ["GET","PUT"], "AllowedHeaders": ["Content-Type","Content-Length"] }
   ```
4. 保存即可。

### 验证
- 上线后：注册账号 → 工具页处理图片 → 点「Save result」→ 在 `/account/files` 看到文件 → 能下载删除 → `/account/storage` 配额变化。

---

## 3. Neon（PostgreSQL 数据库）

**它是什么**：Serverless PostgreSQL，按需启停、带连接池。SPEC §10 本就要求生产用 PostgreSQL（dev 用 SQLite 只为本地无依赖）。

### 【你做】
1. 注册 neon.tech（可用 GitHub 登录）。
2. **Create Project** → 名字随意 → Region 选离你用户最近的 → 创建。
3. 项目首页会显示连接串，**选 Pooled connection**（带 `-pooler` 的那个，用于 serverless 连接池）。
4. 复制完整连接串，形如：
   `postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`
5. （Neon 免费档：0.5 GB 存储 + 一个分支，够上线初期。）

### 填到 Vercel 环境变量
| 变量名 | 值 |
|---|---|
| `DATABASE_URL` | 上面那个 **pooled** 连接串（务必含 `?sslmode=require`；**去掉 `&channel_binding=require`**——Prisma 引擎不支持） |

### 【我做】（已完成 ✅）
- `prisma/schema.prisma` 的 `datasource` 已从 `sqlite` 改成 `postgresql`（dev 与 prod 统一用 Neon，一套 schema）。
- 已 `prisma db push` 把全部 6 张表建到 Neon 上；`postinstall: prisma generate` 已加入 package.json（Vercel 构建时自动生成 client）。
- 已实测：Prisma Client 连 Neon 成功，注册接口写入 `user/session/token` 三表确认无误（argon2 哈希在 Node 下正常）。
- 旧的 SQLite migration 目录已删除（其 SQL 是 SQLite 方言，不适用于 Postgres；统一用 `db push` 同步 schema）。

> 注意：生产是全新空库（已验证 0 行），用户上线后重新注册即可。后续若改 schema，本地跑 `pnpm exec prisma db push` 同步到 Neon。

### 验证
- 部署后注册一个账号 → 在 Neon 控制台 SQL Editor 能查到 `users` / `sessions` 表里有数据。

---

## 4. Resend（邮件）

**它是什么**：开发者邮件 API，发验证邮件、密码重置邮件。HTTP 接口，任何宿主都能调。

### 【你做】
1. 注册 resend.com。
2. **Domains** → **Add Domain** → 输入你的域名（例如 `imagekittool.com`）→ 创建。
3. Resend 会给你几条 **DNS 记录**（MX、SPF、DKIM 等 TXT 记录）。
4. 到 **Cloudflare DNS** 把这些记录一条条加上（类型、Name、Value 照抄）。
5. 回 Resend 点 **Verify DNS**，等几分钟变 **Verified**。
6. **API Keys** → **Create API Key** → 复制 `re_xxxxxxxx`。
7. （Resend 免费档：每天 100 封 + 每月 3000 封，需验证自有域名；上线初期够用。）

### 填到 Vercel 环境变量
| 变量名 | 值（密钥完整值见 `.env.vercel`） |
|---|---|
| `RESEND_API_KEY` | `<owner-provided>`（完整见 `.env.vercel`） |
| `EMAIL_FROM` | `ImageKitTools <noreply@imagekittool.com>` |

### 【我做】
- 实现 `ResendEmailSender`（HTTP 调 `https://api.resend.com/emails`），替换现在的 `ConsoleEmailSender`（后者只在 dev 把验证码打到控制台）。
- 更新 `.env.example`，把旧的 SMTP 段替换为 `RESEND_API_KEY` + `EMAIL_FROM`。

### 验证
- 部署后注册账号 → 收到验证邮件 → 点链接验证 → 忘记密码流程能收信。

---

## 5. 把代码推到 GitHub

**【你做】**
1. 在 GitHub 建一个空仓库（例如 `imagekittool`），**不要**勾选初始化 README（避免冲突）。
2. 本地仓库（如尚未 git init）：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/imagekittool.git
   git push -u origin main
   ```
3. 确认 `.env` **没被推送**（仓库根 `.gitignore` 已含 `.env`；可再 `git log -- .env` 确认无历史）。

> 如果你不想现在就推全量，也可以等我把生产化代码改完再推。但 Vercel 部署需要 GitHub 仓库，所以这一步迟早要做。

---

## 6. Vercel（应用托管）

**它是什么**：Next.js 官方推荐的托管平台，零配置部署、自动 CI/CD、自带 CDN/边缘网络、预览部署。

### 【你做】
1. 注册 vercel.com（用 GitHub 登录最方便）。
2. **Add New → Project** → 选刚才的 GitHub 仓库 → **Import**。
3. Framework Preset 自动识别为 **Next.js**，**不用改任何 Build/Output 设置**。
4. 展开 **Environment Variables**，把下表全部填上（Production / Preview / Development 三个环境都勾，或至少 Production）：

> **在哪填**：就在这个 Import 配置页向下滚到的 **Environment Variables** 区域。每条填 **Name**（变量名）+ **Value**（值），勾选 Production/Preview/Development，点 **Add**，再填下一条。
> **捷径**：该区域有个 **「.env」/「Paste .env」** 按钮，点它可把整段 `KEY=VALUE`（多行）一次性粘进去，比逐条点快得多——把下面这张表整理成一段粘贴即可。
> **事后补填/改**：部署后进项目 → 顶部 **Settings** → 左侧 **Environment Variables** → 增删改；改完必须 **Redeploy**（Deployments → 最新那条 → ⋯ → Redeploy）才生效。GA4/Sentry 这种后拿到的就走这里补。

| 变量名 | 来自哪 | 真实值（密钥已脱敏，完整值见本地 `.env.vercel`） |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | 你的域名 | `https://imagekittool.com` |
| `DATABASE_URL` | §3 Neon | `postgresql://<user>:••••@<host>-pooler…/neondb?sslmode=require` |
| `S3_ENDPOINT` | §2 R2 | `https://<account_id>.r2.cloudflarestorage.com` |
| `S3_REGION` | 固定 | `auto` |
| `S3_BUCKET` | §2 R2 | `imagekittool-prod` |
| `S3_ACCESS_KEY_ID` | §2 R2 | `<owner-provided>`（完整见 `.env.vercel`） |
| `S3_SECRET_ACCESS_KEY` | §2 R2 | `<owner-provided>`（完整见 `.env.vercel`） |
| `RESEND_API_KEY` | §4 Resend | `<owner-provided>`（完整见 `.env.vercel`） |
| `EMAIL_FROM` | §4 Resend | `ImageKitTools <noreply@imagekittool.com>` |
| `AUTH_SECRET` | 预留 | 留空（MVP 用 cookie token，暂不需要） |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | §8 | 待提供（`G-XXXXXXXX`） |
| `NEXT_PUBLIC_SENTRY_DSN` | §9 | 待提供 |
| `SENTRY_DSN` | §9 | 待提供（可选，服务端用） |

> **密钥完整值在本地 `.env.vercel`（已 gitignore，不入库）**。Vercel「Paste .env」直接粘 `.env.vercel` 全文，一次灌入全部 13 个变量；或逐条按上表填（密钥粘 `.env.vercel` 里的完整值）。

5. 点 **Deploy**。首次构建几分钟，完成后给一个 `xxx.vercel.app` 的预览域名。
6. 打开预览域名，确认首页能访问。

### 【我做】（部署前的代码准备）
- 在 `next.config` 加生产安全头：`Content-Security-Policy`、`Strict-Transport-Security`（HSTS）、`X-Content-Type-Options`、`Referrer-Policy`、`X-Frame-Options`（或 CSP frame-ancestors）。
- 确认 `NEXT_PUBLIC_APP_URL` 正确驱动 canonical / sitemap / OG 绝对 URL。
- 跑一次 `pnpm build` 确认生产构建通过。

### 验证
- 打开 `xxx.vercel.app` → 注册登录 → 用工具 → 保存到云 → `/account/files` 可见。此时云存储走 R2、DB 走 Neon、邮件走 Resend，已全链路打通（只是域名还没绑）。

---

## 7. 自定义域名

**【你做】**
1. Vercel 项目 → **Settings → Domains** → 输入你的域名（如 `imagekittool.com`）→ Add。
2. Vercel 会显示需要加的 DNS 记录，通常是：
   - `CNAME` 记录：Name `@`（或 `www`）→ Value `cname.vercel-dns.com`；或
   - `A` 记录：Name `@` → Value `76.76.21.21`。
   （以 Vercel 页面显示为准。）
3. 到 **Cloudflare DNS** 加这条记录。**注意**：如果加的是 CNAME 且 Cloudflare 开了橙色云朵（代理），把它点成灰色（DNS only），避免和 Vercel 的 SSL 冲突；按 Vercel 提示操作即可。
4. 回 Vercel，几分钟内域名变 **Valid Configuration**，自动签发 SSL 证书。
5. 访问 `https://imagekittool.com` 确认可用。

> 建议同时把 `www.你的域名` 也加到 Vercel 并设为重定向到主域名。

---

## 8. GA4（Google Analytics 4）

**【你做】**
1. 打开 analytics.google.com → **创建账号** → 新建 **GA4 媒体资源**。
2. **数据流 → 添加数据流 → Web** → 输入你的域名（`https://imagekittool.com`）→ 创建。
3. 拿到 **衡量 ID**（Measurement ID），形如 `G-XXXXXXXX`。
4. 填到 Vercel 环境变量：`NEXT_PUBLIC_GA_MEASUREMENT_ID = G-XXXXXXXX`。
5. 在 Vercel 点 **Redeploy**（让新变量生效）。

**【我做】**：代码已就绪——`Analytics` 组件在检测到 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 时自动加载 gtag，没有则零脚本。无需额外改码。

**验证**：部署后访问站点几页 → GA4 实时报告能看到活跃用户。

---

## 9. Sentry（错误监控）

**【你做】**
1. 注册 sentry.io。
2. **Create Project** → 平台选 **Next.js** → 创建。
3. 拿到 **DSN**（形如 `https://<key>@o<org>.ingest.sentry.io/<project>`）。
4. 填到 Vercel 环境变量：`NEXT_PUBLIC_SENTRY_DSN`（前端用）和 `SENTRY_DSN`（服务端预留）。
5. Redeploy。

**【我做】**：客户端 Sentry 已条件化加载（检测到 `NEXT_PUBLIC_SENTRY_DSN` 即从 CDN 初始化）。服务端错误捕获（`@sentry/nextjs`）属可选增强，可上线后再加（需评估依赖体积）。

**验证**：Sentry 控制台 → Issues 能看到前端错误（可故意触发一个测试）。

---

## 10. Google Search Console（搜索引擎索引）

**【你做】**
1. 打开 search.google.com/search-console → 用 Google 账号登录。
2. **添加资源** → 选 **网域**（推荐，覆盖所有子域）→ 输入你的域名。
3. GSC 给一条 **TXT 记录**用于验证（形如 `google-site-verification=xxxx`）。
4. 到 **Cloudflare DNS** 加这条 TXT 记录：Name `@`，Value 照抄。
5. 回 GSC 点 **验证**，几分钟通过。
6. **Sitemaps** → 提交 `sitemap.xml`（即填 `https://imagekittool.com/sitemap.xml`）。

**【我做】**：`sitemap.xml` 和 `robots.txt` 已生成（含全部工具页 + 内容页，禁止 account/auth/api）。无需改码。

**验证**：几天后 GSC 覆盖报告能看到被索引的页面。

---

## 11. 我会做的代码改造（汇总）

拿到你的凭证后（或你确认开工后我先做不依赖凭证的部分），我来完成：

1. **`S3StorageAdapter`**（指向 R2，用 `@aws-sdk/client-s3` + presigner）——替换现在的 Mock/TODO。
2. **Prisma datasource → postgresql** + 在 Neon 上跑迁移。
3. **`ResendEmailSender`**（HTTP API）——替换 `ConsoleEmailSender`。
4. **生产安全头**（CSP / HSTS / X-Content-Type-Options / Referrer-Policy）写入 `next.config`。
5. **`.env.example` 更新**（加 `RESEND_API_KEY`，移除旧 SMTP 段）。
6. **生产构建 + e2e 验证**：用你提供的凭证在本地 `.env` 跑一次全链路（注册→工具→存云→邮件→下载删除），确认无误再让你部署。

> 依赖新增只有 `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`（Apache-2.0，AWS 官方维护，仅服务端）。Resend 用原生 `fetch`，无新依赖。符合 AGENTS 规则 6/7。

---

## 12. 环境变量总清单（你最终要凑齐的）

| 变量 | 来源 | 必填? | 说明 |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | 你的域名 | ✅ | `https://imagekittool.com`，驱动 canonical/sitemap/OG |
| `DATABASE_URL` | Neon | ✅ | PostgreSQL **pooled** 连接串，含 `?sslmode=require`（完整值见 `.env.vercel`） |
| `S3_ENDPOINT` | R2 | ✅ | `https://<account_id>.r2.cloudflarestorage.com` |
| `S3_REGION` | 固定 | ✅ | `auto` |
| `S3_BUCKET` | R2 | ✅ | `imagekittool-prod` |
| `S3_ACCESS_KEY_ID` | R2 | ✅ | R2 API Token 的 Access Key ID（完整值见 `.env.vercel`） |
| `S3_SECRET_ACCESS_KEY` | R2 | ✅ | R2 API Token 的 Secret（完整值见 `.env.vercel`） |
| `RESEND_API_KEY` | Resend | ✅ | `<owner-provided>`（完整值见 `.env.vercel`） |
| `EMAIL_FROM` | Resend | ✅ | `ImageKitTools <noreply@imagekittool.com>` |
| `AUTH_SECRET` | — | ⬜ | 预留，MVP 可留空 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 | ⬜ | `G-XXXXXXXX`，不填则无分析脚本 |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry | ⬜ | 不填则无前端监控 |
| `SENTRY_DSN` | Sentry | ⬜ | 服务端预留 |

> ⬜ 的不填也能上线，功能只是「不加载该第三方」。

---

## 13. 上线后检查清单

- [ ] 访问 `https://imagekittool.com`，首页正常。
- [ ] 游客用任一工具处理图片，能下载，**无登录墙**。
- [ ] 注册账号 → 收到验证邮件 → 点链接验证成功。
- [ ] 登录后工具页点「Save result」→ `/account/files` 可见 → 能下载 → 能删除 → `/account/storage` 配额变化。
- [ ] 用户 A 看不到用户 B 的文件（用两个账号验证）。
- [ ] 忘记密码 → 收到重置邮件 → 重置成功。
- [ ] `https://imagekittool.com/sitemap.xml` 可访问，含所有工具页。
- `https://imagekittool.com/robots.txt` 禁止 `/account /api` 等。
- [ ] 切换语言（8 种）页面 chrome + 工具页 SEO 文案 + 内容页均本地化。
- [ ] 浏览器开发者工具 → Network：用工具时**无图片字节上传**（仅点 Save 才上传）。
- [ ] 安全头：响应头含 `Strict-Transport-Security`、`Content-Security-Policy` 等（可用 securityheaders.com 评分）。
- [ ] GA4 实时报告有数据；Sentry 无异常刷屏。

---

## 费用预估（上线初期）

| 服务 | 免费档 | 超出后 |
|---|---|---|
| Vercel Hobby | 100 GB 带宽/月、足够 serverless 调用 | $20/月 Pro |
| Neon Free | 0.5 GB 存储、一个分支 | 按用量 |
| Cloudflare R2 | 10 GB 存储、A 类 100 万次/月、**出口免费** | $0.015/GB·月 存储 |
| Resend Free | 100 封/天、3000 封/月 | $20/月起 |

初期个人/小流量项目基本零成本运行。
