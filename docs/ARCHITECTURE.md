# 架构说明 · EOE Club OS

## 选型

| 需求 | 选择 | 原因 |
|---|---|---|
| 框架 | Next.js 16 App Router | 一个仓库同时有页面和服务端逻辑；Vercel 一键部署；AI 最熟悉 |
| 语言 | TypeScript | 数据结构清晰，换人 / 换 AI 不容易改坏 |
| 样式 | Tailwind CSS v4 | 无需单独维护 CSS 文件；设计 token 在 `globals.css` |
| 内容 | Markdown + YAML（`content/`） | 非程序员也能改；Git 自带版本历史；研究 Agent 直接输出 Markdown |
| 数据 | Supabase（Postgres）或本地 JSON 文件 | 只有「会后记录」和「本周例会」需要写入；两种都零运维 |
| 写入 | Server Actions（`src/app/actions.ts`） | 无需单独 API 层 |
| 图表 | 纯 HTML/CSS | 只有两个简单图，不引图表库 |
| 字体 | 系统字体 | 国内访问稳定，不依赖 Google Fonts |

**刻意没有**：状态管理库、ORM、独立后端、微服务、登录系统、图表库、CMS。

## 数据流

```
             ┌──────────── 构建时 / 请求时读取 ────────────┐
content/*.md, *.yaml ──> src/lib/content.ts, config.ts ──> 页面（Server Components）
                                                                   │
用户填写表单 ──> Server Action (src/app/actions.ts) ──> Store ──> revalidatePath ──> 页面刷新
                                                         │
                                       ┌─────────────────┴─────────────────┐
                               local.ts（data/local-db.json）     supabase.ts（Supabase）
                               未配置 Supabase 时使用             配置了 SUPABASE_URL +
                                                                  SUPABASE_SERVICE_ROLE_KEY 时使用
```

- 成长百科页面在构建时静态生成（`generateStaticParams`），访问最快；内容更新需要重新部署（push 即自动部署）。
- 读数据库的页面调用 `getStore()`，其中 `await connection()` 会让页面按请求动态渲染。

## 数据结构（`src/lib/types.ts`）

**MeetingRecord（会后记录）**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string (uuid) | |
| date | YYYY-MM-DD | |
| theme | string | |
| memberCount | number | 会员出席 |
| guestCount | number | 嘉宾人数（≥ 各来源之和） |
| guestSources | `{source, count}[]` | 嘉宾来源计数 |
| preparedSpeeches | number | 备稿数量 |
| winners | string | 获奖者（自由文本） |
| reflection | string | 一句话复盘 |
| note | string? | 备注 |
| createdAt | ISO 时间 | |

**Meeting（本周例会，只存一条，kv 键 `current_meeting`）**：date、time、theme、location、meetingManager、toastmaster、roles `{role,name}[]`、agendaUrl、docUrl、signupUrl、voteUrl、extraLinks `{label,url,note}[]`、note、updatedAt。

**Tool（`content/tools.yaml`）**：id、name、category、url、purpose、note、tool（投票工具名）。

**WikiEntry（`content/officers|roles/*.md`）**：frontmatter `title, name_zh, emoji, order, summary, status, updated`；正文按 `## 标题` 切成章节。
- 「60/80/90 分」开头的章节 → 成长路线卡片
- 含「第一次」→ 顶部深色提示
- 含「EOE」→ 绿色实践笔记

**Workbench（`content/workbench/*.yaml`）**：title、name_zh、emoji、order、tagline、wiki、blocks[]；block 类型：`list | checklist | links | tools | wiki | guest-sources | text`。Checklist 勾选状态只存在浏览器 localStorage，按周/月自动换新——这是有意的：不做催办、不做任务系统。

Supabase 表结构：[`supabase/schema.sql`](../supabase/schema.sql)。改 `types.ts` 时同步改 schema 和 `store/supabase.ts` 的映射。

## 权限与安全

- v0.1 **没有登录**。网站链接只在俱乐部内部分享。
- 可选的 `EOE_WRITE_CODE`：设置后，写入（新增/删除记录、改本周例会）需要输入俱乐部口令。口令在服务端校验，浏览器只在本机 localStorage 记住用户输入。
- Supabase 只在服务端用 service role key 访问；表开启 RLS 且没有任何 policy，浏览器端无法直连。
- 会后记录**不保存嘉宾个人信息**，只有人数和来源。
- 用户填写的链接只允许 `http(s)://` 或站内 `/路径`，其余自动补 `https://`。

## 扩展指南

- **新增一个百科角色**：加一个 Markdown 文件，无需改代码。
- **新增一种工作台 block**：在 `src/lib/config.ts` 的 `WorkbenchBlock.type` 加类型，在 `src/app/workbench/[officer]/page.tsx` 的 `Block` 里加一个 case。
- **新增一个需要写入的数据**：在 `types.ts` 定义 → `Store` 接口加方法 → `local.ts` 和 `supabase.ts` 各实现一次 → `schema.sql` 加表 → `actions.ts` 加 Server Action。
- **换数据库**：只需实现 `Store` 接口（`src/lib/store/index.ts`）。
