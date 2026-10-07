import type { WikiSection } from "@/lib/content";
import type { WikiRemarkOptions } from "@/lib/wiki-remark";
import { WikiMarkdown } from "./WikiMarkdown";
import { isConfirmedTitle, isOptionalTitle, navLabel, sectionKind, type SectionKind } from "@/lib/wiki-kinds";

// 成长百科各节的展示方式。结构来自 Markdown 本身（## N. 标题 / ### 小标题），
// 这里只决定样式：第 0 节和 9.2 是 EOE 已确认（绿）、第 5 节是 60/80/90 阶梯、
// 第 6 节是前人经验卡片、第 8 节是可勾选的「明天第一次做」。

type Kind = SectionKind;
export { sectionKind, navLabel };

const LEVEL = {
  60: { cls: "bg-sky text-sky-ink", bar: "bg-sky-ink/70 w-3/5" },
  80: { cls: "bg-mint text-mint-ink", bar: "bg-mint-ink/70 w-4/5" },
  90: { cls: "bg-brand-soft text-brand-ink", bar: "bg-brand w-[90%]" },
} as const;

export function SectionView({ s, ctx }: { s: WikiSection; ctx: WikiRemarkOptions }) {
  const kind = sectionKind(s);
  const head = (
    <h2 className="mb-2 flex items-baseline gap-2 text-lg font-bold">
      {s.num !== null && <span className="text-sm font-black text-brand">{s.num}</span>}
      <span>{s.label}</span>
    </h2>
  );

  if (kind === "first") {
    return (
      <section id={s.id} className="rounded-3xl bg-ink p-5 text-white">
        <p className="mb-1 text-xs font-semibold tracking-wide text-brand">
          {s.num !== null && `第 ${s.num} 节 · `}勾一勾，只存在这台设备
        </p>
        <h2 className="mb-3 text-lg font-bold">{s.label}</h2>
        <WikiMarkdown md={s.body} ctx={ctx} invert />
      </section>
    );
  }

  if (kind === "eoe") {
    return (
      <section id={s.id} className="rounded-[1.25rem] border border-mint-ink/20 bg-mint p-4">
        {head}
        <WikiMarkdown md={s.body} ctx={ctx} />
      </section>
    );
  }

  return (
    <section id={s.id} className="card p-4">
      {head}
      <WikiMarkdown md={s.intro} ctx={ctx} />
      {s.subsections.length > 0 && (
        <div className={kind === "levels" ? "mt-3 space-y-3" : "mt-3 space-y-3"}>
          {s.subsections.map((sub, i) => (
            <Subsection key={i} kind={kind} title={sub.title} body={sub.body} ctx={ctx} />
          ))}
        </div>
      )}
    </section>
  );
}

function Subsection({ kind, title, body, ctx }: { kind: Kind; title: string; body: string; ctx: WikiRemarkOptions }) {
  const level = kind === "levels" ? title.match(/^(60|80|90)\s*分/) : null;
  if (level) {
    const st = LEVEL[Number(level[1]) as 60 | 80 | 90];
    const [tag, ...rest] = title.split(/[：:]/);
    return (
      <div className="rounded-2xl border border-line p-3.5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-sm font-black ${st.cls}`}>{tag}</span>
          {rest.length > 0 && <span className="text-sm text-ink-2">{rest.join("：")}</span>}
        </div>
        <div className="mb-2.5 h-1.5 rounded-full bg-line/60">
          <div className={`h-1.5 rounded-full ${st.bar}`} />
        </div>
        <WikiMarkdown md={body} ctx={ctx} />
      </div>
    );
  }

  const confirmed = isConfirmedTitle(title);
  const optional = isOptionalTitle(title);
  const cls = confirmed
    ? "rounded-2xl border border-mint-ink/20 bg-mint p-3.5"
    : optional
      ? "rounded-2xl border border-dashed border-line p-3.5"
      : kind === "stories"
        ? "rounded-2xl bg-bg p-3.5"
        : "pt-1";
  return (
    <div className={cls}>
      <h3 className={`mb-1.5 font-bold ${confirmed ? "text-mint-ink" : ""}`}>{title}</h3>
      <WikiMarkdown md={body} ctx={ctx} />
    </div>
  );
}
