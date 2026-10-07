import "server-only";
import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";
import { load as loadYamlText } from "js-yaml";
import { WIKI_ROOT } from "@/lib/sources";

// 成长百科加载器。唯一来源：docs/eoe-growth-wiki/content/
//   officers/*.md → 俱乐部官员；roles/*.md → 会议角色
//   eoe-context.md、handover.md → 通用文档
// 新增角色 = 往对应目录放一个 .md，不需要改代码。正文只读，不做任何改写。

const WIKI_CONTENT = path.join(WIKI_ROOT, "content");
const DISPLAY_FILE = path.join(process.cwd(), "content", "wiki-display.yaml");

export const WIKI_GROUPS = {
  officers: { label: "俱乐部官员", en: "Club Officers", desc: "一届任期里，让俱乐部持续运转的人" },
  roles: { label: "会议角色", en: "Meeting Roles", desc: "每一场例会里，让会议精彩的人" },
} as const;

export type WikiGroup = keyof typeof WIKI_GROUPS;

export type WikiSubsection = { title: string; body: string };

export type WikiSection = {
  id: string; // 锚点，如 s8
  num: number | null; // 0–9；没有编号的 ## 标题为 null
  label: string; // 去掉编号后的标题
  title: string; // 原标题
  intro: string; // 第一个 ### 之前的内容
  subsections: WikiSubsection[];
  body: string; // 整节原文
};

export type WikiEntry = {
  group: WikiGroup;
  slug: string;
  file: string; // 相对 content/ 的路径，如 officers/vpe.md（勾选状态、链接解析都用它）
  heading: string; // 一级标题原文
  title: string; // 英文 / 简称，如 VPE
  nameZh: string; // 中文名，如 教育副主席
  subtitle?: string; // 括号里的全称，如 Vice President Education
  summary: string; // 第 1 节「一句话理解」的第一段（纯文本）
  emoji: string;
  order: number;
  preamble: string; // 一级标题和第一个 ## 之间的内容（来源说明等）
  sections: WikiSection[];
  confirmedCount: number; // 【EOE 已确认】条数
  updated?: string;
};

/** 通用文档（eoe-context.md / handover.md） */
export type WikiDoc = {
  slug: string;
  file: string;
  heading: string;
  preamble: string;
  sections: WikiSection[];
};

const CONFIRMED_RE = /【EOE 已确认[^】]*】|（EOE 已确认）/g;

/** 文件名规则：英文小写、数字、短横线，如 meeting-manager.md（网址就是它，必须全站一致） */
const FILE_RE = /^[a-z0-9-]+\.md$/;

export function countConfirmed(md: string) {
  return (md.match(CONFIRMED_RE) ?? []).length;
}

/** 把正文切成：一级标题、前言、## 节（节内再按 ### 切） */
export function splitDoc(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let heading = "";
  const pre: string[] = [];
  const raw: { title: string; lines: string[] }[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence && !heading && /^#\s+/.test(line) && raw.length === 0) {
      heading = line.replace(/^#\s+/, "").trim();
      continue;
    }
    const h2 = !inFence && line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (h2) {
      raw.push({ title: h2[1], lines: [] });
    } else if (raw.length) {
      raw[raw.length - 1].lines.push(line);
    } else {
      pre.push(line);
    }
  }
  const sections: WikiSection[] = raw.map((r, i) => {
    const m = r.title.match(/^(\d+)\s*[.、．]\s*(.+)$/);
    const num = m ? Number(m[1]) : null;
    const body = r.lines.join("\n").trim();
    const { intro, subsections } = splitSub(body);
    return {
      id: num !== null ? `s${num}` : `x${i + 1}`,
      num,
      label: m ? m[2] : r.title,
      title: r.title,
      intro,
      subsections,
      body,
    };
  });
  return { heading, preamble: pre.join("\n").trim(), sections };
}

