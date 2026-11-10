# ImageKitTools — V2 Phase 0 现状审查报告

- 版本：V2.0 Phase 0
- 依据：`ImageKitTools_SPEC_V2.md`（§17 Phase 0、§21 首条指令）、`ImageKitTools_SPEC.md`（V1.1）、`AGENTS.md`
- 审查方式：仓库代码核实 + 线上站点 `https://www.imagekittool.com/` 实访（HTTP 200）+ 健康检查
- 结论先行：仓库已远超 V1.1 Phase 0，实际推进到约 V1.1 Phase 3–4（含部分 Phase 5），生产已上线运行真实云服务。V2 的多数"新增"能力尚未实现。

---

## 1. 仓库结构与技术栈

### 1.1 技术栈（已落地，与 V1.1 §9.1 一致）

| 层 | 选型 | 备注 |
|---|---|---|
| Web | Next.js 15 App Router | `next.config.ts` 含生产安全头（CSP/HSTS/nosniff/Referrer-Policy/Permissions-Policy） |
| 语言 | TypeScript 5.7 | `tsconfig.json` |
| UI | Tailwind v4 + shadcn 风格组件 | `components/ui`、`components.json` |
| i18n | next-intl 4 | 9 语言：en/es/fr/ja/pt/ru/ar/zh + ar RTL（`i18n/routing.ts`、`messages/*.json`） |
| 表单 | react-hook-form + zod | `lib/validation` |
| 裁剪 | react-easy-crop | cropper 工具 |
| ZIP | fflate | 动态 `import("fflate")`，不进首屏 |
| ORM/DB | Prisma 6 + PostgreSQL（Neon） | `prisma/schema.prisma`，`datasource=postgresql`；本地 `prisma/dev.db`（SQLite 残留，已 gitignore） |
| 认证 | 自实现：argon2id（`@node-rs/argon2`）+ 服务端 session token | `lib/auth/*`、`features/auth`（占位） |
| 对象存储 | `@aws-sdk/client-s3` + `s3-request-presigner` → Cloudflare R2 | `lib/storage/s3-adapter.ts`（服务端） |
| 邮件 | Resend（HTTP） | `lib/email/resend-sender.ts`，dev 回退 ConsoleEmailSender |
| 分析/监控 | GA4 / Sentry / AdSense 三者条件化加载 | `components/analytics/analytics.tsx` |
| 测试 | Vitest 2.1 | `vitest.config.ts` |
| 包管理 | pnpm 10.34（workspace 内 store） | `.npmrc` |

### 1.2 目录结构（与 V1.1 §9.3 建议一致）

```
app/            35 路由文件（页面 + API + sitemap/robots/icon）
components/     layout/tools/upload/cloud/auth/ads/analytics/guides/legal/ui
features/       image-processing(18 模块)/cloud-storage/quota/auth·history(占位)
lib/            data(tool-seo/tools/guides)/auth/db/storage/email/config/validation/download
hooks/          use-image-tool-workspace / use-cloud-status
prisma/         schema.prisma（6 表）
tests/          auth/storage/sanity
scripts/        preflight/verify-e2e/verify-neon/r2/resend/generate-guide-assets
i18n + messages/  9 语言
public/guides/  12 篇文章封面 + inline 图 + 演示图
docs/           本审查报告
```

### 1.3 构建与部署方式

- 部署：**Vercel**（生产已在 `imagekittool.com` 运行，实访确认）。
- 依赖服务（已真实开通，见 `DEPLOYMENT.md`）：Vercel + Neon(PostgreSQL) + Cloudflare R2 + Resend。
- 构建命令 `pnpm build` → Next.js 生产构建，`postinstall: prisma generate`。
- 线上首页结构与 `app/page.tsx` 一致；线上导航：Tools / Guides / About / Contact + 登录 + 语言切换。

---

## 2. 健康检查基线（四项全绿）

| 命令 | 结果 |
|---|---|
| `pnpm typecheck` | ✅ 通过，零错误 |
| `pnpm lint` | ✅ No ESLint warnings or errors |
| `pnpm test` | ✅ 17 文件 / 110 测试全部通过（553ms） |
| `pnpm build` | ✅ 通过（exit 0）；Guides 12 篇 SSG 预渲染；首屏共享 JS 102 kB |

测试覆盖：image-processing（adjust/blur/dimensions/format/limits/meme/rotate/search/validate/watermark）、auth（rate-limit/tokens/validation）、cloud-storage（upload）、quota、storage（s3-adapter）、sanity。

