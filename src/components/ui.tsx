import Link from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 小而通用的 UI 积木。页面都用这些拼，保持风格一致。

export function PageHeader({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold tracking-wide text-brand-ink">{eyebrow}</p>}
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">{title}</h1>
        {desc && <p className="mt-1.5 text-sm text-ink-2">{desc}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionTitle({ children, more }: { children: ReactNode; more?: { href: string; label: string } }) {
  return (
    <div className="mb-2.5 mt-7 flex items-baseline justify-between">
      <h2 className="text-base font-bold">{children}</h2>
      {more && (
        <Link href={more.href} className="text-sm text-ink-3 hover:text-brand-ink">
          {more.label} →
        </Link>
      )}
    </div>
  );
}

export function isExternal(url: string) {
  return /^https?:\/\//.test(url);
}

/** 链接按钮：外链新窗口打开；url 为空显示为「待补充」 */
export function LinkTile({
  label,
  url,
  sub,
  emoji,
  tone = "white",
}: {
  label: string;
  url?: string;
  sub?: string;
  emoji?: string;
  tone?: "white" | "brand" | "mint" | "sky" | "sun" | "grape";
}) {
  const tones = {
    white: "bg-surface border-line",
    brand: "bg-brand-soft border-transparent",
    mint: "bg-mint border-transparent",
    sky: "bg-sky border-transparent",
    sun: "bg-sun border-transparent",
    grape: "bg-grape border-transparent",
  };
  const inner = (
    <>
      {emoji && <span className="text-xl leading-none">{emoji}</span>}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{label}</span>
        <span className="block truncate text-xs text-ink-3">{url ? sub : "链接待补充"}</span>
      </span>
    </>
  );
  const cls = `flex items-center gap-2.5 rounded-2xl border px-3 py-3 ${tones[tone]}`;
  if (!url) return <div className={`${cls} opacity-55`}>{inner}</div>;
  return isExternal(url) ? (
    <a href={url} target="_blank" rel="noreferrer" className={`${cls} transition active:scale-[0.98] hover:shadow-sm`}>
      {inner}
    </a>
  ) : (
    <Link href={url} className={`${cls} transition active:scale-[0.98] hover:shadow-sm`}>
      {inner}
    </Link>
  );
}

export function Pill({ children, tone = "line" }: { children: ReactNode; tone?: "line" | "brand" | "mint" | "sun" }) {
  const tones = {
    line: "bg-white text-ink-2 border border-line",
    brand: "bg-brand-soft text-brand-ink",
    mint: "bg-mint text-mint-ink",
    sun: "bg-sun text-sun-ink",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${tones[tone]}`}>{children}</span>;
}

export function Markdown({ children, invert }: { children: string; invert?: boolean }) {
  return (
    <div className={invert ? "prose-eoe prose-invert" : "prose-eoe"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) =>
            href && isExternal(href) ? (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            ) : (
              <a href={href}>{children}</a>
            ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="card border-dashed px-5 py-8 text-center">
      <p className="font-semibold">{title}</p>
      {desc && <p className="mt-1 text-sm text-ink-2">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function formatDate(date: string, withWeekday = true) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date || "日期待定";
  const d = new Date(`${date}T00:00:00`);
  const wd = "日一二三四五六"[d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日${withWeekday ? ` 周${wd}` : ""}`;
}
