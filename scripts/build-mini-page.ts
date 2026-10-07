// 生成「EOE 成长百科」手机单页（小程序风格），给手机直接打开用。
//
//   npm run build:mini   →  dist-mini/eoe-growth-wiki.html
//
// 内容唯一来源仍是 docs/eoe-growth-wiki/：这里复用网站同一套解析（src/lib/content.ts、
// src/lib/sources.ts）和同一个 remark 插件（src/lib/wiki-remark.ts），只是把结果预先渲染成
// 静态 HTML 片段，塞进 scripts/mini-page/template.html。正文一个字不改。

import { promises as fs } from "fs";
import path from "path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { existingWikiFiles, getWikiDoc, listAllWiki, WIKI_GROUPS, type WikiDoc, type WikiSection } from "@/lib/content";
import { getSources } from "@/lib/sources";
import { remarkEoeWiki, type WikiRemarkOptions } from "@/lib/wiki-remark";
import { isConfirmedTitle, isOptionalTitle, navLabel, sectionKind } from "@/lib/wiki-kinds";

const ROOT = process.cwd();
const TEMPLATE = path.join(ROOT, "scripts", "mini-page", "template.html");
const OUT = path.join(ROOT, "dist-mini", "eoe-growth-wiki.html");

/* eslint-disable @typescript-eslint/no-explicit-any */
type HNode = { type: string; tagName?: string; value?: string; properties?: Record<string, any>; children?: HNode[] };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 站内地址 → 小页面里的路由（#officers-vpe / #handover …） */
function route(href: string): string | null {
  const [p] = href.split("#");
  if (p === "/wiki/handover") return "#handover";
  if (p === "/wiki/context") return "#context";
  if (p === "/wiki/sources") return "#sources";
  const m = p.match(/^\/wiki\/(officers|roles)\/([a-z0-9-]+)$/);
  return m ? `#${m[1]}-${m[2]}` : null;
}

const cls = (n: HNode) => ([] as string[]).concat(n.properties?.className ?? []);
const text = (value: string): HNode => ({ type: "text", value });
const el = (tagName: string, properties: Record<string, any>, children: HNode[] = []): HNode => ({
  type: "element",
  tagName,
  properties,
  children,
});

/** 把插件产出的标记元素换成小页面用的元素（来源按钮、徽章、勾选框、路由链接） */
function rehypeMini() {
  const visit = (node: HNode) => {
    if (!node.children) return;
    node.children = node.children.map((c) => {
      if (c.type !== "element") return c;
      const k = cls(c);
      const p = c.properties ?? {};
      if (k.includes("cred-ref")) {
        const id = String(p.dataRef);
        return p.dataMissing
          ? el("span", { className: ["ref", "ref-missing"], title: "资料总表里找不到这个编号" }, [text(`${id}?`)])
          : el("button", { type: "button", className: ["ref"], dataRef: id }, [text(id)]);
      }
      if (k.includes("cred-eoe")) {
        // 不显示确认日期（同网站）
        return el("span", { className: ["eoe"] }, [text("✓ EOE 已确认")]);
      }
      if (k.includes("cred-todo")) {
        const msg = (c.children?.[0]?.value ?? "").trim();
        return el("span", { className: ["todo"] }, [text(msg === "可选" ? "可选 · 欢迎补充" : `待 EOE 确认：${msg}`)]);
      }
      if (c.tagName === "li" && p.dataTask) {
        visit(c);
        return el("li", { className: ["task", ...cls(c)] }, [
          el("label", {}, [
            el("input", { type: "checkbox", dataKey: String(p.dataTask) }),
            el("span", { className: ["task-text"] }, c.children ?? []),
          ]),
        ]);
      }
      if (c.tagName === "a") {
        const href = String(p.href ?? "");
        const r = href.startsWith("/") ? route(href) : null;
        if (r) c.properties = { href: r };
        else if (/^https?:/.test(href)) c.properties = { href, target: "_blank", rel: "noreferrer" };
      }
      if (c.tagName === "table") {
        visit(c);
        return el("div", { className: ["table-wrap"] }, [c]);
      }
      visit(c);
      return c;
    });
  };
  return (tree: HNode) => visit(tree);
}

