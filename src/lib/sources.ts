import "server-only";
import { promises as fs } from "fs";
import path from "path";

// 解析成长百科的资料总表 research/SOURCES.md。
// 只读不写：表格每一行 = 一条来源；「**V1 核心观点**：…」这类段落挂到对应编号下。

export const WIKI_ROOT = path.join(process.cwd(), "docs", "eoe-growth-wiki");
const SOURCES_FILE = path.join(WIKI_ROOT, "research", "SOURCES.md");

export type Source = {
  id: string; // V1
  tag?: string; // 「（补充）」「（借用）」
  category: string; // 所在的 ## 标题，如 VPE
  title: string;
  author?: string;
  origin?: string; // 「来源」列
  url?: string;
  date?: string;
  depth?: string; // 阅读程度原文
  summaryOnly: boolean; // 只读到摘要 → 引用需谨慎
  use?: string;
  noteLines: string[]; // 核心观点 / 最值得保留 / 推荐理由（Markdown 行）
};

/** 资料总表按 ## 分区后的结构；other 是表格和观点段落以外的内容（原样渲染） */
export type SourceCategory = { title: string; other: string; sources: Source[] };
export type SourcesDoc = {
  intro: string; // 第一个 ## 之前的说明
  categories: SourceCategory[];
  byId: Record<string, Source>;
};

const ID_RE = /^([A-Z]{1,3}\d{1,2})(.*)$/;
const NOTE_RE = /^\*\*([A-Z]{1,3}\d{1,2})[^*]*\*\*/;

function cells(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}
const isSeparator = (line: string) => /^\|[\s:|-]+\|?\s*$/.test(line.trim()) && line.includes("-");

function pick(row: Record<string, string>, ...keys: string[]) {
  for (const k of keys) if (row[k]) return row[k];
  return undefined;
}

export function parseSources(md: string): SourcesDoc {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const firstH2 = lines.findIndex((l) => l.startsWith("## "));
  const introLines = (firstH2 === -1 ? lines : lines.slice(0, firstH2)).filter(
    (l) => !l.startsWith("# ") && l.trim() !== "---",
  );
  const doc: SourcesDoc = { intro: tidy(introLines), categories: [], byId: {} };
  if (firstH2 === -1) return doc;

  let cat: SourceCategory | null = null;
  let other: string[] = [];
  let header: string[] | null = null;
  let note: Source | null = null;
  let rawTable = false; // 非来源表格（如「查过但未采用」），整张原样保留
  const finish = () => {
    if (cat) {
      cat.other = tidy(other);
      doc.categories.push(cat);
    }
  };

  for (let i = firstH2; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      finish();
      cat = { title: line.slice(3).trim(), other: "", sources: [] };
      other = [];
      header = null;
      note = null;
      rawTable = false;
      continue;
    }
    if (!cat) continue;
    const t = line.trim();

    // 表格：表头（下一行是分隔线）→ 数据行
    if (t.startsWith("|")) {
      if (rawTable) {
        other.push(line);
        continue;
      }
      if (isSeparator(t)) continue;
      if (isSeparator(lines[i + 1] ?? "")) {
        header = cells(t);
        if (!header.includes("编号")) {
          // 不是来源表（例如「查过但未采用」），原样保留
          rawTable = true;
          header = null;
          other.push(line);
        }
        continue;
      }
      if (header) {
        const row: Record<string, string> = {};
        cells(t).forEach((c, idx) => (row[header![idx] ?? `c${idx}`] = c));
        const m = (row["编号"] ?? "").match(ID_RE);
        if (m) {
          const url = pick(row, "链接");
          const depth = pick(row, "阅读程度");
          const src: Source = {
            id: m[1],
            tag: m[2].trim() || undefined,
            category: cat.title,
            title: pick(row, "标题") ?? m[1],
            author: pick(row, "作者/机构", "作者"),
            origin: pick(row, "来源"),
            url: url && /^https?:\/\//.test(url) ? url : undefined,
            date: pick(row, "时间"),
            depth,
            summaryOnly: !!depth && depth.includes("摘要"),
            use: pick(row, "用途"),
            noteLines: [],
          };
          cat.sources.push(src);
          doc.byId[src.id] = src;
          continue;
        }
      }
      other.push(line);
      continue;
    }
    header = null;
    rawTable = false;

    // 观点段落：以「**编号 …**」开头，后续非空行都属于它
    const nm = t.match(NOTE_RE);
    if (nm && doc.byId[nm[1]]) {
      note = doc.byId[nm[1]];
      note.noteLines.push(t);
      continue;
    }
    if (note && t !== "") {
      if (t === "---") {
        note = null;
        continue;
      }
      note.noteLines.push(t);
      continue;
    }
    note = null;
    if (t === "---") continue;
    other.push(line);
  }
  finish();
  return doc;
}

function tidy(lines: string[]) {
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

let cache: { mtime: number; doc: SourcesDoc } | null = null;

export async function getSources(): Promise<SourcesDoc> {
  try {
    const stat = await fs.stat(SOURCES_FILE);
    if (cache && cache.mtime === stat.mtimeMs) return cache.doc;
    const doc = parseSources(await fs.readFile(SOURCES_FILE, "utf8"));
    cache = { mtime: stat.mtimeMs, doc };
    return doc;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return { intro: "", categories: [], byId: {} };
    throw e;
  }
}

/** 传给浏览器的精简版（底部弹出的来源卡片用） */
export type SourceBrief = Pick<
  Source,
  "id" | "tag" | "title" | "author" | "origin" | "url" | "date" | "depth" | "summaryOnly" | "noteLines" | "category"
>;

export function briefs(doc: SourcesDoc, ids: Iterable<string>): Record<string, SourceBrief> {
  const out: Record<string, SourceBrief> = {};
  for (const id of ids) {
    const s = doc.byId[id];
    if (s) out[id] = s;
  }
  return out;
}
