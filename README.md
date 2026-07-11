# Gundam Wiki

高达模型社区站 — 知识库、作品展示、工具评测、讨论区与个人收藏一站式平台。

## 功能说明

### 知识库
- 多分类百科条目（入门指南 / 制作技法 / 模型图鉴 / 工具材料 / 涂装技法 / 改造进阶 / 场景制作 / 常见问题）
- 版本修订记录，每次编辑留痕
- 浏览量、点赞数统计
- 条目标签与搜索过滤
- 条目对比模式

### 作品展示
- 玩家制作记录发布（图片、描述、所用套件、标签）
- 点赞、评论互动
- 按作者、标签筛选

### 工具评测
- 工具数据库（品牌、分类、价格、评分、优缺点）
- 评分与评论系统
- 按类别 / 品牌 / 价格筛选

### 讨论区
- 8 个版块（新套件讨论 / 技法问答 / 工具避雷 / 作品交流 / 涂装讨论 / 改造创意 / 站务公告 / 自由讨论）
- 发帖支持图片上传、自定义标签
- 置顶、精华帖机制
- 评论与点赞

### 账号体系
- 邮箱密码注册 / 登录（Supabase Auth）
- 用户角色：游客 / 注册用户 / 管理员
- 个人资料（用户名、头像、贡献积分）
- 头像上传（Supabase Storage）

### 数据同步
- 浏览器本地存储（localStorage）兜底，离线可用
- 登录后自动与 Supabase 双向同步
- 知识库发布需管理员审核写入（wiki_pages 仅 admin 可写）

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| 样式 | Tailwind CSS v4（`@tailwindcss/postcss`） |
| 包管理 | pnpm 10 |
| 数据库 | Supabase（PostgreSQL + PostgREST + Auth + Storage） |
| 部署 | Cloudflare Workers（OpenNext） / Docker / Vercel |

## 本地运行步骤

### 前置要求

- Node.js ≥ 18（推荐 20）
- pnpm ≥ 10
- 一个 Supabase 项目（可选，不配也能用本地存储模式）

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量（可选）

复制示例文件：

```bash
cp .dev.vars.example .env.local
```

编辑 `.env.local`，填入你的 Supabase 项目信息：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

> 不配环境变量也能跑，`next.config.ts` 内置了 fallback 值，会使用项目自带的 Supabase 实例。

### 3. 初始化 Supabase 数据库（使用自己的 Supabase 时需要）

在 Supabase SQL Editor 中执行：

```bash
supabase/schema.sql
```

这会创建所有表、RLS 策略、触发器函数和种子数据。

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)。

### 5. 创建管理员账号

1. 在网站上注册一个账号
2. 在 Supabase SQL Editor 中执行提权脚本（替换为你的登录邮箱）：

```sql
update public.profiles
set role = 'admin', updated_at = now()
where email = 'your-email@example.com';
```

## 项目结构

```
app/
  page.tsx              # 单页应用主体（所有 UI + 业务逻辑）
  layout.tsx            # 根布局
  api/                  # API 路由（健康检查、错误上报等）
lib/
  supabase/client.ts    # 手写 Supabase 浏览器客户端
  iframe-safe-cookie.ts # 跨源 iframe 安全 cookie helper
  error-reporter.tsx    # 客户端错误自动上报
supabase/
  schema.sql            # 表结构 + RLS 策略 + 种子数据
  create-admin.sql      # 管理员提权脚本
```

## 常用命令

```bash
pnpm dev          # 启动开发服务器（0.0.0.0:3000）
pnpm build        # 生产构建
pnpm start        # 启动生产服务
pnpm lint         # ESLint 检查
pnpm cf:deploy    # 部署到 Cloudflare Workers
pnpm cf:preview   # Cloudflare 本地预览
```

## 部署

### Cloudflare Workers

```bash
pnpm cf:deploy
```

配置见 `wrangler.jsonc`。

### Docker

```bash
docker compose up
```

### Vercel

直接导入仓库，环境变量在 Vercel 后台配置。

## 注意事项

- 本项目运行在 e2b 沙箱中，通过跨源 iframe 嵌入平台预览，cookie / localStorage / autofocus 等受限，详见 `PLATFORM.md`
- `wiki_pages` 表仅管理员可写（设计理念：发布内容需审核），普通用户提交的修订存放在 `wiki_revisions`
- PostgREST 批量 upsert 要求所有行字段名一致，可选字段缺失需显式补 `null`

## License

MIT