---

## 3. 现有工具盘点表（V2 §4.1 / §21 要求）

V2 §4.1 列出的 10 个现有工具，**全部已上线且为真实实现**（非占位）。`lib/data/tools.ts` 中 10 个均 `status: "active"`，各有 `page.tsx` + 独立 `*-client.tsx` + 对应 `features/image-processing/*.ts` 引擎模块 + 单测。

| 工具 | 路由 | 状态 | 引擎模块 | 单测 | 批量 | 本地处理 | SEO 内容 |
|---|---|---|---|---|---|---|---|
| Image Compressor | `/image-compressor` | ✅ 完整 | compress.ts | ✅ | ✅ | ✅ | ✅ ToolSeo+DeepDive |
| Image Resizer | `/image-resizer` | ✅ 完整 | resize.ts | (via dimensions) | ✅ | ✅ | ✅ |
| Image Converter | `/image-converter` | ✅ 完整 | convert.ts | ✅ format | ✅ | ✅ | ✅ |
| Image Cropper | `/image-cropper` | ✅ 完整 | crop.ts | (react-easy-crop) | 单张 | ✅ | ✅ |
| Compress to KB | `/compress-image-to-kb` | ✅ 完整 | compress-to-kb.ts | (via compress) | ✅ | ✅ | ✅ |
| Rotate / Flip | `/rotate-image` | ✅ 完整 | rotate.ts | ✅ | ✅ | ✅ | ✅ |
| Watermark | `/watermark-image` | ✅ 完整 | watermark.ts | ✅ | ✅ | ✅ | ✅ |
| Meme Generator | `/meme-generator` | ✅ 完整 | meme.ts | ✅ | ✅ | ✅ | ✅ |
| Photo Editor | `/photo-editor` | ✅ 完整 | adjust.ts | ✅ | 单张 | ✅ | ✅ |
| Blur Image | `/blur-image` | ✅ 完整 | blur.ts | ✅ | 单张 | ✅ | ✅ |

**V2 P0 新工具（§4.2）—— 均未实现（属 V2 Phase 2）**：EXIF Viewer、EXIF Remover、DPI Changer、Favicon Generator、Image to PDF、PDF to Image（仓库无对应路由/引擎/依赖如 PDF.js）。

**V2 P1 工具（§4.3）—— 均未实现**：SVG Optimizer/SVG to PNG/GIF 套件/Social Media Resizer/Color Palette/Color Picker/HEIC to JPG/PNG to ICO/Base64/Collage/各平台 Maker。

**V2 P2 AI 工具（§4.4）—— 均未实现**（符合"未验证前不开发"）。

---

## 4. 本地处理验证（V2 §1.1 / §15 / §21 第 4 条）

**结论：完全合规，无任何静默图片上传。**

- `features/image-processing/*`（18 模块）：grep `fetch(|FormData|XMLHttpRequest|axios|.put(|.post(` → **零匹配**。纯 Canvas/createImageBitmap/OffscreenCanvas 本地处理。
- `components/*`、`hooks/*` 的 `fetch` 调用仅用于：认证（session/login/register/logout/verify/reset/forgot）、云存储元数据（files 列表/download-url/delete/cleanup/usage）。**无一上传图片二进制**。
- **唯一图片二进制上传路径**：`lib/cloud/client.ts → uploadToCloud()`，流程为 `POST /api/cloud/uploads`（仅元数据）→ 浏览器 `PUT` 预签名 URL 直传对象存储 → `POST /api/cloud/uploads/:id/complete`。**图片字节不经业务 API**。
- 该上传**仅由 `SaveToCloudButton` 触发**（`components/cloud/save-to-cloud-button.tsx`），且仅登录用户、用户主动点击，分 ORIGINAL/PROCESSED 分别保存——完全满足 Local First + Cloud Optional + Guest First。
- 文件签名校验：`features/image-processing/validate.ts` 用 magic bytes（前 12 字节）识别真实格式，并与声明 MIME/扩展名交叉校验，拒绝伪装文件（V2 §15 ✅）。
- 资源释放：`useImageToolWorkspace` 在 unmount/remove/clear 时 `URL.revokeObjectURL`，处理完 `releaseImage(decoded)` 释放 ImageBitmap（V2 §5.4 ✅）。

