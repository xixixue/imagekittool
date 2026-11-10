# ImageKitTools — 产品升级需求与技术实施规格（SPEC）

- 版本：V2.0
- 状态：长期运营升级规划 / Codex 实施基线
- 产品：https://www.imagekittool.com/
- 用户：全球英语用户
- 定位：Local-first、privacy-focused 的一站式图片处理与图片工作流平台
- 商业模式：免费工具 + Google AdSense + 后续 Pro 会员 + 可选云空间与 AI 额度
- 项目性质：个人独立项目，与雇主业务、代码、数据及知识产权隔离

> 本文件在 V1.1 基础上升级。V1.1 的四项核心决策继续有效。本文件定义产品方向、功能边界、优先级、验收标准和分阶段实施计划，不要求一次性开发全部功能。Codex 必须先审查线上/仓库现状，复用已完成能力，避免重复开发或破坏现有功能。

---

# 0. Codex 执行总则

1. 开始前完整阅读本文件、原有 `SPEC.md` 和 `AGENTS.md`，检查分支、依赖、数据库、部署方式和已实现功能。
2. 不得假设网站当前功能与本 SPEC 完全一致。先输出现状盘点、差距清单、风险和分阶段实施计划。
3. 不得重写已稳定运行的模块；优先增量改造，保持现有 URL、SEO 权重、数据库兼容性和用户数据。
4. 严格遵守第 1 章四项核心产品决策。
5. 不得擅自创建云资源、购买服务、开通付费 API、绑定支付渠道或产生不可控费用。
6. 不得编造正式环境变量、密钥、域名、第三方账号或服务配置。使用 `.env.example` 和 Mock Adapter。
7. 未经负责人确认，不上线需要付费推理的 AI 功能，不承诺无限量使用。
8. 新增依赖前说明用途、体积、许可证、维护状态、浏览器兼容性及对首屏性能的影响。
9. 每个阶段完成后执行 lint、typecheck、unit tests、e2e（如已配置）、build，并报告结果。
10. 每阶段结束报告：完成内容、变更文件、关键实现、测试命令与结果、未完成事项、风险及需负责人决策的问题。
11. 用户可见文案默认使用自然、简洁的英文；开发沟通可使用中文。
12. 不得为了 SEO 创建大量内容重复、仅替换关键词或没有实际功能价值的页面。
13. 不得复用雇主私有代码、数据、商标、账号、商业资料或未授权素材。

# 1. 不可变更的核心产品决策

## 1.1 Local First
- 图片默认在用户浏览器本地处理。
- 本地处理时，图片二进制不得上传后端、对象存储或第三方服务。
- 需要云端 AI 处理时，必须明确展示上传提示、用途和数据处理说明，并由用户主动确认。
- “本地处理”不等于整个网站完全离线；页面资源、分析事件等仍按各自隐私政策处理。
- 不得在后台静默上传原图、缩略图或处理结果。

## 1.2 Guest First
- 游客无需注册即可使用所有基础 P0 工具。
- 游客可以完成处理、预览和下载。
- 不得在上传、处理或下载基础流程中强制登录。
- 只有云端保存、跨设备同步、会员权益等需要账户的操作才提示登录。

## 1.3 Cloud Optional
- 云空间是可选能力，不是基础工具运行前提。
- 用户必须分别主动选择是否保存原图、处理结果。
- 默认不保存、不上传。
- 用户可查看、下载、删除自己的云端文件。
- 云存储容量、对象存储流量及保留策略必须可配置、可监控。

## 1.4 模块化单体 + 浏览器直传对象存储
- 早期保持模块化单体，不拆微服务。
- 图片处理优先在浏览器执行。
- 后端负责认证、元数据、配额、签名 URL、上传确认、订阅权益、额度和管理功能。
- 浏览器通过短时预签名 URL 直接上传私有 S3 兼容对象存储；业务 API 不代理图片二进制。
- 不引入 Kafka、Redis、Kubernetes 等非必要基础设施。

# 2. 产品定位与目标

## 2.1 产品定位
ImageKitTools 不应只是“在线图片工具目录”，而应成为：

