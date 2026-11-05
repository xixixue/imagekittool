# ImageKitTools --- 产品需求与技术规格说明（SPEC）

-   版本：V1.1
-   状态：MVP 开发基线
-   产品：面向全球英语用户的在线图片处理工具网站
-   目标：通过高质量免费工具获取自然搜索流量，后续以 Google AdSense
    实现收入
-   项目性质：个人独立项目，不属于公司/CAD业务

> 本文件作为 Codex 的产品需求和技术实现基线。MVP
> 优先保证核心工具质量、隐私和低运维成本，不追求一次性做大而全。

## 0. Codex 执行原则

1.  先检查仓库现状，再制定实施计划；不要假设仓库为空。
2.  严格按 Phase 0--5 顺序开发，不要一次性实现全部功能。
3.  不擅自改变第 2 章的四项核心设计决策。
4.  不接入未获批准的付费服务，不创建真实云资源，不编造密钥、域名或账号。
5.  每个阶段结束运行 lint、typecheck、tests、build，并报告结果。
6.  新增依赖前说明用途、包体积、许可证和维护情况。
7.  不引入微服务、Kafka、Redis、Kubernetes 等非必要基础设施。
8.  本地图片处理不得偷偷上传图片；云端保存必须由用户明确触发。
9.  所有云文件 API 必须校验用户身份和文件归属。
10. 不复用雇主的私有代码、数据、账号、商标或商业资料；本项目不开发 CAD
    功能。

Codex 首轮只执行仓库审查和 Phase 0
项目骨架，不要越级开发认证、云存储或全部工具。

# 1. 产品概述

## 1.1 产品定位

ImageKitTools
是一个面向全球英语用户的在线图片处理平台，提供图片压缩、尺寸调整、格式转换、裁剪、指定
KB 压缩等工具。

产品定位不是简单的"图片压缩页面集合"，而是：

**支持浏览器本地处理，并提供可选个人云文件管理能力的在线图片工具平台。**

核心价值： - 无需注册，打开即用。 -
图片默认在浏览器本地处理，降低隐私顾虑和服务器成本。 -
支持常见格式、批量操作和明确的使用场景。 -
登录用户可主动保存原始文件和处理结果到个人云空间。 -
工具页面兼顾易用性、搜索引擎可索引内容和广告变现。

## 1.2 目标用户

普通图片使用者、内容创作者、电商卖家、社交媒体运营者，以及需要在不同设备间管理图片文件的注册用户。

## 1.3 业务目标

MVP： - 完成 5 个核心图片工具。 - 游客无需登录即可处理和下载。 -
完成注册、登录和个人云空间基础能力。 - 建立高质量工具页 SEO 内容结构。 -
为后续 AdSense 申请准备原创内容、隐私政策和清晰导航。

中长期： - 扩展更多图片工具和场景模板。 - 提升自然搜索流量和回访率。 -
基于真实成本与用户行为评估付费存储。

## 1.4 MVP 不做

-   CAD、3D、视频、音频处理。
-   Photoshop 级专业编辑器。
-   社区、评论、关注、团队协作。
-   强制登录或强制云端处理。
-   文件分享链接和公开图库。
-   复杂订阅支付。
-   微服务和复杂分布式任务调度。
-   无独立价值的大规模程序化 SEO 页面。

# 2. 四项核心设计决策（必须遵守）

## 决策一：Local First ------ 默认浏览器本地处理

-   图片由浏览器读取，通过浏览器图像能力完成压缩、缩放、裁剪和格式转换。
-   默认不上传图片到业务服务器或对象存储。
-   下载结果直接从浏览器生成的 Blob 下载。
-   不得以性能优化为由擅自改成后端处理。
-   如某项功能确实需要云端处理，必须独立说明原因、数据流、成本和隐私影响，并在上传前明确告知。
-   "本地处理"指图片内容不上传，不代表网页脚本、字体、统计等完全离线。

## 决策二：Guest First ------ 游客无需注册即可使用核心工具

-   首次访问即可选择图片并处理。
-   5 个核心工具不要求注册或登录。
-   游客可以下载处理结果。
-   游客不能使用个人云空间、云文件列表和跨设备同步。
-   用户点击云端保存时才引导注册或登录。
-   不得在首次访问时用登录弹窗阻断核心操作。
-   登录态过期不影响浏览器本地处理；保存云端时再要求重新认证。

