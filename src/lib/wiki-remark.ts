import path from "path";

// 成长百科的 remark 插件：只改「怎么显示」，不改任何文字。
//   【EOE 已确认】/（EOE 已确认）→ 绿色徽章，所在条目高亮（原文带日期也能识别，但日期不显示）
//   [V1] 等来源编号                  → 可点开的来源标签
//   （推论…）                         → 推论标签
//   <!-- TODO(EOE): … -->              → 「待 EOE 确认 / 可选补充」小标签（其他 HTML 一律不渲染）
//   - [ ] 清单                         → 可勾选（勾选状态按 文件 + 条目文字 保存在本机）
//   相对链接 / content/xxx.md 路径      → 站内链接

/* eslint-disable @typescript-eslint/no-explicit-any */
type Node = { type: string; value?: string; url?: string; checked?: boolean | null; children?: Node[]; data?: any };

export type WikiRemarkOptions = {
  file: string; // 当前文件，相对 content/，如 officers/vpe.md
  existing: string[]; // 已存在的文件（相对 content/）
  sourceIds: string[]; // SOURCES.md 里有的编号
};

const TOKEN_RE =
  /【EOE 已确认([^】]*)】|（EOE 已确认）|（推论[^）]*）|\[([A-Z]{1,3}\d{1,2})\]|content\/((?:officers|roles)\/[a-z0-9-]+|handover|eoe-context)\.md/g;

const span = (className: string, children: Node[], props: Record<string, unknown> = {}): Node => ({
  type: "emphasis",
  data: { hName: "span", hProperties: { className: [className], ...props } },
  children,
});
const text = (value: string): Node => ({ type: "text", value });

/** 站内地址：成长百科文件 → 页面路由 */
export function wikiHref(rel: string): string | null {
  const r = rel.replace(/^\.\//, "");
  if (r === "handover.md") return "/wiki/handover";
  if (r === "eoe-context.md") return "/wiki/context";
  if (/(^|\/)research\/SOURCES\.md$/.test(r)) return "/wiki/sources";
  const m = r.match(/^(officers|roles)\/([a-z0-9-]+)\.md$/);
  return m ? `/wiki/${m[1]}/${m[2]}` : null;
}

export function hashText(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function toText(n: Node): string {
  if (n.type === "text" || n.type === "inlineCode") return n.value ?? "";
  return (n.children ?? []).map(toText).join("");
}

export function remarkEoeWiki(opts: WikiRemarkOptions) {
  const existing = new Set(opts.existing);
  const known = new Set(opts.sourceIds);
  const dir = path.posix.dirname(opts.file);

  function resolve(url: string): { href: string | null; broken: boolean } {
    if (/^(https?:|mailto:|#|\/)/.test(url)) return { href: url, broken: false };
    const [p, hash] = url.split("#");
    const rel = path.posix.normalize(path.posix.join(dir, p));
    const href = wikiHref(rel);
    const exists = /SOURCES\.md$/.test(rel) || existing.has(rel);
    if (!href || !exists) return { href: null, broken: true };
    return { href: hash ? `${href}#${hash}` : href, broken: false };
  }

  function tokenize(value: string, allowInference = true): Node[] {
    const out: Node[] = [];
    let last = 0;
    for (const m of value.matchAll(TOKEN_RE)) {
      const [all, date, refId, path_] = m;
      const at = m.index ?? 0;
      if (all.startsWith("（推论") && !allowInference) continue;
      if (at > last) out.push(text(value.slice(last, at)));
      if (all.startsWith("【EOE") || all === "（EOE 已确认）") {
        out.push(span("cred-eoe", [text(all)], { dataDate: (date ?? "").replace(/^[\s：:，,]+/, "").trim() }));
      } else if (all.startsWith("（推论")) {
        const inner = all.slice(1, -1); // 推论，结合 [V2] …
        out.push(
          span("cred-inf", [text("（"), span("cred-inf-tag", [text("推论")]), ...tokenize(inner.slice(2), false), text("）")]),
        );
      } else if (refId) {
        out.push(span("cred-ref", [text(refId)], { dataRef: refId, dataMissing: known.has(refId) ? undefined : "1" }));
      } else if (path_) {
        const rel = `${path_}.md`;
        const href = wikiHref(rel);
        out.push(href && existing.has(rel) ? { type: "link", url: href, children: [text(all)] } : text(all));
      }
      last = at + all.length;
    }
    if (last < value.length) out.push(text(value.slice(last)));
    return out.length ? out : [text(value)];
  }

  function walk(node: Node, inLink: boolean) {
    if (!node.children) return;
    const next: Node[] = [];
    for (const child of node.children) {
      if (child.type === "text" && !inLink) {
        next.push(...tokenize(child.value ?? ""));
        continue;
      }
      if (child.type === "html") {
        const todo = (child.value ?? "").match(/<!--\s*TODO\(EOE\):?\s*([\s\S]*?)\s*-->/);
        if (todo) next.push(span("cred-todo", [text(todo[1] || "待补充")]));
        continue; // 其他原始 HTML 不渲染
      }
      if (child.type === "link") {
        const { href, broken } = resolve(child.url ?? "");
        if (broken) {
          next.push(span("wiki-broken", child.children ?? [], { title: "这个页面还没有建立" }));
          continue;
        }
        child.url = href ?? child.url;
      }
      if (child.type === "listItem" && typeof child.checked === "boolean") {
        // 去掉 GFM 自带的禁用勾选框，换成可勾选的版本
        const key = `${opts.file}:${hashText(toText(child).trim())}`;
        child.checked = null;
        child.data = { ...child.data, hProperties: { ...child.data?.hProperties, dataTask: key } };
        node.data = { ...node.data, hProperties: { ...node.data?.hProperties, className: ["task-list"] } };
      }
      walk(child, inLink || child.type === "link");
      next.push(child);
    }
    node.children = next;
  }

  /** 含有 EOE 已确认徽章的条目 / 段落整行高亮 */
  function mark(node: Node): boolean {
    let has = false;
    for (const c of node.children ?? []) {
      const own = c.data?.hProperties?.className?.includes?.("cred-eoe");
      const inside = mark(c);
      if ((own || inside) && (c.type === "listItem" || c.type === "paragraph")) {
        const cls = c.data?.hProperties?.className ?? [];
        // 列表项里的段落不重复标记
        if (!(c.type === "paragraph" && node.type === "listItem")) {
          c.data = { ...c.data, hProperties: { ...c.data?.hProperties, className: [...cls, "eoe-line"] } };
        }
      }
      has = has || own || inside;
    }
    return has;
  }

  return (tree: Node) => {
    walk(tree, false);
    mark(tree);
  };
}
