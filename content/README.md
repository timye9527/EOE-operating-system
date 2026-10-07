# content/ —— EOE Club OS 的运营配置

这里的文件改完提交（或直接在 GitHub 网页上编辑）即上线，**不需要改任何代码**。

| 路径 | 是什么 | 怎么改 |
|---|---|---|
| `workbench/*.yaml` | 官员工作台（每个官员一个） | 改 YAML |
| `tools.yaml` | 外部工具 / 资源 / 投票模板入口 | 改 YAML；`url` 留空 = 待补充 |
| `guest-sources.yaml` | 嘉宾来源选项 | 改 YAML |
| `meeting.yaml` | 「下一场例会」的默认值（可选；日期一过自动隐藏） | 一般不用改 |
| `wiki-display.yaml` | 成长百科卡片的图标和排序（只管显示） | 可选 |

**成长百科不在这里**，在 [`docs/eoe-growth-wiki/`](../docs/eoe-growth-wiki/)：

- 新增角色：往 `docs/eoe-growth-wiki/content/officers/` 或 `.../roles/` 放一个 `.md`，按现有角色的 0–9 节结构写，文件名用英文小写和短横线（如 `meeting-manager.md`），自动出现在网站上。
- EOE 背景：`content/eoe-context.md`；官员交接：`content/handover.md`；资料来源：`research/SOURCES.md`。

原则：没有真实信息就留空 / 写「待补充」，不要放假的示例数据。