## 决策三：Cloud Optional ------ 云空间可选，原图和结果图分别授权保存

-   登录用户仍可完全使用本地处理。
-   云存储不是图片处理必经步骤。
-   处理完成后分别提供"Save original to cloud"和"Save processed image to
    cloud"。
-   默认不保存原图或结果图，必须由用户主动选择。
-   用户可只保存原图、只保存结果图或两者都保存。
-   用户可从云空间下载文件到本地，再进行浏览器本地处理。
-   云文件默认私有，仅文件所有者可访问。
-   用户可以查看、下载、删除自己的云文件。

## 决策四：模块化单体 + 浏览器直传对象存储

-   MVP 使用模块化单体，不拆微服务。
-   图片处理在浏览器；后端只负责认证、元数据、配额、上传授权、上传确认、下载授权和历史记录。
-   上传流程：后端签发短时预签名 URL → 浏览器直传对象存储 →
    后端校验并确认登记。
-   下载流程：后端鉴权 → 签发短时下载 URL → 浏览器下载。
-   Bucket 必须私有，禁止公开读写。
-   对象 Key 由服务端生成，前端不得自行指定任意对象 Key。
-   数据库保存元数据和配额，对象存储保存文件内容。
-   使用 S3 兼容存储适配层，降低供应商绑定。
-   不通过业务 API 中转图片二进制，避免应用服务器带宽和内存成为瓶颈。

# 3. 信息架构与页面

  -----------------------------------------------------------------------------------------------
  页面                    路径                                            优先级
  ----------------------- ----------------------------------------------- -----------------------
  首页                    `/`                                             P0

  工具目录                `/tools`                                        P0

  Image Compressor        `/image-compressor`                             P0

  Image Resizer           `/image-resizer`                                P0

  Image Converter         `/image-converter`                              P0

  Image Cropper           `/image-cropper`                                P0

  Compress Image to KB    `/compress-image-to-kb`                         P0

  About / Contact         `/about`、`/contact`                            P0

  Privacy / Terms /       `/privacy-policy`、`/terms`、`/cookie-policy`   P0
  Cookie                                                                  

  Login / Register /      `/login`、`/register`、`/forgot-password`       P0
  Forgot Password                                                         

  Account                 `/account`                                      P0

  Cloud Files             `/account/files`                                P0

  Storage Usage           `/account/storage`                              P0

  Processing History      `/account/history`                              P1

  Social Media Image      `/social-media-image-resizer`                   P1
  Resizer                                                                 

  Favicon Generator       `/favicon-generator`                            P1

  Image to Base64         `/image-to-base64`                              P1

  HEIC to JPG             `/heic-to-jpg`                                  P1
  -----------------------------------------------------------------------------------------------

界面、URL、页面标题、按钮、错误提示和邮件默认使用自然英文；代码、数据库字段和注释使用英文。MVP
不实现多语言切换，但结构应可扩展。

# 4. 核心工具需求

## 4.1 Image Compressor（P0）

用户流程：选择/拖拽图片 → 预览 → 选择压缩质量 → 本地处理 →
查看前后大小和节省比例 → 下载 → 可选保存原图/结果图到云端。

要求： - 支持 JPG/JPEG、PNG、WebP。 - 支持批量处理、单文件下载和 ZIP
下载。 - JPG/WebP 提供质量参数。 - PNG 不得把有损转换伪装成无损压缩。 -
单文件失败不影响其他文件。 - 不覆盖原始文件。

## 4.2 Image Resizer（P0）

-   设置宽度、高度，支持锁定宽高比。
-   支持百分比缩放和常见尺寸预设。
-   支持批量处理。
-   显示处理前后尺寸。
-   对超出浏览器能力的图片给出提示。

## 4.3 Image Converter（P0）

首批支持 JPG/JPEG、PNG、WebP。 - 可选择输出格式。 - PNG/WebP 转 JPG
时透明区域需填充用户指定或明确默认背景色。 - 显示转换前后格式和大小。 -
支持批量转换和 ZIP。 - 输出扩展名必须与真实 MIME 一致。 - 后续再评估
AVIF、HEIC/HEIF、GIF、TIFF；GIF
若只处理首帧必须明确告知，不承诺保留动画。

## 4.4 Image Cropper（P0）