**A complete, privacy-focused image toolkit for editing, optimizing, converting, and preparing images for the web and social media.**

围绕图片编辑、优化、格式转换、社交媒体素材准备和批量工作流，形成一站式图片处理产品。

## 2.2 产品目标
1. 通过真正可用的免费工具获得长期自然搜索流量。
2. 让用户能够在同一工作区连续完成多步图片处理。
3. 通过批量处理、快捷工作流、云空间和 AI 能力建立付费理由。
4. 通过高质量知识内容、尺寸参考和工具页形成 SEO 内容体系。
5. 保持低运维成本，先验证流量和用户需求，再投入昂贵能力。

## 2.3 非目标
- 不做通用在线办公套件。
- 不做与图片无关的大而全工具导航站。
- 不在早期开发复杂社交社区。
- 不在没有成本和需求验证前开发大量云端 AI 功能。
- 不以登录、上传云端或付费作为基础工具的门槛。

# 3. 产品信息架构

建议主导航：
- Tools：Image Editing / Image Optimization / Image Conversion / Social Media / GIF & SVG / AI Tools
- Batch Workspace
- Learn：Image Guides / Image Size Reference / Tutorials
- Pricing（会员实际开放后再展示）
- My Files（登录后）
- Account

首页建议结构：
1. Hero：一句话说明产品价值，突出免费、快速、隐私友好。
2. 主搜索框：按工具名称或任务搜索。
3. Popular Tools：展示真实高频工具。
4. Browse by Category：分类入口。
5. Quick Workflows：Optimize for Website、Prepare for Instagram 等。
6. Batch Workspace 入口。
7. Image Size Reference / Guides 内容入口。
8. Why ImageKitTools：Local Processing、No Account Required、Privacy-focused。
9. Latest Guides / Recently Added Tools。
10. FAQ 与页脚法律、联系信息。

首页不要堆砌所有工具。控制首屏信息密度，优先让用户快速找到任务入口。

# 4. 工具矩阵与优先级

## 4.1 现有工具盘点要求
Codex 必须检查生产站点和代码仓库，确认以下工具实际状态，不得把规划工具误报为已上线：
- Image Compressor
- Image Resizer
- Image Converter
- Image Cropper
- Compress Image to KB
- Rotate / Flip Image
- Watermark Image
- Meme Generator
- Photo Editor
- Blur Image

每个工具记录：URL/路由、状态（完整/部分/占位/不可用）、支持格式、单张/批量能力、移动端适配、本地处理验证、错误与性能、SEO 内容、相关工具入口和待修复问题。

## 4.2 P0：优先补齐的高价值工具

| 工具 | 核心能力 | 优先级 | 实施说明 |
|---|---|---:|---|
| EXIF Viewer | 查看 EXIF、拍摄参数、GPS 等 | P0 | 本地解析，不上传 |
| EXIF Remover | 删除 EXIF/GPS 元数据 | P0 | 验证输出确实清除元数据 |
| DPI Changer | 修改 DPI/PPI 元数据 | P0 | 明确说明修改元数据不等于增加像素 |
| Favicon Generator | 生成多尺寸 PNG/ICO、预览和代码片段 | P0 | 生成 favicon 文件包 |
| Image to PDF | 多图排序、页面尺寸、方向、边距、合并 | P0 | 本地生成 PDF |
| PDF to Image | PDF 页面转 PNG/JPG | P0 | 页码范围、DPI、ZIP 下载；评估 PDF.js 许可和体积 |

建议 P0 顺序：EXIF Viewer/Remover → DPI Changer → Favicon Generator → Image to PDF → PDF to Image。

## 4.3 P1：扩展场景与格式生态
- SVG Optimizer：清理 SVG、压缩、预览；安全清理脚本和外链。
- SVG to PNG：指定尺寸和背景导出。
- GIF Maker：多图合成 GIF，帧顺序、帧间隔、循环。
- GIF Compressor：调整尺寸、帧率/颜色等压缩。
- GIF Splitter：GIF 拆帧。
- Social Media Resizer：平台预设尺寸、裁剪、补边。
- Color Palette Extractor：提取主色、HEX/RGB、导出色板。
- Image Color Picker。
- HEIC to JPG（先检测浏览器支持和依赖方案）。
- PNG to ICO。
- Image to Base64 / Base64 to Image。
- Photo Collage Maker。
- Profile Picture Maker。
- YouTube Thumbnail Maker。
- Instagram Story / Post Resizer。
- Pinterest Pin Resizer。
- LinkedIn Banner Maker。
- Facebook Cover Maker。