线上验证建议（V2 §15）：浏览器 DevTools Network 用工具时无图片字节出站，仅点 Save 时才上传（`DEPLOYMENT.md` §13 已列入上线检查清单）。

---

## 5. 各模块现状

### 5.1 批量处理（V2 §5 Batch Workspace）—— 部分实现

已有：`ImageToolWorkspace` + `useImageToolWorkspace` hook 提供多文件、拖放、有界并发（`LIMITS.maxConcurrency=3`）、逐文件状态（pending/invalid/processing/done/error）、进度、单文件下载 + ZIP（fflate 动态加载）、资源释放、批量上限 20、单文件 25MB/40MP 限制。

**V2 §5.4 差距**：
- ❌ 无独立 `/batch-workspace` 路由（批量能力嵌在各工具内，单操作）。
- ❌ 无多步骤管线（Resize+Convert+Compress 链式）——仅单操作/批次。
- ❌ 无取消未开始任务、无尽力中断进行中任务。
- ❌ 无拖拽排序、无逐文件参数覆盖（仅统一参数）。
- ⚠️ 状态机 pending/processing/done/error ≠ V2 要求 Queued/Processing/Completed/Failed/Cancelled。
- ❌ 批量结果无"保存到云"入口（SaveToCloudButton 在 FileList 逐结果，未验证批量保存）。

### 5.2 认证 / 账户 / 云空间（V2 §12）—— 完整实现，超 V1.1

- 认证：注册/邮箱验证/登录/退出/忘记密码/重置密码/session，argon2id，限流（`lib/auth/rate-limit.ts`+测试），token 短时单次。
- 云存储：完整预签名直传流程（createUploadTask→PUT→completeUpload→head 校验真实大小），配额原子条件 UPDATE（`features/quota/quota.ts`，`used+reserved+new<=quota`，幂等 confirm/release，孤儿清理 `/api/cloud/storage/cleanup`），文件状态机 8 态，私有 Bucket，Key 服务端生成。
- 账户：`/account`、`/account/files`（缩略图+操作类型徽标）、`/account/storage`。
- 用户隔离：每个云文件 API 校验 `userId` 归属（IDOR 防护 ✅，见 `completeUpload` 中 `task.userId !== userId` 拒绝）。

**V2 §12 差距**：
- ❌ 无 ProcessingHistory 模型/路由（schema 无该表，V1.1 标 P1，未实现）。
- ❌ 无收藏常用工具、无自定义处理预设。
- ❌ 无本地历史 vs 云端历史区分。
- ❌ 无账户注销的数据删除/保留策略说明。
- ❌ 无 Plan/Entitlement/Usage 模型（schema 无 Plan 表，商业化预留未建）。

### 5.3 内容体系（V2 §8）—— 部分实现

- ✅ `/guides` + `/guides/[slug]`（SSG），12 篇图文长文，含 SVG 概念图（12 种 DiagramName）+ raster 演示图（`public/guides/`），`GuideBody` 渲染 heading/paragraph/list/callout/diagram/image 块。
- ✅ 每篇含 relatedToolSlugs 内链到工具。
- 分类：Formats/Compression/Resolution/Metadata/Editing/Color/Privacy（7 类，接近 V2 §8.1 的 8 类但无 "Website Image Optimization" / "Printing & DPI" 独立分类）。
- **差距**：
  - ❌ 无 Image Size Reference 中心（V2 §8.4）。
  - ❌ 无 Tutorials & Use Cases 独立区。
  - ⚠️ V2 §8.3 首批 12 选题仅覆盖约 3–4 篇（compress-without-losing-quality、jpg-vs-png-vs-webp[缺 AVIF]、ppi-dpi、resizing-vs-cropping、social aspect ratios[非 Instagram 专题]）；缺：Reduce to 100KB、Convert to PDF、Remove EXIF、300 DPI 专题、Instagram 尺寸、YouTube 缩略图、Optimize for Websites、Make Favicon、HEIC→JPG。
  - ⚠️ Guides 内容仅英文（`lib/data/guides.ts` 注释说明未来再迁移 i18n），页面 chrome 已本地化。

### 5.4 SEO（V2 §9）—— 基础扎实，结构化数据缺失