-   支持鼠标和触控拖拽。
-   自由比例及 1:1、4:3、3:2、16:9 预设。
-   支持预览、重置、至少 90° 步进旋转。
-   支持输出格式选择。
-   移动端可用。

## 4.5 Compress Image to KB（P0，差异化重点）

-   目标大小支持 50 KB、100 KB、200 KB、500 KB、1 MB
    等快捷选项，也允许自定义。
-   通过有界搜索寻找质量参数，尽量逼近目标大小。
-   设置最大迭代次数和时间预算，禁止无限循环。
-   无法达标时返回最接近结果并明确说明。
-   不承诺所有图片都能以可接受画质达到任意目标大小。
-   透明度可能丢失时必须提示。

# 5. 图片处理技术要求

-   优先使用 File、Blob、createImageBitmap、Canvas；按需使用
    OffscreenCanvas，并检测浏览器支持。
-   处理逻辑与 UI 分离，集中在 `features/image-processing`。
-   大图处理需限制像素数、控制并发、释放 ImageBitmap、Object URL
    和临时资源。
-   建议初始限制：单文件 25 MB、单批最多 20 个文件、单图最大约 40
    MP；全部配置化，测试后可调整。
-   校验扩展名、声明 MIME 和文件实际内容/解码结果。
-   MVP 默认不支持 SVG 上传和云存储；若未来支持，必须做安全净化。
-   测试手机照片 EXIF Orientation，避免方向错误。
-   明确 EXIF 元数据策略，默认不复制 GPS 等不必要隐私元数据。
-   测试 ICC 色彩配置文件可能造成的色差。
-   对 HEIC/AVIF 使用能力检测，不按浏览器名称简单推断。
-   支持最新两个主要版本 Chrome、Edge、Firefox、Safari；优先保障桌面
    Chrome/Edge 和移动 Safari/Chrome。
-   大图批处理使用有限并发，避免同时解码过多图片。

# 6. 用户体系

## 6.1 P0 能力

-   邮箱注册、邮箱验证。
-   邮箱+密码登录、退出。
-   忘记密码、重置密码。
-   用户中心和账号基本信息。

## 6.2 权限矩阵

  能力                     游客   登录用户
  ---------------------- ------ ----------
  使用核心工具               是         是
  本地处理                   是         是
  下载结果                   是         是
  批量处理                   是         是
  保存原图到云端             否         是
  保存结果到云端             否         是
  查看/下载/删除云文件       否         是
  查看处理历史               否         P1

## 6.3 认证安全

-   使用成熟认证方案，不自行设计密码算法。
-   密码使用 Argon2id 或经安全评估的强哈希方案。
-   注册、登录、忘记密码接口限流。
-   邮箱验证和重置 Token 随机、短时、单次使用。
-   Cookie 设置 HttpOnly、生产环境 Secure、合理 SameSite。
-   敏感操作要求重新验证身份。
-   日志不得输出密码、Token、预签名 URL。

# 7. 个人云空间

## 7.1 配额

建议免费注册用户初始 1 GB，配额配置化。未来可评估 10 GB、50 GB
等套餐，但 MVP 不接支付。应预留套餐模型。

## 7.2 存储要求

建议 Cloudflare R2 或其他 S3 兼容对象存储： - Bucket 私有。 - 对象 Key
由服务端生成随机值。 - 数据库保存原始文件名、Key、MIME、字节数、用户 ID
等。 - 通过 Storage Adapter 封装供应商 SDK。 - 密钥只存在服务端。 -
不公开 Bucket。

## 7.3 上传流程

1.  用户主动点击保存原图或结果图。
2.  前端请求后端创建上传任务。
3.  后端校验身份、配额、大小和文件类型。
4.  后端生成随机对象 Key 并预留容量。
5.  后端返回短时预签名 PUT URL 和必要请求头。
6.  浏览器直接上传对象存储。
7.  前端通知后端上传完成。
8.  后端检查对象是否存在，并核对实际大小、类型及可用校验信息。
9.  后端将状态置为 READY，确认配额占用。
10. 前端刷新云文件列表。

失败处理： - 上传失败：任务置失败，释放预留容量。 -
用户关闭页面：预留任务必须设置过期时间并可清理。 -
对象上传成功但确认失败：允许幂等重试，配备孤儿对象清理。 -
不得仅信任前端传入的大小或成功标识。 - 评估预签名 URL
重复使用/泄漏风险，采用短有效期、唯一 Key、任务状态和完成校验。 - CORS
仅允许正式站点所需 Origin、方法和请求头。 - 实测
Content-Type、实际对象大小、ETag/校验字段的供应商差异。