## 4.4 P2：AI 图片能力
- AI Background Remover
- AI Image Upscaler
- AI Photo Enhancer
- AI Old Photo Restoration
- AI Object Remover
- AI Inpainting
- AI Background Generator

要求：
- 默认不启用真实付费 API。
- 先设计 Provider Adapter、额度扣减、任务状态和成本统计。
- AI 云端处理必须单独提示上传和隐私风险，并取得用户明确同意。
- 采用试用额度/会员额度，不允许无上限调用。
- 记录 provider、模型、任务耗时、输入输出大小、成本和错误，不记录不必要的图片内容。
- AI 任务失败不得扣除成功额度；定义幂等和退款规则。
- 未配置 AI Provider 时展示 Coming Soon / Disabled，不伪造处理成功。

# 5. Batch Workspace（核心产品升级）

## 5.1 目标
从单工具页面升级为可连续处理多张图片的统一工作区。这是 V2.0 最重要的产品能力之一，优先级高于大量新增简单工具。

## 5.2 用户流程
1. 进入 Batch Workspace。
2. 拖拽或选择多张图片。
3. 展示文件列表、缩略图、名称、格式、尺寸、大小和状态。
4. 选择一个或多个处理步骤。
5. 配置参数并预览。
6. 开始处理，显示每个文件进度和结果。
7. 单独下载或打包 ZIP 下载。
8. 用户可选择保存结果到云空间；默认不保存。

## 5.3 首批批处理步骤
- Resize
- Convert Format
- Compress
- Watermark
- Rename
- Rotate / Flip（可选）

## 5.4 批处理要求
- 支持添加、移除、清空、拖拽排序。
- 支持统一参数和逐文件覆盖参数。
- 每个文件状态：Queued、Processing、Completed、Failed、Cancelled。
- 单文件失败不导致整个批次失败。
- 支持取消尚未开始的任务；正在执行任务尽力中断。
- 并发数可配置，默认保守，避免浏览器内存耗尽。
- 处理完成后可逐个下载，也可 ZIP 下载。
- ZIP 生成失败时仍可逐个下载。
- 不得将原图上传后端以实现批处理。
- 释放 ImageBitmap、ObjectURL、Canvas 等资源。
- 刷新后任务恢复可后置；未实现前不得声称任务已持久化。

## 5.5 验收
- 20 张常见尺寸图片可完成批量处理（具体大小限制配置化）。
- 一张图片失败不影响其他图片。
- 用户能识别失败原因并重试。
- 下载文件名、扩展名、MIME 正确。
- 处理期间 UI 不应无响应；内存使用有上限。
- 未登录用户可使用批处理和下载。

# 6. Quick Workflows（快捷工作流）

提供面向任务的入口，降低用户理解工具的成本。

### 6.1 Optimize for Website
- Resize（可选）
- Convert to WebP（可选）
- Compress
- 下载优化图片
- 显示原始大小、结果大小、节省比例和尺寸变化

### 6.2 Prepare for Instagram
- 选择 Post / Story / Reel Cover / Profile
- 应用平台尺寸预设
- 提供裁剪、背景补齐和预览
- 导出 JPG/PNG/WebP

### 6.3 Prepare for Printing
- 设置目标宽高或纸张尺寸
- DPI/PPI 设置
- 预览实际打印尺寸估算
- 像素不足时明确提示
- 不得误导用户认为仅修改 DPI 就提升图像清晰度

### 6.4 Reduce to Target Size
- 选择 50KB / 100KB / 200KB / 500KB / 1MB 或自定义目标
- 结合尺寸、格式和质量有限迭代
- 无法达到时给出最接近结果和原因
- 不允许无限循环或静默输出不符合目标的结果

