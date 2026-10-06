import "server-only";
import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";

// 成长百科内容加载器。
// 内容全部在 content/officers、content/roles（每个角色一个 .md），
// 以及 content/notes/<slug>/*.md（追加的研究资料 / 经验，可以无限加）。
// 新增或修改内容 = 改 Markdown 文件，不需要动任何 React 代码。

const CONTENT_DIR = path.join(process.cwd(), "content");

export const WIKI_GROUPS = {
  officers: { label: "俱乐部官员", en: "Club Officers", desc: "一届任期里，让俱乐部持续运转的人" },
  roles: { label: "例会角色", en: "Meeting Roles", desc: "每一场例会里，让会议精彩的人" },
} as const;

export type WikiGroup = keyof typeof WIKI_GROUPS;

export type SectionKind = "normal" | "level" | "first-time" | "eoe";

export type WikiSection = {
  id: string;
  title: string;
  body: string; // Markdown
  kind: SectionKind;
  level?: 60 | 80 | 90;
};

export type WikiNote = {
  slug: string;
  title: string;
  date?: string;
  source?: string;
  author?: string;
  body: string;
};

export type WikiEntry = {
  group: WikiGroup;
  slug: string;
  title: string; // 英文名，如 VPE
  nameZh: string; // 中文名，如 教育副主席
  summary: string; // 一句话理解（卡片上展示）
  emoji: string;
  order: number;
  status: "draft" | "reviewed";
  updated?: string;
  sections: WikiSection[];
  notes: WikiNote[];
};

/** 标准章节（新角色请照 content/_templates/role-template.md 写） */
export const STANDARD_SECTIONS = [
  "一句话理解",
  "为什么值得做",
  "职责",
  "会前",
  "会中",
  "会后",
  "60 分怎么做",
  "80 分怎么做",
  "90 分怎么做",
  "前人经验",
  "常见踩坑",
  "第一次做只需要记住什么",
  "EOE 实践笔记",
  "模板",
  "外部资料",
];

function classify(title: string): Pick<WikiSection, "kind" | "level"> {
  const m = title.match(/^(60|80|90)\s*分/);
  if (m) return { kind: "level", level: Number(m[1]) as 60 | 80 | 90 };
  if (title.includes("第一次")) return { kind: "first-time" };
  if (title.includes("EOE")) return { kind: "eoe" };
  return { kind: "normal" };
}

/** 把 Markdown 正文按 `## 标题` 切成章节 */
export function splitSections(body: string): WikiSection[] {
  const sections: WikiSection[] = [];
  let current: { title: string; lines: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const text = current.lines.join("\n").trim();
    if (text) {
      sections.push({ id: `s${sections.length + 1}`, title: current.title, body: text, ...classify(current.title) });
    }
  };
  for (const line of body.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (h) {
      flush();
      current = { title: h[1], lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  flush();
  return sections;
}

async function readDirSafe(dir: string) {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

const str = (v: unknown) => (v == null ? undefined : v instanceof Date ? v.toISOString().slice(0, 10) : String(v));

async function loadNotes(slug: string): Promise<WikiNote[]> {
  const dir = path.join(CONTENT_DIR, "notes", slug);
  const files = (await readDirSafe(dir)).filter((f) => f.endsWith(".md"));
  const notes = await Promise.all(
    files.map(async (file) => {
      const { data, content } = matter(await fs.readFile(path.join(dir, file), "utf8"));
      return {
        slug: file.replace(/\.md$/, ""),
        title: str(data.title) ?? file.replace(/\.md$/, ""),
        date: str(data.date),
        source: str(data.source),
        author: str(data.author),
        body: content.trim(),
      };
    }),
  );
  return notes.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

async function loadEntry(group: WikiGroup, file: string): Promise<WikiEntry> {
  const slug = file.replace(/\.md$/, "");
  const raw = await fs.readFile(path.join(CONTENT_DIR, group, file), "utf8");
  const { data, content } = matter(raw);
  const sections = splitSections(content);
  const oneLiner = sections.find((s) => s.title.includes("一句话"))?.body;
  return {
    group,
    slug,
    title: str(data.title) ?? slug,
    nameZh: str(data.name_zh) ?? "",
    summary: str(data.summary) ?? oneLiner?.split("\n")[0] ?? "",
    emoji: str(data.emoji) ?? "📘",
    order: Number(data.order ?? 999),
    status: data.status === "reviewed" ? "reviewed" : "draft",
    updated: str(data.updated),
    sections,
    notes: await loadNotes(slug),
  };
}

export async function listWiki(group: WikiGroup): Promise<WikiEntry[]> {
  const files = (await readDirSafe(path.join(CONTENT_DIR, group))).filter(
    (f) => f.endsWith(".md") && !f.startsWith("_"),
  );
  const entries = await Promise.all(files.map((f) => loadEntry(group, f)));
  return entries.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export async function getWiki(group: string, slug: string): Promise<WikiEntry | null> {
  if (!(group in WIKI_GROUPS) || !/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return await loadEntry(group as WikiGroup, `${slug}.md`);
  } catch {
    return null;
  }
}

export function isWikiGroup(g: string): g is WikiGroup {
  return g in WIKI_GROUPS;
}