- ✅ `sitemap.ts`：tools + guides + 静态页，仅 canonical URL。
- ✅ `robots.ts`：disallow `/account /login /register /forgot-password /reset-password /verify-email /api/`。
- ✅ `layout.tsx` metadata：metadataBase、title template、OG、twitter、robots。
- ✅ 每页 `alternates: { canonical }`（首页/tools/各工具页）。
- ✅ 工具页 SEO 内容：`ToolSeoContent`（steps/useCases/knowledge/faq/related）+ `ToolDeepDive`（加厚内容，AdSense LVC 防御），9 语言 i18n。
- ✅ 内链：工具↔相关工具、guides↔tools。
- **差距**：
  - ❌ 无结构化数据 JSON-LD（FAQ/Article/BreadcrumbList/WebApplication）——V2 §9.2 要求。
  - ❌ 无面包屑导航组件。
  - ⚠️ 工具页为 `ƒ`(Dynamic) 而非静态——因 next-intl 动态 getTranslations；可优化为静态以利 SEO/性能（非阻塞）。

### 5.5 首页与导航（V2 §3）—— 部分

- 现首页：Hero（badge/title/subtitle/CTA/noSignup·noUpload·optionalCloud）+ All tools 网格 + AdSlot(home-mid) + Guides(最新 3 篇) + ValueProps(Local/NoSignup/OptionalCloud)。
- 导航：Tools/Guides/About/Contact + HeaderAuth + LanguageSwitcher，移动端折叠。
- **V2 §3 差距**：缺主搜索框、Browse by Category、Quick Workflows 入口、Batch Workspace 入口、Image Size Reference 入口、FAQ 区、Pricing/My Files（V2 导航项）。属 V2 Phase 4–6。

### 5.6 分析埋点（V2 §13）—— 仅脚本加载，无事件体系

- ✅ GA4/Sentry/AdSense 条件化加载（env 驱动，未配置零脚本）。
- ❌ 无 V2 §13.1 事件体系（tool_view/file_selected/processing_started/completed/failed/download_clicked/batch_*/workflow_*/cloud_save_*/signup_completed 等）。
- ❌ 无核心指标采集（仅靠 GA4 默认）。

### 5.7 广告（V2 §11）—— 合规实现

- ✅ `AdSlot` 仅置于内容区（tool SEO content top/bottom、home-mid），**绝不进入 ImageToolWorkspace**（拖放/处理/下载区无广告）。
- ✅ 标注 "Advertisement" + 虚线容器 + my-10 间距；静态 in-content，无弹窗/自动刷新。
- ✅ 未配置 `NEXT_PUBLIC_ADSENSE_CLIENT` 时渲染 null、零脚本（ADS.md 详述）。
- ✅ CSP 仅在配置时加入 AdSense 源。

### 5.8 安全（V2 §15）—— 强

- ✅ 文件签名/MIME/扩展交叉校验；私有 Bucket；Key 服务端生成；预签名 15 分钟；IDOR 校验；限流；argon2id；CSP/HSTS 等安全头；CORS 文档化。
- ⚠️ SVG 未支持上传（与 V1.1 一致，未来支持需加净化——V2 §15 已提）。
- ⚠️ 未读到 Cookie Secure/SameSite 显式确认（`lib/auth/cookies.ts` 待复核，生产 HTTPS 下应 Secure）。

---

## 6. 问题清单（按 P0/P1/P2 排序，含影响）

### P0（安全/合规，需立即处理）

| # | 问题 | 影响 | 建议 |
|---|---|---|---|
| P0-1 | `DEPLOYMENT.md` 历史曾含部分脱敏的真实生产凭证：R2 endpoint（含真实 Cloudflare account ID）、R2 Access Key ID 前缀、Secret 前缀、Resend key 前缀、Neon 连接串片段 | 凭证碎片曾泄露于 Git 历史；account ID 暴露；违反 AGENTS「Never commit secrets」 | ✅ 已从 DEPLOYMENT.md 移除真实片段为占位符；✅ 已用 `git filter-branch` 重写全部历史并 force-push（本地+远程零匹配，提交信息亦无残留）；负责人决定不轮换凭证（残留风险：若仓库曾被 fork/clone 或曾为公开，旧历史或留存他处） |
| P0-2 | V2 §9.2 结构化数据完全缺失（无 FAQ/Article/BreadcrumbList/WebApplication JSON-LD） | 富媒体结果机会丧失；面包屑缺失影响 SEO 与 SERP 体验 | Phase 1 补 JSON-LD（FAQPage 对应 ToolSeo faq、Article 对应 guides、BreadcrumbList 全站） |

