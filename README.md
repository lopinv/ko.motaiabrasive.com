# MoTai Abrasives — 韩语站点

Hubei MoTai Abrasives Materials Co., Ltd. 的韩语企业级工业 B2B 站点。纯静态构建，部署于 GitHub Pages（`gh-pages` 分支），生产域名为 `https://ko.motaiabrasive.com`。

## 项目简介

网站面向韩语市场的工业采购商、进口商与经销商，覆盖五个产品族（磨料带、百叶片、网布砂碟/砂碟、Hook & Loop 碟、砂海绵，31 个型号规格页）、七个应用行业（木工、金属加工、汽车与维保、造船、油气、建筑建材、一般工业）以及质量、资源、文章与询价转化路径。

站点含一个批量内容管线：由选题矩阵（产品 × 规格 × 行业 × GCC 六国 × 13 类文章，`src/templates/topic-matrix.ts`）生成约 3000 篇韩语文章，通过发布队列 `src/content/articles/_index.json` 驱动，每 30 分钟自动发布一篇并同步部署（见「部署与发布循环」）。`src/content/articles/` 当前为空，文章在生成/发布时写入，不预置语料入库。

`npm run build` 完成类型检查与静态构建后，`npm run check` 会校验 SEO 元数据、JSON-LD 结构、页面内容厚度、内部链接图与 Sitemap 完整性，并阻断孤岛页面。

## 技术栈

