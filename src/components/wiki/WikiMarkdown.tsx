import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkCjkFriendly from "remark-cjk-friendly";
import { remarkEoeWiki, type WikiRemarkOptions } from "@/lib/wiki-remark";
import { SourceRef } from "./SourceSheet";
import { TaskItem } from "./TaskItem";

// 渲染成长百科的一段 Markdown：可信度标记、来源标签、可勾选清单、站内链接。

const has = (className: string | undefined, c: string) => (className ?? "").split(" ").includes(c);

const components: Components = {
  span: ({ node, className, children }) => {
    const p = node?.properties ?? {};
    if (has(className, "cred-ref")) return <SourceRef id={String(p.dataRef)} missing={!!p.dataMissing} />;
    if (has(className, "cred-eoe")) {
      // 不显示确认日期：规则长期有效，日期只会让人以为需要定期更新
      return (
        <span className="cred-eoe" title="EOE 自己确认过的规则，优先级最高">
          ✓ EOE 已确认
        </span>
      );
    }
    if (has(className, "cred-todo")) {
      const msg = String((node?.children?.[0] as { value?: string } | undefined)?.value ?? "");
      return (
        <span className="cred-todo" title="原文标记：TODO(EOE)">
          {msg === "可选" ? "可选 · 欢迎补充" : `待 EOE 确认：${msg}`}
        </span>
      );
    }
    if (has(className, "wiki-broken")) {
      return (
        <span className="wiki-broken" title="这个页面还没有建立">
          {children}
        </span>
      );
    }
    return <span className={className}>{children}</span>;
  },
  li: ({ node, className, children }) => {
    const key = node?.properties?.dataTask;
    if (key) return <TaskItem storageKey={String(key)} className={className}>{children}</TaskItem>;
    return <li className={className}>{children}</li>;
  },
  a: ({ href, children }) => {
    if (!href) return <>{children}</>;
    if (/^https?:\/\//.test(href)) {
      return (
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    }
    return <Link href={href}>{children}</Link>;
  },
};

export function WikiMarkdown({ md, ctx, invert }: { md: string; ctx: WikiRemarkOptions; invert?: boolean }) {
  if (!md.trim()) return null;
  return (
    <div className={invert ? "prose-eoe prose-invert" : "prose-eoe"}>
      <ReactMarkdown
        // cjk-friendly：让「**即兴主持（Topicsmaster）**的」这类紧挨中文标点的粗体也能生效
        remarkPlugins={[remarkGfm, remarkCjkFriendly, [remarkEoeWiki, ctx]]}
        components={components}
        skipHtml
      >
        {md}
      </ReactMarkdown>
    </div>
  );
}