工作流底层复用现有图像处理函数，不得复制多套算法实现。步骤应有类型定义、参数校验和可测试的执行管线。

# 7. Social Media Image Resizer

功能：
- 平台选择：Instagram、Facebook、YouTube、Pinterest、LinkedIn。
- 场景选择：Post、Story、Reel Cover、Thumbnail、Profile、Banner。
- 预设尺寸集中管理，不能散落硬编码在 UI。
- 用户可自定义宽高和比例。
- 支持 Fit、Fill、Crop、Blurred Background 等适配方式。
- 支持预览和导出。

尺寸数据治理：
- 每条预设包含平台、场景、宽、高、比例、说明、来源/核验日期、启用状态。
- 尺寸变化时可更新配置，不重写组件。
- 不得将未经核实的尺寸描述为平台官方强制规范。
- 区分推荐值与平台限制。

# 8. Image Knowledge Center 与内容体系

## 8.1 内容分类
- Image Compression Guides
- Image Format Guides
- Image Size Guides
- Image Privacy & Metadata
- Social Media Image Guides
- Website Image Optimization
- Printing & DPI Guides
- Tutorials & Use Cases

## 8.2 文章模板
每篇文章至少包含：
1. 明确的用户问题和搜索意图。
2. 简短直接的答案。
3. 详细操作步骤。
4. 必要的示例图或前后对比。
5. 相关工具入口。
6. 常见问题。
7. 更新时间（仅在真实更新时修改）。
8. 作者/编辑说明（不得虚构专家身份）。
9. 相关内容内链。
10. 必要时注明浏览器兼容性、格式限制和隐私行为。

## 8.3 首批文章选题
- How to Compress Images Without Losing Quality
- How to Reduce an Image to 100KB
- JPEG vs PNG vs WebP vs AVIF
- How to Convert Images to PDF
- How to Remove EXIF Metadata from Photos
- What Is 300 DPI?
- Best Image Sizes for Instagram
- Best YouTube Thumbnail Size
- How to Optimize Images for Websites
- How to Make a Favicon for a Website
- How to Convert HEIC to JPG
- How to Resize Images Without Cropping

内容必须事实核对和人工审阅。禁止自动生成大量低价值近似文章。不得复制竞品内容、图片或未经授权模板。

## 8.4 Image Size Reference
建立可检索的图片尺寸参考中心：
- Social Media
- Website
- Email
- Video Thumbnail
- Profile / Avatar
- Print

每个尺寸条目包含用途名称、推荐宽高、宽高比、推荐格式、说明、最后核验日期、对应 Resizer 入口（带预设参数）。尺寸数据必须可维护、可更新，不能只在文章正文里硬编码。

# 9. SEO 技术与页面规范

## 9.1 工具页
每个工具页必须具备独立 Title、Meta Description、H1、功能介绍、实际工具交互、使用步骤、典型场景、支持格式与限制、FAQ、相关工具链接、真实示例。

不能只用模板替换工具名称生成内容相同的页面。

## 9.2 技术 SEO
- sitemap.xml 自动维护，仅包含 canonical、可索引且有价值的 URL。
- robots.txt 正确配置，不屏蔽重要资源。
- canonical 指向规范 URL。
- 正确处理 404、重定向和 URL 尾斜杠策略。
- 面包屑导航与合理结构化数据。
- OG / Twitter metadata。
- 图片 alt 文本准确描述图片，不堆砌关键词。
- 分页、筛选和参数 URL 避免大量重复索引页面。
- 未完成、无实质内容的工具页可 noindex 或不公开。
- 保留现有已收录 URL；变更路由必须提供 301 方案。
- 使用 Search Console 检查索引、抓取和 Core Web Vitals。
- 结构化数据必须匹配页面真实内容，不保证获得富媒体展示。

## 9.3 内链
- 工具页链接到相关工具和教程。
- 文章链接到解决该问题的工具。
- 尺寸参考链接到对应 Resizer 预设。
- 分类页链接到真实上线的工具。
- 不允许大量失效、Coming Soon 或空白链接。

# 10. 会员与商业化设计（先预留，后上线）