## 7.4 下载和删除

下载： 1. 后端鉴权并验证文件归属。 2. 签发短时预签名 GET URL。 3.
浏览器下载。

删除： 1. 验证文件归属。 2. 标记删除中或创建删除任务。 3.
删除对象存储文件。 4. 成功后更新数据库并释放配额。 5.
失败时保留可重试状态，不能提前释放配额。 6. 定期清理孤儿对象和异常记录。

## 7.5 配额一致性

并发上传必须避免超额。建议数据库事务/行锁或原子条件更新：
`used_bytes + reserved_bytes + new_file_size <= quota_bytes`

-   创建上传任务时增加 reserved_bytes。
-   成功确认后 reserved 转为 used。
-   失败或过期释放 reserved。
-   删除成功后减少 used。
-   所有操作幂等。
-   定期对账修复数据库和对象存储不一致。

## 7.6 文件状态

`PENDING_UPLOAD`、`UPLOADING`、`VERIFYING`、`READY`、`FAILED`、`DELETING`、`DELETED`、`EXPIRED`。状态转换由服务端控制。

MVP 不支持嵌套文件夹、分享链接、团队共享和公开访问。

# 8. 处理历史（P1）

建议保存用户
ID、工具类型、输入/输出大小和格式、参数摘要、处理时间、原图/结果云文件关联
ID。默认不保存图片二进制和 EXIF 隐私元数据。用户可清除历史。

# 9. 技术架构

## 9.1 技术栈建议

  层次       选择
  ---------- ----------------------------------------
  Web        Next.js App Router
  语言       TypeScript
  UI         Tailwind CSS + shadcn/ui
  状态       Zustand（确有跨组件状态时使用）
  表单       React Hook Form + Zod
  API        Next.js Route Handlers
  DB         PostgreSQL
  ORM        Prisma
  认证       Auth.js 或经评估的成熟认证方案
  对象存储   Cloudflare R2 / S3 兼容
  邮件       Resend 或 SMTP
  监控       Sentry
  分析       GA4
  SEO        Metadata、sitemap、robots
  部署       与 Next.js Node Runtime 兼容的托管环境

约束： - MVP 不拆微服务。 - 不引入 Kafka、Redis、Kubernetes。 - 若使用
Cloudflare Workers/Pages，必须先验证 Next.js、Prisma、认证和 SDK
的运行时兼容性；不得假设 Node API 可在 Edge Runtime 运行。 -
核心本地工具在没有云存储配置时仍可运行。 -
数据库、对象存储、邮件通过配置接入。

## 9.2 逻辑架构

``` text
Browser
 ├─ SEO / Marketing Pages
 ├─ Image Tool UI
 │   ├─ File Reader
 │   ├─ Local Image Processor
 │   ├─ Preview / Download / ZIP
 │   └─ Optional Cloud Save
 └─ Account UI
     ├─ Auth
     ├─ Cloud File Manager
     └─ Storage Usage
          |
          v
Next.js Modular Monolith API
 ├─ Auth Module
 ├─ User Module
 ├─ Storage Metadata Module
 ├─ Upload Task Module
 ├─ Quota Module
 ├─ History Module
 └─ Storage Adapter
       ├─ PostgreSQL
       └─ Private S3-compatible Object Storage

Browser ── short-lived presigned URL ──> Object Storage
```

## 9.3 目录结构建议

``` text
imagekittools/
├── app/
│   ├── (marketing)/
│   ├── (tools)/
│   ├── (auth)/
│   ├── account/
│   └── api/
├── components/
│   ├── layout/
│   ├── tools/
│   ├── upload/
│   ├── cloud/
│   └── ui/
├── features/
│   ├── image-processing/
│   ├── auth/
│   ├── cloud-storage/
│   ├── quota/
│   └── history/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── storage/
│   ├── validation/
│   └── config/
├── prisma/
├── public/
├── tests/
├── docs/
├── AGENTS.md
├── .env.example
└── README.md
```

# 10. 数据库设计建议

具体字段可按认证框架调整，但必须保证用户隔离、配额一致性、上传幂等和状态可追踪。

