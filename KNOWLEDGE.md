# Gundam Wiki 知识文档

一份面向维护者的项目知识库，覆盖架构、数据层、认证、部署与已知坑点。基于代码现状整理。

## 1. 项目概述

**Gundam Wiki**（`gundam-model-wiki` v1.0.1）是一个高达模型社区站，集知识库、作品展示、工具评测、讨论版块与个人收藏于一体。前端为单页式应用，所有交互逻辑集中在 `app/page.tsx`（约 150KB 的大型客户端组件）。

核心能力：
- 知识库（wiki_pages）：套件图鉴、入门指南、技法教程，带版本修订
- 作品（works）：玩家制作记录展示
- 工具（tools）：剪钳/渗线液等工具评测
- 讨论区（forum_posts）：分版块发帖、评论、点赞
- 账号体系：注册/登录、角色权限（guest/user/admin）、头像上传
- 云端同步：浏览器本地状态与 Supabase 双向同步

## 2. 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| 样式 | Tailwind CSS v4（`@tailwindcss/postcss`） |
| 包管理 | pnpm 10（lockfile = `pnpm-lock.yaml`） |
| 数据库（生产） | Supabase（PostgreSQL + PostgREST + Auth + Storage） |
| 数据库（compose 遗留） | MySQL 8（`database/init.sql`，当前 `lib/mysql.ts` 已禁用） |
| 部署 | Cloudflare Workers（OpenNext）、Docker compose、Vercel 三选一 |
| 运行环境 | e2b 沙箱，跨源 iframe 嵌入平台前端预览 |

## 3. 目录结构

```
app/
  page.tsx                 # 单页应用主体（所有 UI + 业务逻辑）
  layout.tsx               # 根布局，mount <ErrorReporter />
  api/
    health/route.ts        # 健康检查
    jpy-rate/route.ts      # 日元汇率
    luffy-platform-error/  # 客户端错误上报（平台埋点，勿删）
lib/
  supabase/client.ts       # 手写 Supabase 浏览器客户端（非官方 SDK）
  iframe-safe-cookie.tsx   # 跨源 iframe 安全 cookie helper
  error-reporter.tsx       # 客户端错误自动上报组件
  mysql.ts                 # 已禁用（抛错：local preview mode）
supabase/
  schema.sql               # Supabase 表结构 + RLS 策略 + 触发器 + 种子数据
  create-admin.sql         # 提权管理员脚本（占位邮箱需替换）
database/
  Dockerfile + init.sql    # MySQL 遗留 schema（与 Supabase schema 不同构）
wrangler.jsonc             # Cloudflare Workers 部署配置 + 环境变量
next.config.ts             # Next 配置 + Supabase fallback 环境变量
Dockerfile / compose.yaml  # 容器化部署
```

## 4. 数据层

### 4.1 当前生效：Supabase

`lib/supabase/client.ts` 是**手写客户端**，不依赖 `@supabase/supabase-js`。直接用 `fetch` 调用 Supabase 的 REST API：

- 查询：`GET /rest/v1/{table}?select=...`
- 写入：`POST /rest/v1/{table}` + `Prefer: resolution=merge-duplicates`
- 认证：`POST /auth/v1/token?grant_type=password` / `refresh_token` / `logout`
- Storage：`POST /storage/v1/object/{bucket}/{path}`

token 存 localStorage（`gundam_supabase_token` / `gundam_supabase_refresh_token`），401 时自动 refresh 一次。

**设计取舍**：选 token+`Authorization` header 而非 cookie，是为了规避跨源 iframe 的 cookie 限制（见 `PLATFORM.md` §2）。

### 4.2 表结构（supabase/schema.sql）

| 表 | 主键 | RLS 写策略 |
|---|---|---|
| `profiles` | uuid（关联 auth.users） | 仅本人可读，admin 可读全部 |
| `wiki_pages` | bigint | **仅 admin 可写**（`is_admin()`） |
| `wiki_revisions` | bigint | 任意 authenticated 可 insert/update |
| `works` | bigint | 任意 authenticated 可 insert/update，admin 可 delete |
| `forum_posts` | bigint | 任意 authenticated 可 insert/update，admin 可 delete |
| `tools` | bigint | 仅 admin 可 insert/delete，任意 authenticated 可 update |
| `community_comments` | bigint | 本人可 insert/update，admin 可 delete |
| `community_likes` | text | 本人可 insert/update/delete |

**设计理念**：`wiki_pages` 发布需管理员审核后才能写入，故只有 admin 写策略；`wiki_revisions` 允许任意登录用户提交修订（待审批）。