## 10.1 原则
- 基础工具长期免费。
- 不通过人为破坏免费工具体验逼迫用户付费。
- Pro 收费点来自效率、批量规模、高级工作流、云空间和 AI 额度。
- 会员系统先定义权益模型，不急于接支付。
- 所有限额和权益由服务端校验，不能只靠前端隐藏按钮。

## 10.2 建议权益

| 能力 | Free | Pro（规划） |
|---|---|---|
| 单张基础处理 | 免费 | 免费 |
| 常见格式转换 | 免费 | 免费 |
| 基础裁剪/压缩 | 免费 | 免费 |
| 批量处理 | 合理限制 | 更高批次/额度 |
| Quick Workflows | 基础预设 | 自定义/高级预设 |
| 云空间 | 配置化小容量 | 更大容量 |
| AI 工具 | 有限试用或无 | 按月额度 |
| 处理历史 | 本地/有限 | 云端历史 |
| 广告 | 可能展示 | 无广告（需政策允许） |

初期仅作为产品规划，不向用户展示未经实现的会员权益。

## 10.3 权益系统
- Plan：Free、Pro。
- Entitlement：功能开关、容量、批次大小、月度 AI credits 等。
- Usage：已使用额度、周期、重置时间。
- Subscription：状态、周期、支付提供商 ID（支付阶段再接入）。
- 服务端统一鉴权，前端仅展示结果。
- 额度扣减必须幂等，支持失败返还。
- 不将价格、币种、税费和支付状态硬编码在多个业务模块。

## 10.4 价格验证
月费 USD 4.99–7.99 仅作为调研假设，不是既定定价。上线前通过用户访谈、使用数据和成本模型验证。可考虑月付/年付，但不要预设转化率或收入。

# 11. Google AdSense 与广告体验

原则：
- 广告不得伪装成工具按钮、下载按钮或系统提示。
- 不得遮挡上传、参数、处理和下载等核心交互。
- 不得通过误导点击或异常布局增加广告点击。
- 遵守 Google 当前政策和适用地区法规。
- 广告加载失败不影响工具使用。
- Pro 无广告权益仅在真实会员系统实现后启用。

广告位规划：
- 首页：可评估内容区之间的广告位。
- 工具页：优先保障核心操作；可在介绍内容与结果/相关工具区域评估广告。
- 文章页：可在自然段落之间安排，不打断阅读。
- 移动端控制广告数量和布局跳动。
- 不在文件拖放区、下载按钮附近或误触高发区域放广告。

技术要求：
- 预留广告容器，避免加载后 CLS。
- 广告脚本异步加载，不阻塞核心交互。
- 开发环境不请求真实广告。
- AdSense 未获批准时不显示伪广告。
- 不为了广告增加不必要的跳转或内容分页。

# 12. 用户账户、云空间与处理历史

沿用 V1.1 认证和云存储设计，重点增加：
- 用户收藏常用工具。
- 保存自定义处理预设。
- 云端处理结果和原图分开管理。
- 云端文件可搜索、筛选、删除。
- 处理历史明确区分本地历史与云端历史。
- 本地历史仅保存在浏览器时，需说明清除浏览器数据后可能丢失。
- 云端历史只有用户主动保存后才存在。
- 账户注销时说明云文件、个人资料和订阅数据的删除/保留策略。

继续遵循：Bucket 私有；对象 Key 服务端生成；短时预签名 URL；浏览器直传；服务端核验实际大小、MIME、对象状态；用户隔离；配额并发安全；失败恢复、幂等确认和孤儿对象清理。不得在日志中输出密码、完整连接串、预签名 URL 或敏感文件信息。

# 13. 分析与运营数据

## 13.1 事件体系
建议事件：
- `tool_view`
- `file_selected`
- `processing_started`
- `processing_completed`
- `processing_failed`
- `download_clicked`
- `batch_started`
- `batch_completed`
- `workflow_started`
- `workflow_completed`
- `signup_completed`
- `cloud_save_started`
- `cloud_save_completed`
- `pro_upgrade_viewed`
- `subscription_started`（支付上线后）

事件属性建议：tool_id、tool_category、file_count 区间、input/output size 区间、format、duration bucket、脱敏 error_code、device category。