function makeRenderer(ctx: WikiRemarkOptions) {
  const proc = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkCjkFriendly)
    .use(remarkEoeWiki, ctx)
    .use(remarkRehype)
    .use(rehypeMini)
    .use(rehypeStringify);
  return (md: string) => (md.trim() ? String(proc.processSync(md)) : "");
}

function inlineMd(s: string | undefined) {
  if (!s) return "";
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\s][^*]*)\*/g, "<em>$1</em>");
}

function sectionData(s: WikiSection, render: (md: string) => string) {
  const kind = sectionKind(s);
  const whole = kind === "first" || kind === "eoe";
  return {
    id: s.id,
    num: s.num,
    label: s.label,
    nav: navLabel(s),
    kind,
    html: whole ? render(s.body) : "",
    intro: whole ? "" : render(s.intro),
    subs: whole
      ? []
      : s.subsections.map((sub) => {
          const lv = kind === "levels" ? sub.title.match(/^(60|80|90)\s*分/) : null;
          const [tag, ...rest] = sub.title.split(/[：:]/);
          return {
            title: sub.title,
            level: lv ? Number(lv[1]) : null,
            levelTag: lv ? tag : null,
            levelSub: lv ? rest.join("：") : null,
            tone: isConfirmedTitle(sub.title)
              ? "confirmed"
              : isOptionalTitle(sub.title)
                ? "optional"
                : kind === "stories"
                  ? "story"
                  : "plain",
            html: render(sub.body),
          };
        }),
  };
}

function docData(doc: WikiDoc, render: (md: string) => string) {
  return {
    heading: doc.heading,
    preamble: render(doc.preamble),
    sections: doc.sections.map((s) => sectionData(s, render)),
  };
}

async function main() {
  const [entries, context, handover, sources, existing] = await Promise.all([
    listAllWiki(),
    getWikiDoc("eoe-context"),
    getWikiDoc("handover"),
    getSources(),
    existingWikiFiles(),
  ]);
  const sourceIds = Object.keys(sources.byId);
  const renderFor = (file: string) => makeRenderer({ file, existing, sourceIds });

  const roles = entries.map((e) => {
    const render = renderFor(e.file);
    return {
      key: `${e.group}-${e.slug}`,
      group: e.group,
      title: e.title,
      nameZh: e.nameZh,
      subtitle: e.subtitle ?? "",
      summary: e.summary,
      emoji: e.emoji,
      confirmed: e.confirmedCount,
      preamble: render(e.preamble),
      sections: e.sections.map((s) => sectionData(s, render)),
    };
  });

  const srcRender = renderFor("../research/SOURCES.md");
  const payload = {
    groups: Object.fromEntries(Object.entries(WIKI_GROUPS).map(([k, v]) => [k, v.label])),
    roles,
    context: context ? docData(context, renderFor(context.file)) : null,
    handover: handover ? docData(handover, renderFor(handover.file)) : null,
    sources: {
      intro: srcRender(sources.intro),
      categories: sources.categories.map((c) => ({
        title: c.title,
        other: srcRender(c.other),
        items: c.sources.map((s) => ({
          id: s.id,
          tag: s.tag ?? "",
          title: inlineMd(s.title),
          author: inlineMd(s.author),
          origin: inlineMd(s.origin),
          url: s.url ?? "",
          date: s.date ?? "",
          depth: s.depth ?? "",
          summaryOnly: s.summaryOnly,
          use: inlineMd(s.use),
          notes: srcRender(s.noteLines.join("\n\n")),
          category: c.title,
        })),
      })),
    },
  };

  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  const template = await fs.readFile(TEMPLATE, "utf8");
  if (!template.includes("/*__WIKI_DATA__*/null")) throw new Error("template.html 里找不到数据占位符");
  const html = template.replace("/*__WIKI_DATA__*/null", () => json);
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, html, "utf8");
  const kb = Math.round(Buffer.byteLength(html) / 1024);
  console.log(`✓ ${path.relative(ROOT, OUT)}（${kb} KB）：${roles.length} 个角色，${sourceIds.length} 条来源`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