## users

-   `id` UUID 主键
-   `email` 唯一
-   `password_hash`（仅自行管理密码时）
-   `email_verified_at`
-   `status`
-   `created_at`、`updated_at`

按认证方案需要增加 Account、Session、VerificationToken 等表。

## storage_files

-   `id` UUID
-   `user_id`
-   `object_key` 唯一
-   `original_name`
-   `mime_type`
-   `extension`
-   `size_bytes`
-   `category`：ORIGINAL / PROCESSED / OTHER
-   `status`
-   `checksum` 可选
-   `created_at`、`updated_at`、`deleted_at`

## upload_tasks

-   `id`
-   `user_id`
-   `file_id`
-   `object_key`
-   `expected_size_bytes`
-   `reserved_bytes`
-   `status`
-   `expires_at`
-   `idempotency_key`
-   `created_at`、`updated_at`

## user_storage_quotas

-   `user_id`
-   `quota_bytes`
-   `used_bytes`
-   `reserved_bytes`
-   `updated_at`

## processing_history（P1）

-   `id`
-   `user_id`
-   `tool_type`
-   `input_metadata` JSONB
-   `output_metadata` JSONB
-   `parameters` JSONB
-   `original_file_id` 可空
-   `result_file_id` 可空
-   `created_at`

## plans（预留）

`id`、`name`、`quota_bytes`、`status`、时间字段。MVP 仅免费套餐。

# 11. API 建议

具体认证路径可按选用的认证框架调整。

``` text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/session

GET    /api/cloud/files
GET    /api/cloud/files/:id
DELETE /api/cloud/files/:id
POST   /api/cloud/files/:id/download-url

POST /api/cloud/uploads
POST /api/cloud/uploads/:id/complete
POST /api/cloud/uploads/:id/fail

GET /api/cloud/storage/usage

GET    /api/history
GET    /api/history/:id
DELETE /api/history/:id
DELETE /api/history
```

上传创建请求示例：

``` json
{
  "fileName": "photo.webp",
  "mimeType": "image/webp",
  "sizeBytes": 245678,
  "category": "PROCESSED"
}
```

配额响应示例：

``` json
{
  "quotaBytes": 1073741824,
  "usedBytes": 123456789,
  "reservedBytes": 0,
  "availableBytes": 946118035
}
```

所有 API
统一错误结构；服务端验证用户资源归属；上传确认、删除和配额操作必须幂等。

# 12. 安全、隐私与合规

-   HTTPS、安全 Cookie、CSRF 防护、XSS 防护、参数化数据库访问。
-   注册/登录/重置密码和上传接口限流。
-   对象存储 Bucket 私有，预签名 URL 短时有效。
-   用户只能访问自己的文件。
-   文件大小、像素、MIME 和真实格式校验。
-   对象 Key 由服务端生成。
-   不记录密码、Token、预签名 URL 和图片内容。
-   不把 `.env` 提交 Git。
-   本地处理时图片二进制不得发往业务后端或对象存储。
-   用户主动云端保存时明确告知上传行为。
-   不将图片用于未告知用途。
-   隐私政策描述实际发生的数据收集、Cookie、分析脚本和删除策略。
-   用户删除云文件时，按定义删除对象和元数据。
-   用户删除账号时，制定文件、历史、认证数据和备份的删除策略。

# 13. SEO 与内容

每个工具页不能只有上传框。建议页面结构： 1. H1 工具名称与用途。 2.
简短价值说明。 3. 工具交互区。 4. 操作步骤。 5. 参数说明。 6. 使用场景。
7. 格式/尺寸知识。 8. FAQ。 9. 相关工具内链。 10. 隐私与本地处理说明。

技术要求： - 独立 Title、Meta Description。 - 正确 H1/H2。 -
Canonical、sitemap.xml、robots.txt。 - Open Graph、图片 Alt。 -
结构化数据仅在真实符合时使用。 - 关注 Core Web Vitals。 -
避免重复、薄内容和关键词堆砌。

内容选题示例： - How to compress an image to 100KB - How to resize an
image without losing quality - JPG vs PNG vs WebP - Best image size for
email attachments - How to convert PNG to JPG - How to reduce image file
size for a website

文章必须有真实步骤、信息或示例，不能只为关键词堆字。

# 14. UI/UX 与广告