不得上传图片内容、文件原始名称（除非有明确必要和授权）、EXIF、GPS 或其他不必要个人数据。

## 13.2 核心指标
- Organic Sessions
- Search Impressions / Clicks / CTR / Position
- Tool Usage
- Processing Success Rate
- Download Conversion
- Returning Users
- Guest-to-Registered Conversion
- Free-to-Pro Conversion
- Revenue per 1,000 Sessions
- Cost per Active User
- Cloud Storage Used / Egress
- AI Cost per Successful Task

每月复盘流量增长最快页面、曝光高但 CTR 低页面、使用高但失败率高工具、可能具备付费价值的功能，以及无流量无使用但维护成本高的页面。

# 14. 性能、可访问性与兼容性

- 核心工具优先保证首屏快速可交互。
- 重型依赖动态加载，不将 PDF/GIF/AI 大型依赖打入所有页面首屏包。
- 图片处理适用时使用 Web Worker，避免阻塞主线程。
- 控制并发、像素总量和内存峰值。
- 对超大文件提供明确限制和错误提示。
- 处理完成后释放临时资源。
- 支持键盘操作、可见焦点、合理标签和对比度。
- 适配桌面、平板和移动端。
- 覆盖主流 Chrome、Edge、Safari、Firefox；特性检测后再启用 WebGPU、HEIC 等能力。
- 不支持的浏览器提供降级说明，而不是静默失败。

# 15. 安全与隐私

- 所有输入文件按不可信内容处理。
- 校验文件大小、真实文件签名/MIME，不只相信扩展名。
- 防止 SVG 脚本执行、HTML 注入和危险外链。
- 对用户输入文本进行输出编码。
- 认证、邮件、云文件和管理 API 做限流。
- 防止 IDOR：每个文件操作校验当前用户归属。
- 预签名 URL 短时有效，不写入日志。
- CORS 仅允许所需来源和方法。
- 隐私政策与真实数据流一致。
- Local processing 工具通过网络请求检查验证无图片上传。
- 第三方分析和广告脚本按隐私政策及适用法规配置。
- 未经用户同意不得将图片发送到 AI Provider。

# 16. 技术架构约束

沿用现有技术栈优先，不因 V2.0 规划盲目迁移。

逻辑模块建议：
- `tools-registry`：工具目录、分类、元数据、SEO 元信息。
- `image-engine`：可复用图像处理能力。
- `batch-engine`：批处理队列和任务状态。
- `workflow-engine`：多步骤工作流。
- `social-presets`：社交媒体尺寸数据。
- `content`：文章、教程、尺寸参考。
- `auth`：账户和会话。
- `storage`：云空间适配层。
- `billing`：权益和订阅（先预留，不接支付）。
- `analytics`：事件埋点适配层。

这些是逻辑边界，不要求独立部署。若当前使用 Next.js + TypeScript，保持现有 App Router 和路由约定；UI、业务逻辑、图像处理引擎、存储适配层分离；大型处理模块按需加载；使用统一错误类型；核心算法有单元测试。

# 17. 分阶段实施路线

## Phase 0：现状审查与产品基线（必须先做）
- 检查仓库、分支、部署、数据库、环境变量和依赖。
- 逐项核实线上工具和路由。
- 检查首页、工具页、Learn、法律页面、移动端。
- 对每个现有工具做功能和 SEO 盘点。
- 检查图片是否真正本地处理。
- 检查批量、云空间、账户和分析能力现状。
- 输出差距清单、风险清单、文件级实施计划。
- 不做大规模重构，不删除旧功能。

验收：负责人清楚知道哪些已完成、哪些缺失、哪些需要修复；计划按风险和价值排序。

## Phase 1：现有产品质量提升
- 修复现有工具功能缺陷。
- 统一工具页交互和状态。
- 补齐移动端体验、错误提示、空状态。
- 检查大图处理、EXIF 方向、透明度、输出 MIME。
- 完善现有工具独立 SEO 内容。
- 建立工具注册表和相关工具推荐。
- 增加基础事件埋点。