function splitSub(body: string) {
  const lines = body.split("\n");
  const intro: string[] = [];
  const subs: { title: string; lines: string[] }[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const h3 = !inFence && line.match(/^###\s+(.+?)\s*#*\s*$/);
    if (h3) subs.push({ title: h3[1], lines: [] });
    else if (subs.length) subs[subs.length - 1].lines.push(line);
    else intro.push(line);
  }
  return {
    intro: intro.join("\n").trim(),
    subsections: subs.map((s) => ({ title: s.title, body: s.lines.join("\n").trim() })),
  };
}

/** 「教育副主席 VPE（Vice President Education）」→ 中文名 / 英文名 / 全称 */
export function parseHeading(h: string) {
  let head = h.trim();
  let subtitle: string | undefined;
  const paren = head.match(/^(.*?)\s*[（(]([^（）()]+)[）)]\s*$/);
  if (paren) {
    head = paren[1].trim();
    subtitle = paren[2].trim();
  }
  const m = head.match(/^([^A-Za-z]*?)\s*([A-Za-z].*)$/);
  const nameZh = (m ? m[1] : head).trim();
  const title = (m ? m[2] : head).trim();
  return { nameZh: nameZh || title, title: title || nameZh, subtitle };
}

/** 去掉 Markdown 记号，用于卡片摘要 */
function plain(md: string) {
  return md
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[[A-Z]{1,3}\d{1,2}\]/g, "")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const str = (v: unknown) => (v == null ? undefined : v instanceof Date ? v.toISOString().slice(0, 10) : String(v));

type Display = Partial<Record<WikiGroup, Record<string, { emoji?: string; order?: number }>>>;

async function loadDisplay(): Promise<Display> {
  try {
    return (loadYamlText(await fs.readFile(DISPLAY_FILE, "utf8")) as Display) ?? {};
  } catch {
    return {};
  }
}

async function readDirSafe(dir: string) {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

async function loadEntry(group: WikiGroup, file: string, display: Display): Promise<WikiEntry> {
  const slug = file.replace(/\.md$/, "");
  const raw = await fs.readFile(path.join(WIKI_CONTENT, group, file), "utf8");
  const { data, content } = matter(raw);
  const doc = splitDoc(content);
  // frontmatter 的 title 通常是完整标题（「计时官 Timer」），和一级标题一样拆成中文名 / 英文名
  const parsed = parseHeading(str(data.title) ?? (doc.heading || slug));
  const oneLiner = doc.sections.find((s) => s.num === 1 || s.label.includes("一句话"));
  const firstPara = oneLiner?.intro.split(/\n\s*\n/)[0] ?? "";
  const disp = display[group]?.[slug] ?? {};
  // frontmatter 字段名还没最终确定，常见写法都兼容；有 frontmatter 时优先
  return {
    group,
    slug,
    file: `${group}/${file}`,
    heading: doc.heading || slug,
    title: str(data.title_en ?? data.name_en) ?? parsed.title,
    nameZh: str(data.title_zh ?? data.name_zh ?? data.zh) ?? parsed.nameZh,
    subtitle: str(data.subtitle ?? data.full_name) ?? parsed.subtitle ?? parseHeading(doc.heading || slug).subtitle,
    summary: str(data.summary ?? data.one_liner) ?? plain(firstPara),
    emoji: str(data.emoji) ?? disp.emoji ?? "📘",
    order: Number(data.order ?? disp.order ?? 999),
    preamble: doc.preamble,
    sections: doc.sections,
    confirmedCount: countConfirmed(content),
    updated: str(data.updated ?? data.last_updated),
  };
}

/** 不符合文件名规则、因此没有显示的 .md（成长百科首页会提示，免得新文件「消失」了没人发现） */
export async function skippedWikiFiles(): Promise<string[]> {
  const out: string[] = [];
  for (const g of Object.keys(WIKI_GROUPS)) {
    for (const f of await readDirSafe(path.join(WIKI_CONTENT, g))) {
      if (f.endsWith(".md") && !FILE_RE.test(f) && !f.startsWith("_") && f.toLowerCase() !== "readme.md") {
        out.push(`${g}/${f}`);
      }
    }
  }
  return out;
}

export async function listWiki(group: WikiGroup): Promise<WikiEntry[]> {
  const files = (await readDirSafe(path.join(WIKI_CONTENT, group))).filter((f) => FILE_RE.test(f));
  const display = await loadDisplay();
  const entries = await Promise.all(files.map((f) => loadEntry(group, f, display)));
  return entries.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

export async function listAllWiki(): Promise<WikiEntry[]> {
  const groups = await Promise.all((Object.keys(WIKI_GROUPS) as WikiGroup[]).map((g) => listWiki(g)));
  return groups.flat();
}

export async function getWiki(group: string, slug: string): Promise<WikiEntry | null> {
  if (!isWikiGroup(group) || !/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return await loadEntry(group, `${slug}.md`, await loadDisplay());
  } catch {
    return null;
  }
}

/** eoe-context / handover 这类通用文档 */
export async function getWikiDoc(slug: "eoe-context" | "handover"): Promise<WikiDoc | null> {
  try {
    const { content } = matter(await fs.readFile(path.join(WIKI_CONTENT, `${slug}.md`), "utf8"));
    const doc = splitDoc(content);
    return { slug, file: `${slug}.md`, heading: doc.heading, preamble: doc.preamble, sections: doc.sections };
  } catch {
    return null;
  }
}

/** 已存在的页面集合，用于把正文里的相对链接 / 文件路径变成站内链接 */
export async function existingWikiFiles(): Promise<string[]> {
  const out: string[] = [];
  for (const g of Object.keys(WIKI_GROUPS)) {
    for (const f of await readDirSafe(path.join(WIKI_CONTENT, g))) if (FILE_RE.test(f)) out.push(`${g}/${f}`);
  }
  for (const f of ["eoe-context.md", "handover.md"]) {
    if ((await readDirSafe(WIKI_CONTENT)).includes(f)) out.push(f);
  }
  return out;
}

export function isWikiGroup(g: string): g is WikiGroup {
  return g in WIKI_GROUPS;
}

/** 收集一段 Markdown 里引用到的来源编号 */
export function collectRefs(md: string, into = new Set<string>()) {
  for (const m of md.matchAll(/\[([A-Z]{1,3}\d{1,2})\]/g)) into.add(m[1]);
  return into;
}