### P1（产品完整性，V2 Phase 1–3）

| # | 问题 | 影响 | 建议 |
|---|---|---|---|
| P1-1 | 无 V2 事件埋点体系（§13.1 14+ 事件） | 无法统计 Tool Usage/成功率/下载转化/漏斗；运营复盘无数据 | Phase 1 建统一 `analytics` 适配层 + 事件触发点 |
| P1-2 | Batch Workspace 不满足 V2 §5：无多步管线、无取消、无拖拽排序、无逐文件参数覆盖、状态机不符、无独立路由 | V2 最重要升级能力缺失 | Phase 3 重构为独立 `/batch-workspace` + 多步管线引擎 |
| P1-3 | 无面包屑导航 | SEO/UX | Phase 1 加 Breadcrumb 组件 + JSON-LD |
| P1-4 | ProcessingHistory 未实现（V1.1 P1 遗留） | 无云端处理历史；V2 §12 要求本地/云端历史区分 | Phase 1/6 加 model + 路由 |
| P1-5 | 工具页为 Dynamic(ƒ) 而非 Static | SEO/首屏可优化 | 评估 next-intl 静态化或 generateStaticParams |
| P1-6 | 无 Quick Workflows（§6）+ Social Media Resizer（§7）+ 尺寸预设集中管理 | V2 Phase 4 核心缺失 | Phase 4 |
| P1-7 | Image Size Reference 中心缺失（§8.4） | 内容/SEO 缺口 | Phase 5 |

### P2（扩展与商业化，V2 Phase 2/5/6/7）

| # | 问题 | 影响 |
|---|---|---|
| P2-1 | V2 P0 新工具 6 个（EXIF Viewer/Remover、DPI、Favicon、Image to PDF、PDF to Image）未实现 | Phase 2 |
| P2-2 | V2 P1 工具（SVG/GIF/Color/HEIC/ICO/Base64/Collage/各平台 Maker）未实现 | Phase 2+ |
| P2-3 | 无 Plan/Entitlement/Usage/Subscription 模型（§10） | 商业化预留未建，Phase 6 |
| P2-4 | 无收藏工具/自定义预设（§12） | Phase 6 |
| P2-5 | 无 AI Provider Adapter/credits（§4.4） | Phase 7（需负责人确认付费） |
| P2-6 | Guides 内容仅英文；V2 §8.3 12 选题覆盖不全 | Phase 5 |
| P2-7 | 无账户注销数据策略说明（§12） | Phase 6 |

---

## 7. Phase 1 文件级实施计划（V2 §17 Phase 1：现有产品质量提升）

Phase 1 聚焦"现有 10 工具的体验统一、SEO 补齐、埋点、历史"，**不开发新工具**。建议拆为 4 个小步交付：

### 步骤 1.1 — 结构化数据 + 面包屑（对应 P0-2、P1-3）
- 新增 `components/layout/breadcrumbs.tsx`（通用面包屑 + BreadcrumbList JSON-LD）。
- 新增 `components/seo/json-ld.tsx`（FAQPage / Article / WebApplication JSON-LD 渲染器）。
- 修改 `components/tools/tool-seo-content.tsx`：注入 FAQPage JSON-LD（来自 seo.faq）+ WebApplication JSON-LD。
- 修改 `components/guides/guide-body.tsx` 或 `app/guides/[slug]/page.tsx`：注入 Article JSON-LD。
- 修改各工具页 `page.tsx`、`app/page.tsx`、`app/tools/page.tsx`：加面包屑。
- 测试：新增 `tests/seo/json-ld.test.ts` 校验结构化数据与页面内容一致。

### 步骤 1.2 — 分析事件埋点（对应 P1-1）
- 新增 `features/analytics/events.ts`（事件类型定义：tool_view/file_selected/processing_started/completed/failed/download_clicked/batch_* 等，属性 tool_id/category/file_count 区间/size 区间/format/duration bucket/error_code/device）。
- 新增 `lib/analytics/track.ts`（适配层：向 GA4 dataLayer push，env 未配置时 no-op；不上传图片内容/文件名/EXIF/GPS）。
- 修改 `components/tools/image-tool-workspace.tsx`、`hooks/use-image-tool-workspace.ts`、`components/upload/download-buttons.tsx`、`components/cloud/save-to-cloud-button.tsx`：埋点。
- 修改 `app/tools/[...]`、各工具 `page.tsx`：tool_view。
- 测试：`tests/analytics/events.test.ts` 校验事件 schema 与脱敏。

