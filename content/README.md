# content/ —— EOE Club OS 的全部内容

这里的文件改完提交（或直接在 GitHub 网页上编辑）即上线，**不需要改任何代码**。

| 路径 | 是什么 | 怎么改 |
|---|---|---|
| `officers/*.md` | 成长百科 · 俱乐部官员（President、VPE…） | 一个角色一个 Markdown 文件 |
| `roles/*.md` | 成长百科 · 例会角色（Toastmaster、Timer…） | 同上 |
| `notes/<slug>/*.md` | 追加的研究资料 / 前人经验，挂在对应角色页面下 | 新建文件即可，`<slug>` = 角色文件名 |
| `workbench/*.yaml` | 官员工作台（每个官员一个） | 改 YAML |
| `tools.yaml` | 外部工具 / 资源 / 投票模板入口 | 改 YAML |
| `guest-sources.yaml` | 嘉宾来源选项 | 改 YAML |
| `meeting.yaml` | 本周例会的默认值（网站上编辑后以数据库为准） | 一般不用改 |
| `_templates/` | 新角色 / 新资料的模板 | 复制后再写 |

新增一个角色：复制 `_templates/role-template.md` → 放进 `officers/` 或 `roles/` → 写内容 → 提交。
研究 Agent 输出的资料：按 `_templates/note-template.md` 的格式放进 `notes/<slug>/`。
