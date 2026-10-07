<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# EOE Club OS · 给 AI 编程助手的项目规则

开始任何改动前，先读：`README.md` → `docs/PRODUCT.md` → `docs/ARCHITECTURE.md` → `docs/BACKLOG.md`。

1. **不加一级栏目。** 固定为：首页 / 本周例会 / 成长百科 / 官员工作台 / 运营（记录 + 看板）。导航在 `src/components/Nav.tsx`。
2. **内容不写死在组件里。** 工作台、工具、嘉宾来源在 `content/`；成长百科在 `docs/eoe-growth-wiki/`（唯一来源）。只改内容时不要碰 `src/`。
   - **不要改成长百科正文**，也不要编造任何【EOE 已确认】或第 9.2 / 9.3 节内容；发现格式问题记录到 `docs/plan-growth-wiki.md`。
   - 系统里不要放假的示例数据（假名字、假链接）冒充 EOE 的经验或信息；没有就留空 / 写「待补充」。
3. **BACKLOG 里的功能默认不做**（接龙、聊天、投票系统、计时器、积分、CRM、催办、登录权限……），除非用户明确要求。
4. **会后记录必须保持 1 分钟内可完成。** 不要给表单加必填字段。
5. **数据结构变更**要同时改：`src/lib/types.ts`、`src/lib/store/local.ts`、`src/lib/store/supabase.ts`、`supabase/schema.sql`、`docs/ARCHITECTURE.md`。
6. **移动端优先。** 改 UI 后用 iPhone 宽度（390px）检查，不能出现横向滚动。
7. **不提交任何 Secret。** `.env*` 已忽略，只提交 `.env.example`。
8. 提交前运行 `npm run lint && npm run build`。
9. 文案用中文；代码注释简短、用中文。
