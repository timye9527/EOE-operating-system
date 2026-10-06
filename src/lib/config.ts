import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { load as loadYamlText } from "js-yaml";
import type { LinkItem, Meeting, Tool, ToolCategory } from "@/lib/types";

// YAML 配置加载器：工具/资源、嘉宾来源、官员工作台、本周例会默认值。
// 全部在 content/ 下，改 YAML 即可，不需要改代码。

const CONTENT_DIR = path.join(process.cwd(), "content");

async function loadYaml<T>(rel: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(CONTENT_DIR, rel), "utf8");
    return (loadYamlText(raw) as T) ?? fallback;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw new Error(`content/${rel} 解析失败：${(e as Error).message}`);
  }
}

// ———— 工具 / 资源 ————

export async function getTools(): Promise<{ categories: ToolCategory[]; tools: Tool[] }> {
  const data = await loadYaml<{ categories?: ToolCategory[]; tools?: Tool[] }>("tools.yaml", {});
  return { categories: data.categories ?? [], tools: data.tools ?? [] };
}

// ———— 嘉宾来源 ————

export async function getGuestSources(): Promise<string[]> {
  const data = await loadYaml<{ sources?: string[] }>("guest-sources.yaml", {});
  return data.sources ?? ["朋友邀请", "其他"];
}

// ———— 本周例会默认值（数据库里还没有时使用） ————

export async function getMeetingSeed(): Promise<Meeting> {
  const m = await loadYaml<Omit<Partial<Meeting>, "date"> & { date?: string | Date }>("meeting.yaml", {});
  return {
    date: m.date instanceof Date ? m.date.toISOString().slice(0, 10) : String(m.date ?? ""),
    time: String(m.time ?? ""),
    theme: m.theme ?? "",
    location: m.location,
    meetingManager: m.meetingManager,
    toastmaster: m.toastmaster,
    roles: m.roles ?? [],
    agendaUrl: m.agendaUrl,
    docUrl: m.docUrl,
    signupUrl: m.signupUrl,
    voteUrl: m.voteUrl,
    extraLinks: m.extraLinks ?? [],
    note: m.note,
  };
}

// ———— 官员工作台 ————

export type WorkbenchBlock = {
  title: string;
  /**
   * list: 普通列表 · checklist: 可勾选（勾选状态存在本机浏览器）
   * links: 模板/链接 · tools: 引用 tools.yaml 的工具 id · wiki: 引用成长百科
   * guest-sources: 自动显示嘉宾来源统计 · text: 一段 Markdown
   */
  type: "list" | "checklist" | "links" | "tools" | "wiki" | "guest-sources" | "text";
  /** checklist 的勾选多久清空一次 */
  reset?: "week" | "month" | "never";
  hint?: string;
  items?: (string | LinkItem)[];
  text?: string;
};

export type Workbench = {
  slug: string;
  title: string;
  nameZh: string;
  emoji: string;
  tagline: string;
  wiki?: string; // 例如 officers/vpe
  order: number;
  blocks: WorkbenchBlock[];
};

export async function listWorkbenches(): Promise<Workbench[]> {
  let files: string[] = [];
  try {
    files = (await fs.readdir(path.join(CONTENT_DIR, "workbench"))).filter((f) => /\.ya?ml$/.test(f));
  } catch {
    return [];
  }
  const all = await Promise.all(files.map((f) => getWorkbenchFile(f)));
  return all.sort((a, b) => a.order - b.order);
}

async function getWorkbenchFile(file: string): Promise<Workbench> {
  const d = await loadYaml<Partial<Workbench> & { name_zh?: string }>(`workbench/${file}`, {});
  return {
    slug: file.replace(/\.ya?ml$/, ""),
    title: d.title ?? file,
    nameZh: d.name_zh ?? d.nameZh ?? "",
    emoji: d.emoji ?? "🧰",
    tagline: d.tagline ?? "",
    wiki: d.wiki,
    order: Number(d.order ?? 999),
    blocks: d.blocks ?? [],
  };
}

export async function getWorkbench(slug: string): Promise<Workbench | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const all = await listWorkbenches();
  return all.find((w) => w.slug === slug) ?? null;
}