### 4.3 角色与权限

- `profiles.role`：`user`（默认）/ `admin`
- `is_admin()` 函数：`security definer`，查 `profiles.role = 'admin'`
- admin 提权：执行 `supabase/create-admin.sql`（需把 `your-admin@example.com` 替换成真实邮箱）

### 4.4 已废弃：MySQL

`database/init.sql` 是早期 MySQL schema，表结构与 Supabase 不一致（如 `wiki_pages` 用 `category_id` 外键，Supabase 用 `category` 文本）。`compose.yaml` 仍保留 MySQL 服务，但 `lib/mysql.ts` 已改为直接抛错，**生产不使用**。

## 5. 客户端同步机制

`app/page.tsx` 的 `useEffect`（约 372-414 行）实现本地→云端同步：

1. **触发条件**：`remoteLoaded && supabaseUser`（已登录且初始加载完成）
2. **防抖**：800ms 延时
3. **批量 upsert**：wiki_pages / wiki_revisions / works / forum_posts / tools
4. **失败处理**：收集错误，显示 `${name}：${error.message}` 提示

**关键约束**：PostgREST 批量 upsert 要求**所有行字段名完全一致**。可选字段缺失必须显式补 `null`，否则报 `All object keys must match`。

## 6. 部署

### 6.1 Cloudflare Workers（主路径）

```bash
pnpm cf:deploy   # = cf:build + deploy
```

- 配置：`wrangler.jsonc`
- 环境变量：`vars.NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 直接硬编码在 wrangler.jsonc
- 构建：`@opennextjs/cloudflare` 把 Next.js 适配到 Workers 运行时

### 6.2 Docker compose

```bash
docker compose up
```

- `compose.yaml` 启动 web + MySQL（但 MySQL 未实际使用）
- `Dockerfile` 基于 `node:20-alpine`，单阶段构建

### 6.3 Vercel

`vercel.json` 存在，可标准部署。环境变量需在 Vercel 后台配置。

### 6.4 环境变量

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

`next.config.ts` 内置 fallback 值，即使不配环境变量也能跑（用项目自带的 Supabase 实例）。

## 7. 平台约束（跨源 iframe）

详见 `PLATFORM.md`。要点：

1. **cookie**：跨源 iframe 内 `sameSite=lax` cookie 被拦，必须用 `lib/iframe-safe-cookie.tsx` 的 `IFRAME_SAFE_COOKIE_OPTS`
2. **认证**：优先 token + `Authorization` header + localStorage，不依赖 cookie
3. **autofocus**：iframe 内被 Chrome block，不要作为 UX 关键路径
4. **storage partition**：iframe 的 localStorage 与新 tab 独立，不能假设跨上下文共享
5. **错误上报**：`lib/error-reporter.tsx` 是平台埋点，**严禁删除**，会自动上报 window.error / unhandledrejection / fetch 5xx

## 8. 已知坑点与修复记录

### 8.1 wiki_pages 同步失败：All object keys must match

**原因**：`app/page.tsx` 用 `...item` 展开生成 upsert 行，`WikiPage` 的 `kit/grade/scale/release/price` 是可选字段，部分页面缺失导致字段名不一致，PostgREST 拒绝整批。

**修复**：显式列出全部 17 个字段，可选字段缺失补 `null`，与其他表的写法对齐。

### 8.2 同步错误信息被吞掉

**原因**：原 `setNotice` 只显示表名，不带 Supabase 返回的具体错误。

**修复**：把 `result.error.message` 拼进提示，便于诊断。

### 8.3 发帖按钮一直灰色

**原因**：`canPublish` 要求标题≥5字、主题≥2字、正文≥10字，但标题/主题字段无字数提示，用户无法察觉门槛。

**修复**：阈值降到标题≥1字、正文≥1字，主题字段改为可选。

## 9. 常用命令

```bash
pnpm dev          # 本地开发（0.0.0.0:3000）
pnpm build        # Next 生产构建
pnpm start        # 启动生产服务
pnpm lint         # ESLint
pnpm cf:deploy    # 部署到 Cloudflare Workers
pnpm cf:preview   # Cloudflare 本地预览
```

## 10. Supabase 后台常用 SQL

```sql
-- 查看管理员
select id, email, role from public.profiles where role = 'admin';

-- 提权管理员（替换邮箱后执行）
update public.profiles set role = 'admin', updated_at = now()
where email = 'your-admin@example.com';

-- 检查某表数据
select * from public.wiki_pages limit 5;
```