### 步骤 1.3 — 工具交互/状态/移动端/空状态统一与缺陷修复（V2 §17 Phase 1）✅ 已完成
- 审查 10 工具的大图处理、EXIF 方向、透明度、输出 MIME 一致性。✅ EXIF 已 honor（`imageOrientation: "from-image"` + fallback）；MIME/扩展名一致（`buildOutputFilename`）；limits 守护大图（25MB/40MP/20 文件）。**修复 5 处透明度缺陷**：rotate/compress/resize/meme/watermark 输出 JPEG 时未填白底 → PNG/WebP 透明区变黑（rotate 甚至注释声称填白但代码未填）。抽取纯函数 `backgroundForFormat(format, background?)` + 薄 canvas helper，统一全部 10 处理器；补 `canvas.test.ts`（4 测试）。
- 统一错误提示、空状态、禁用态文案（i18n）。✅ workspace hook 4 处 batchError + per-file 验证/像素错误全部 i18n（8 语言 en/zh/es/fr/ja/pt/ru/ar）；coded-error 重构（limits/validate 追加 `code`+`params`、decode 抛 `ProcessingError`、hook 按 `errors.${code}` 翻译、analytics error_code 用 code）；空状态/禁用态文案已一致（DropZone/FileList/DownloadButtons/ImageToolWorkspace 均 useTranslations）。**遗留**：canvas 2 处罕见技术异常（2D context / encode 失败，`err.message` 英文）+ 云上传服务端错误（upload.ts，英文）——非本地工具主路径，后续按 coded-error 模式处理。
- 复核 `lib/auth/cookies.ts`。✅ HttpOnly + SameSite=Lax + Secure(`NODE_ENV==="production"`) + path="/" + maxAge，设置正确无需改动。

### 步骤 1.4 — 处理历史基础（对应 P1-4，可选并入 Phase 1）
- `prisma/schema.prisma` 加 `ProcessingHistory` 模型（user_id/tool_type/input/output metadata/parameters/created_at，不存二进制/EXIF）。
- `features/history/` 实现 + `/api/history` 路由 + `/account/history` 页（区分本地历史[localStorage] 与云端历史）。
- 迁移：`prisma db push`（需负责人确认动 Neon schema）。

**每步结束**：跑 `pnpm typecheck && pnpm lint && pnpm test && pnpm build` 并按 V2 §20 报告。

---

## 8. 风险与需负责人决策

| 事项 | 说明 | 需决策 |
|---|---|---|
| DEPLOYMENT.md 凭证泄露（P0-1） | 真实凭证片段曾在 Git 历史 | ✅ 已清理 Git 历史（filter-branch 重写 + force-push）；负责人决定不轮换凭证 |
| 生产已用真实云服务 | R2/Neon/Resend 已开通运行 | V2 Phase 0 假设"未配置"已不成立；后续阶段可直接对接，但成本已产生 |
| next-intl 9 语言 | V2 未明确要求多语言，但已实现且增加维护成本 | 是否保留全 9 语言？或收敛到 en + 少量？ |
| 工具页 Dynamic vs Static | 影响 SEO/性能 | 是否优先静态化（Phase 1）？ |
| ProcessingHistory 改 Neon schema | 需 `db push` 到生产 DB | 是否授权改生产 schema？ |
| AI / 付费 / AdSense / 支付 | V2 §22 待确认 | 维持 Disabled/Mock，不接入 |

---

## 9. Phase 0 验收对照（V2 §17）

- ✅ 检查仓库结构、技术栈、依赖、构建、部署方式（§1）。
- ✅ 核实线上页面路由与现有工具（线上实访 + §3 盘点表）。
- ✅ 建立工具盘点表（已完成/部分/未实现/无法验证，§3）。
- ✅ 逐工具验证本地处理、识别上传行为（§4，唯一上传路径为云保存直传）。
- ✅ 检查首页/工具页/内容页/法律页/移动端/SEO（§5）。
- ✅ 检查批量/云空间/账户/分析埋点现状（§5）。
- ✅ 输出 P0/P1/P2 问题清单与影响（§6）。
- ✅ 给出 Phase 1 文件级实施计划（§7）。
- ✅ 未重写架构、未删功能、未创建云资源、未接付费服务。

**Phase 0 完成，停止开发，等待负责人确认后再进入 Phase 1。**