- [Astro](https://astro.build/) 7.x — 静态站点生成（`@astrojs/mdx` + `@astrojs/sitemap`）
- TypeScript（strict）
- `@astrojs/sitemap` — 自动生成 Sitemap
- 原生 CSS（设计令牌 + CSS 逻辑属性）
- 无前端框架，无运行时依赖

## 环境要求

- Node.js 22 或更高版本
- npm 11 或更高版本

## 快速开始

```bash
npm ci
npm run dev        # 本地开发，默认 http://localhost:4321
npm run build      # 类型检查 + 静态构建，输出到 dist/
npm run preview    # 本地预览构建产物
npm run check      # Astro 类型检查 + SEO/内容/内链检查
npm run check:site # 同质化审计 + SEO/内容/内链检查（需先 build）
```

其他常用命令（`package.json`）：

```bash
npm run check:links          # 全站链接体检（check-all-links，需先 build + astro preview）
npm run check:homogeneity   # 文章同质化完整报告（Jaccard 0.90 阈值，无门禁）
npm run dedupe:delete       # 预览重复/冗余国家版文章删除清单
npm run dedupe:delete:execute # 实际执行删除
node scripts/publish-cycle.mjs # 跑一轮发布循环（生成 1 篇 → 构建 → 门禁 → 提交 → 部署 gh-pages）
node check_keywords.mjs     # 抽查前 10 篇文章的关键词密度
```

## 目录结构

```text
src/
├── components/   # 导航、页脚、面包屑、CTA、表单、FAQ 与侧边栏组件
├── content/articles/  # MDX 文章库（发布循环生成 .mdx + _index.json，当前为空）
├── data/
│   ├── site.ts   # 站点信息、导航、产品族、行业、应用场景、质量流程与资源
│   ├── models.ts # 31 个型号规格数据（belt/disc/sponge）
│   └── glossary.ts # 行业术语表
├── layouts/      # BaseLayout（元数据/JSON-LD）与 Layout（页面骨架）
├── pages/        # 全部静态路由（见下表）
├── styles/       # 设计令牌、组件样式、页面样式、文章正文样式
└── templates/    # 批量文章生成模板（选题矩阵、13 类文章模板、MDX 生成器）
public/
├── images/       # 公开产品与工厂图片
├── favicon.svg
├── site.webmanifest
├── CNAME
└── prompts_ko.md  # 韩语文章生成提示词规范（随站点根路径发布）
scripts/
├── quality-check.mjs            # SEO、内容厚度、孤岛页面检查（需先 build）
├── link-check.mjs               # 内链完整性检查
├── audit-urls.mjs               # 全量 URL 审计：站内文件存在性 + 外链 HEAD 可达性
├── check-all-links.mjs          # 全站内链体检（对 astro preview 实测 GET）
├── homogeneity-audit.mjs        # 文章同质化体检（--gate 门禁模式）
├── link-density.mjs            # 内链密度统计
├── generate-articles.ts         # 批量生成入口（npx tsx 指定批次）
├── publish-next.ts             # 生成下一篇并更新 _index.json（--peek 预览）
├── publish-cycle.mjs           # 发布循环编排器（生成→构建→门禁→提交→gh-pages 部署）
├── delete-duplicate-articles.mjs # 冗余国家版去重（--execute 实际删除）
├── fix-frontmatter.mjs / verify-frontmatter.mjs  # frontmatter 修复与校验
└── test-batch*.ts / test-single*.ts  # 管线批次测试
check_keywords.mjs  # 根目录：前 10 篇关键词密度抽查
```

## 页面与内容策略

| 类型 | 路由 | 内容要求 |
| --- | --- | --- |
| 首页 | `/` | Hero、产品入口、企业能力、行业方案、流程、FAQ |
| 产品目录 | `/products` | 5 个产品族入口 + 型号浏览器 + 选型引导 |
| 产品详情 | `/products/[slug]` | 用途、选型要点、规格表、FAQ、相关产品、询价入口 |
| 型号详情 | `/products/models/[slug]` | 31 个型号页：规格、粒度范围、FAQ、相关型号 |
| 行业目录 | `/industries` | 7 个行业场景 + 挑战清单 |
| 行业详情 | `/industries/[slug]` | 挑战、选型步骤、推荐产品、FAQ、相邻行业 |
| 企业/质量 | `/company`、`/quality` | 能力、流程、检查清单、FAQ |
| 技术规格 | `/technical-specs` | FEPA grit 表、英寸/毫米换算、磨料/基体类型 |
| 物流与 OEM | `/shipping-oem` | 海运/空运步骤、OEM 流程、包装选项、FAQ |
| 资源中心 | `/resources`、`/resources/[slug]` | 技术指南与采购准备清单 |
| 文章 | `/articles`、`/articles/[slug]` | MDX 技术文章（build 时由模板生成） |
| 转化 | `/quote`、`/contact`、`/thankyou` | 分步询价表单、WhatsApp、邮箱、电话、提交成功页 |
| 合规 | `/privacy` | 数据收集、使用、保留与权利说明 |
| 其他 | `/404` | 404 路由（noindex） |

**防孤岛规则**：每个可索引页面必须至少有一条来自站内其他页面的上下文入链（导航、面包屑、正文链接或相关推荐）。`scripts/quality-check.mjs` 会解析构建产物中的真实链接并阻断孤岛页面。

**内容生成与发布策略**：文章由选题矩阵（`src/templates/topic-matrix.ts`）批量生成，冗余国家版/变体在生成期直接删除（`dedupe:delete`，不使用 noindex）；发布由 `src/content/articles/_index.json` 队列驱动，每 30 分钟发布一篇。仍遵守内容红线：不虚构认证、客户案例、性能数据或库存。

## SEO 与结构化数据

- 每页唯一 Title、Meta Description、单 H1、Canonical、OGP 与 Twitter 卡片
- JSON-LD：`Organization`、`WebSite`、`BreadcrumbList`、`Product`、`FAQPage`、`Article`
- 自动生成 `sitemap-index.xml` 与 `robots.txt`（指向生产域名）
- `Product` 结构化数据仅填充可核验字段，不写入虚假价格、库存或评分

## 表单与 WhatsApp

询价表单（`src/pages/quote.astro`）通过 `https://form.lopins.cn/lopinx@duck.com/ad7aa0dd52e0afa55f85f7b2` 端点提交，静态托管无需自建服务端；提交成功后跳转 `/thankyou`。若更换 CRM 或表单服务，只需修改 `src/pages/quote.astro` 中的表单 `action`。

WhatsApp 号码为 `+86 181 1863 5597`（来自企业官网公开信息），统一在 `src/data/site.ts` 中维护。产品页的 WhatsApp 链接会预填产品名与询价话术。

## 部署与发布循环

部署不使用 GitHub Actions。线上站点即 `gh-pages` 分支（`public/CNAME` 记录自定义域名 `ko.motaiabrasive.com`），由发布循环脚本推送：

```
node scripts/publish-cycle.mjs
  1) 从选题池 peek 下一篇（耗尽打印 PUBLISH_EXHAUSTED 退出，定时任务据此暂停自身）
  2) 生成 1 篇 .mdx 并更新 _index.json
  3) 全量 build（NODE_OPTIONS --max-old-space-size=8192，防 3000+ 页 OOM）
  4) 三层门禁：同质化 --gate / quality-check / link-check + audit-urls
  5) 提交并推送 main（仅新 mdx + _index.json）
  6) 独立 worktree（.ghpages-worktree）检出 origin/gh-pages，
     全量覆盖 dist 后推送 origin HEAD:gh-pages
```

- 该脚本设计为每 30 分钟定时任务调用；内置并发锁（`.publish-cycle.lock`，45 分钟陈旧抢占）与失败可重入回滚（提交前失败会还原 mdx 与 `_index.json`）。
- 手动一次性部署：`npm run build` 后，将 `dist/` 内容覆盖推送到 `gh-pages` 分支即可（保留 CNAME）。

`astro.config.mjs` 中的 `site` 已配置为 `https://ko.motaiabrasive.com`，Canonical 与 Sitemap 均基于此域名生成。

## 业务资料待补充

以下内容需要企业方提供真实资料后替换，当前仅使用官网可核验的公开信息：

- 可公开的认证证书与编号
- 客户案例与参考项目
- 目标市场的合规与标签要求

产品型号库已在 `src/data/models.ts` 中维护 31 个型号（砂带、百叶片、砂纸片、魔术贴、砂海绵五个产品族），扩展规格与变体通过 `src/templates/` 生成管线持续补充。

询价收件当前使用 lopins 表单端点（见「表单与 WhatsApp」节）；若企业启用正式 CRM 收件地址，修改 `src/pages/quote.astro` 的表单 `action` 即可。

## 贡献流程

1. 在功能分支开发：`type/developer/description`
2. 本地执行 `npm run check` 确保类型与站点质量检查通过
3. 提交信息遵循 `<type>(<scope>): <subject>`，涉及逻辑变更时补充 Body 说明原因
4. 推送 `main` 后，由发布循环（`node scripts/publish-cycle.mjs`，或定时任务）完成构建并部署到 gh-pages