视觉方向：简洁、现代、可信、轻量、以工具操作为中心，桌面和移动端都可用。

首页建议：Hero、工具入口、Popular
Tools、工具分类、产品优势、使用步骤、隐私说明、指南文章、Footer。

工具区：拖拽上传、选择文件、文件列表、预览、参数、主操作、处理状态、结果预览、下载、登录用户云保存入口。

广告要求： - 不得伪装成下载/处理按钮。 - 不遮挡上传、预览和主要操作。 -
不诱导误点击。 - 与工具操作区清晰分隔。 -
广告脚本失败不得影响核心工具。 - 以 Google AdSense
最新政策和实际审核要求为准。

# 15. 性能与监控

-   首页和工具页的静态内容优先服务端渲染。
-   图片处理代码按需加载。
-   不让大型图像库进入首页首屏包。
-   批量处理有限并发。
-   监控前端错误、API
    错误率/延迟、注册登录成功率、上传成功率、存储容量/费用、图片处理失败率和页面性能。
-   不向监控平台上传用户图片。

# 16. 环境变量

提供 `.env.example`，只列变量名和用途，不含真实密钥：

``` dotenv
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=
AUTH_SECRET=
EMAIL_FROM=
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
SENTRY_DSN=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

`NEXT_PUBLIC_`
变量不得包含密钥。缺少对象存储配置时，核心本地工具仍可使用，云空间功能显示不可用而不是导致网站启动失败。

# 17. 开发阶段

## Phase 0：项目骨架

-   Next.js + TypeScript 初始化。
-   Tailwind 和基础 UI。
-   目录结构。
-   lint、format、typecheck、build。
-   `.env.example`、README、AGENTS.md。
-   首页、导航和 SEO 基础配置。

验收：本地可启动，类型检查和生产构建通过。

## Phase 1：游客本地工具

-   上传/拖拽、文件列表、预览。
-   图片处理抽象层。
-   五个 P0 工具。
-   批量处理、下载、ZIP。
-   错误处理、大小限制、移动端适配。

验收：未登录完成全部 P0
流程；常见格式和边界情况测试通过；网络检查确认图片内容没有上传。

## Phase 2：用户体系

-   注册、登录、退出、邮箱验证、忘记密码。
-   用户中心和权限控制。

验收：认证完整；游客不能调用云空间 API；本地工具不受登录状态影响。

## Phase 3：个人云空间

-   Storage Adapter、配额、元数据、上传任务。
-   预签名直传、上传确认、文件列表、下载、删除。
-   失败恢复、过期任务清理、孤儿对象清理。

验收：原图和结果图分别保存；用户严格隔离；并发不超配额；失败可恢复；Bucket
私有。

## Phase 4：SEO 与上线

-   工具页原创内容。
-   About、Contact、Privacy、Terms、Cookie。
-   sitemap、robots、canonical。
-   GA4、GSC、Sentry。
-   性能、安全和部署检查。

验收：可索引、隐私描述与实际数据流一致、核心工具稳定。

## Phase 5：增长与扩展

-   处理历史。
-   社交媒体尺寸工具。
-   Favicon Generator。
-   Image to Base64。
-   HEIC to JPG（能力验证后）。
-   更多格式、批量能力。
-   基于真实流量和成本评估付费存储。

# 18. 验收清单

## 图片处理

-   [ ] JPG、PNG、WebP 正常处理。
-   [ ] 单张和批量处理正常。
-   [ ] 超限文件和伪装文件被拒绝。
-   [ ] 输出扩展名与实际 MIME 一致。
-   [ ] 透明 PNG 转 JPG 背景正确。
-   [ ] 手机照片 EXIF 方向正确。
-   [ ] 目标 KB 算法有迭代上限。
-   [ ] 无法达标时提示准确。
-   [ ] 大图不会导致无限内存占用或页面永久卡死。

## 游客体验

-   [ ] 未登录可使用所有 P0 工具。
-   [ ] 未登录可下载结果。
-   [ ] 首次访问不弹登录墙。
-   [ ] 仅点击云端保存时引导登录。

## 用户体系

-   [ ] 注册、邮箱验证、登录、退出正常。
-   [ ] 忘记密码和重置密码正常。
-   [ ] 登录接口限流。
-   [ ] 过期登录态处理正确。

## 云空间

-   [ ] 原图和结果图可分别选择保存。
-   [ ] 未选择保存时不发生云端上传。
-   [ ] 使用预签名 URL 浏览器直传。
-   [ ] Bucket 私有。
-   [ ] 用户 A 无法读取、下载或删除用户 B 的文件。
-   [ ] 服务端核对对象实际大小和状态。
-   [ ] 上传失败释放预留容量。
-   [ ] 删除成功后配额正确减少。
-   [ ] 并发上传不超额。
-   [ ] 重复请求不会重复扣减/释放配额。
-   [ ] 对象存储异常有恢复机制。

## SEO 与隐私

-   [ ] 每个工具页有独立标题和描述。
-   [ ] sitemap、robots 正常。
-   [ ] 工具页有实质性说明。
-   [ ] 广告不遮挡核心操作。
-   [ ] 本地处理时图片内容未上传。
-   [ ] 隐私政策与实际数据流一致。

# 19. 风险清单

  风险                     应对
  ------------------------ --------------------------------
  浏览器大图内存不足       像素限制、有限并发、释放资源
  EXIF 方向异常            用真实手机照片测试
  PNG 压缩效果有限         明确无损/有损策略，评估专用库
  HEIC 支持不一致          后置实现，运行时检测
  预签名 URL 泄漏          短时效、唯一 Key、私有 Bucket
  配额并发竞争             事务/原子更新、预留容量
  上传成功但数据库未确认   幂等确认、对账、孤儿清理
  对象存储出口费用         监控下载量和费用，设置配额
  SEO 内容薄弱             每页提供独立价值，控制页面数量
  广告损害体验             与核心交互区隔离

# 20. MVP 成功标准

1.  游客无需登录使用 5 个 P0 工具。
2.  图片默认在浏览器本地处理。
3.  支持批量处理和下载。
4.  用户可注册、登录和验证邮箱。
5.  用户主动选择保存原图或结果图。
6.  用户可查看、下载、删除自己的云文件。
7.  配额准确，上传失败和删除失败可恢复。
8.  对象存储私有，用户数据严格隔离。
9.  工具页有可索引的实质内容。
10. 隐私政策、条款、联系页面和监控齐备。
11. 生产构建、核心测试和安全检查通过。

# 21. AGENTS.md 必须包含的规则

-   本 SPEC 是产品需求基线。
-   修改前先理解仓库结构。
-   不擅自改变四项核心设计决策。
-   图片默认本地处理，未经用户授权不得上传。
-   游客核心功能不可被登录墙阻断。
-   云文件必须显式授权保存。
-   所有云文件 API 验证用户归属。
-   对象存储 Bucket 必须私有。
-   不提交密钥和 `.env`。
-   业务逻辑、UI、存储适配层分离。
-   图片处理算法必须有测试。
-   每次变更后运行 lint、typecheck、tests、build。
-   新依赖需说明用途、体积、许可证和维护状态。
-   不引入不必要的微服务和基础设施。
-   未经确认不接入付费服务或产生不可控费用。

每阶段结束必须报告：完成内容、变更文件、关键实现、测试命令与结果、未完成事项、风险及需负责人决策的问题。

# 22. 待负责人提供的配置

Codex 不得编造以下信息： - 正式域名。 - 数据库连接串。 -
对象存储账号、Bucket、访问密钥。 - 邮件服务账号和发件域名。 -
GA4/GSC/Sentry 配置。 - 正式部署平台和环境变量。

开发阶段可用本地环境和 Mock Storage Adapter 完成不依赖云服务的功能。

# 23. Codex 首条执行指令

请完整阅读仓库根目录 `SPEC.md` 和
`AGENTS.md`（若不存在，先按本文件创建初版）。

第一步只做仓库审查和 Phase 0：

1.  检查仓库文件、依赖和运行环境。
2.  对照 SPEC 输出现状和差距。
3.  给出 Phase 0 文件级实施计划。
4.  标记需负责人确认的技术选型和外部服务。
5.  初始化/整理 Next.js + TypeScript 项目骨架。
6.  建立基础布局、导航、首页占位和 SEO 配置。
7.  创建 `.env.example`、README、AGENTS.md。
8.  配置 lint、format、typecheck、build。
9.  执行检查并修复错误。

不要在 Phase 0
实现完整认证、对象存储上传或全部图片工具。完成后汇报结果，等待进入 Phase
1。