验收：现有工具稳定、体验一致、页面内容有独立价值，核心事件可统计。

## Phase 2：高价值工具扩展
依次实施 EXIF Viewer/Remover、DPI Changer、Favicon Generator、Image to PDF、PDF to Image。每个工具单独完成需求、设计、测试、SEO 页面和隐私验证，不并行铺开全部工具。

验收：功能可用、浏览器兼容性有测试、无静默上传、SEO 内容完整。

## Phase 3：Batch Workspace
- 多文件选择、拖放、排序、删除。
- 批量 Resize / Convert / Compress。
- 任务队列、并发控制、进度和失败重试。
- 单文件下载和 ZIP 下载。
- 资源释放和大文件保护。
- 游客完整使用。

验收：20 张常见图片批处理成功；单文件失败隔离；页面无明显卡死；ZIP 失败仍可单文件下载。

## Phase 4：Quick Workflows 与 Social Media
- Optimize for Website。
- Prepare for Instagram。
- Prepare for Printing。
- Reduce to Target Size。
- Social Media Resizer。
- 尺寸预设数据维护机制。
- 工作流复用 image-engine，不复制算法。

验收：用户能通过任务入口完成多步骤操作；每个工作流有测试和明确限制说明。

## Phase 5：内容中心和 SEO 增长
- Image Knowledge Center。
- Image Size Reference。
- Tutorials & Use Cases。
- sitemap、canonical、结构化数据、内链完善。
- Search Console / Analytics 数据复盘机制。
- 内容人工审核流程。

验收：内容页面真实有用，工具和文章之间有合理内链，无批量薄内容和重复索引。

## Phase 6：商业化准备
- 定义 Free / Pro Entitlements。
- 建立用量统计和服务端权益校验。
- 统计云存储成本和 AI 单次任务成本。
- 设计会员页和升级入口，但未接支付前不得展示可购买状态。
- 广告位布局测试，保障工具体验。

验收：会员权益由服务端统一判断；免费基础工具不受影响；成本数据可观测。

## Phase 7：会员与 AI 试点
只有在真实用户数据和预算支持时才启动：
- 选取 1–2 个明确付费价值的 Pro 能力。
- 选择支付服务商并完成合规评估。
- AI Provider Adapter。
- AI credits、幂等扣减、失败返还。
- 用户主动授权云端处理。
- 订阅状态、取消、退款和账单管理。

验收：支付状态可信、额度账务正确、成本可控、用户清楚理解上传和收费规则。

# 18. 功能验收总清单

## 产品体验
- [ ] 首页能够快速找到工具和任务入口。
- [ ] 导航只展示真实可用功能。
- [ ] 工具分类清楚、搜索可用。
- [ ] 桌面端和移动端布局正常。
- [ ] 所有主要按钮有真实行为，不存在假按钮。

## Local First / Guest First
- [ ] 游客可使用所有基础工具。
- [ ] 游客可预览和下载。
- [ ] 本地处理时图片不发往服务器。
- [ ] 不因未登录阻断处理流程。
- [ ] 云端保存必须主动触发。

## 工具质量
- [ ] 格式、大小、像素和 MIME 校验正确。
- [ ] 透明度、EXIF 方向处理正确。
- [ ] 大图和异常文件有友好提示。
- [ ] 失败不污染其他文件任务。
- [ ] 输出可正常打开，文件名和扩展名正确。

## Batch Workspace
- [ ] 多文件添加、移除、排序。
- [ ] 批量参数和逐文件参数。
- [ ] 任务状态、进度、失败重试。
- [ ] 单个失败不影响整个批次。
- [ ] 单文件和 ZIP 下载。
- [ ] 内存和临时资源正确释放。

## SEO / 内容
- [ ] 每个可索引工具页有独立内容。
- [ ] Title、Description、H1 正确。
- [ ] canonical、sitemap、robots 正确。
- [ ] 内链有效。
- [ ] 无大规模重复/薄内容页面。
- [ ] 结构化数据与实际页面内容一致。

## 广告和会员
- [ ] 广告不遮挡核心操作。
- [ ] 广告脚本不阻塞工具主流程。
- [ ] 未获 AdSense 批准时不显示假广告。
- [ ] 免费基础工具不被人为限制到不可用。
- [ ] 会员权益服务端校验。
- [ ] 未接支付前没有虚假购买流程。

## 安全与隐私
- [ ] SVG 不执行危险脚本。
- [ ] 云文件用户隔离。
- [ ] 预签名 URL 短时有效。
- [ ] 认证和上传 API 有限流。
- [ ] 图片本地处理网络验证通过。
- [ ] 隐私政策与真实行为一致。

# 19. 风险与应对

| 风险 | 应对 |
|---|---|
| 工具数量增长导致维护成本高 | 工具注册表、统一引擎、严格优先级 |
| 批量处理导致浏览器内存不足 | 并发限制、像素限制、Worker、释放资源 |
| PDF/GIF 依赖体积过大 | 动态加载、评估许可和包体积 |
| EXIF 清理不完整 | 使用测试样本验证输出元数据 |
| DPI 误导用户 | 明确区分元数据和像素分辨率 |
| 社交平台尺寸过期 | 预设数据集中管理、定期核验 |
| SEO 内容质量低 | 人工审核、解决具体问题、避免模板灌水 |
| AdSense 影响体验 | 广告位与核心操作隔离、监控 CLS |
| AI 成本不可控 | credits、限额、成本监控、用户授权 |
| 会员权益前端绕过 | 服务端统一鉴权 |
| 云存储费用增长 | 配额、生命周期、流量监控和告警 |
| 个人维护负担过大 | 每阶段小步交付，避免微服务和复杂运维 |

# 20. Codex 开发执行方式

每个 Phase 单独开工。开始前：
1. 阅读本 SPEC 和 AGENTS.md。
2. 检查当前实现和依赖。
3. 明确本阶段范围和不做的内容。
4. 给出文件级改动计划。
5. 列出数据迁移、兼容性和风险。
6. 等待负责人确认需要外部服务或产生费用的事项。

实施中：
- 先写核心逻辑和测试，再接 UI。
- 尽量复用现有组件和图像处理引擎。
- 不随意改动 URL 和数据库结构。
- 关键行为必须有自动化测试。
- 不引入无必要依赖。
- 不把未实现能力标记为完成。

阶段结束报告：
- 本阶段目标
- 已完成事项
- 修改文件
- 关键设计和实现
- 数据库迁移
- 测试命令及结果
- 性能/安全验证
- 未完成事项
- 风险
- 需要负责人决策的问题
- 下一阶段建议

# 21. Codex 首条执行指令

请先完整阅读项目根目录的 `SPEC-V2.md`、原有 `SPEC.md` 和 `AGENTS.md`。

**第一轮只执行 Phase 0，不要直接开始开发新工具。**

具体要求：
1. 检查当前仓库结构、技术栈、依赖、构建和部署方式。
2. 检查线上 `https://www.imagekittool.com/` 的页面路由与现有工具；如无法访问线上页面，明确说明并以仓库代码为准。
3. 建立现有工具盘点表，区分已完成、部分完成、未实现、无法验证。
4. 检查每个工具是否真正本地处理，识别任何图片网络上传行为。
5. 检查首页、工具页、内容页、法律页面、移动端和 SEO 技术配置。
6. 检查批量处理、云空间、账户、分析埋点现状。
7. 输出问题清单，按 P0/P1/P2 排序，并说明影响。
8. 给出后续 Phase 1 的文件级实施计划。
9. 不得在 Phase 0 擅自重写架构、删除功能、创建云资源或接入付费服务。
10. 完成后停止并汇报，等待负责人确认。

# 22. 负责人待确认事项

Codex 不得自行假设：
- 是否允许引入新的付费第三方服务。
- 正式对象存储和邮件服务配置。
- GA4、Search Console、Sentry 等账号配置。
- AdSense Publisher ID 和广告位配置。
- AI Provider、模型、价格和额度。
- 支付服务商、币种、税务和退款规则。
- 会员最终价格与权益。
- 生产环境数据库和部署配置。

在确认之前，使用 Mock、Feature Flag 或 Disabled 状态实现可测试接口，不产生真实费用。
