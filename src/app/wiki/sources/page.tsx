import Link from "next/link";
import type { Metadata } from "next";
import { getSources } from "@/lib/sources";
import { existingWikiFiles } from "@/lib/content";
import { WikiMarkdown } from "@/components/wiki/WikiMarkdown";
import type { WikiRemarkOptions } from "@/lib/wiki-remark";

export const metadata: Metadata = { title: "资料来源总表" };

// research/SOURCES.md：来源表格逐条变成卡片（手机上 7 列的表格没法看），
// 表格以外的说明文字原样渲染。每条来源有锚点 #src-编号，正文里的 [V1] 可以直接跳过来。
export default async function SourcesPage() {
  const [doc, existing] = await Promise.all([getSources(), existingWikiFiles()]);
  const ctx: WikiRemarkOptions = { file: "../research/SOURCES.md", existing, sourceIds: Object.keys(doc.byId) };

  return (
    <article>
      <nav className="mb-3 text-sm text-ink-3">
        <Link href="/wiki" className="hover:text-brand-ink">
          成长百科
        </Link>{" "}
        / 资料来源
      </nav>
      <h1 className="mb-3 text-2xl font-black tracking-tight">资料来源总表</h1>
      <div className="card mb-4 p-4 text-sm">
        <WikiMarkdown md={doc.intro} ctx={ctx} />
      </div>

      <div className="no-scrollbar -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4">
        {doc.categories.map((c, i) => (
          <a
            key={i}
            href={`#cat-${i}`}
            className="shrink-0 rounded-full border border-line bg-white px-3 py-1 text-xs text-ink-2"
          >
            {c.title}
          </a>
        ))}
      </div>

      <div className="space-y-6">
        {doc.categories.map((c, i) => (
          <section key={i} id={`cat-${i}`}>
            <h2 className="mb-2.5 text-lg font-bold">{c.title}</h2>
            {c.other && (
              <div className="mb-3 text-sm">
                <WikiMarkdown md={c.other} ctx={ctx} />
              </div>
            )}
            <div className="space-y-2.5">
              {c.sources.map((s) => (
                <div key={s.id} id={`src-${s.id}`} className="card scroll-mt-28 p-4 target:ring-2 target:ring-brand">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="rounded-md bg-sky px-1.5 py-0.5 font-bold text-sky-ink">{s.id}</span>
                    {s.tag && <span className="text-ink-3">{s.tag}</span>}
                    {s.depth && (
                      <span
                        className={`rounded px-1.5 py-0.5 ${s.summaryOnly ? "bg-sun text-sun-ink" : "bg-mint text-mint-ink"}`}
                      >
                        {s.depth}
                      </span>
                    )}
                    {s.date && <span className="text-ink-3">{s.date}</span>}
                  </div>
                  <p className="mt-1.5 font-bold leading-snug">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-brand-ink">
                        {s.title} <span className="text-ink-3">↗</span>
                      </a>
                    ) : (
                      s.title
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-2">{[s.author, s.origin].filter(Boolean).join(" · ")}</p>
                  {s.use && <p className="mt-0.5 text-xs text-ink-3">用途：{s.use}</p>}
                  {s.noteLines.length > 0 && (
                    <div className="mt-2 rounded-2xl bg-bg p-3 text-sm">
                      <WikiMarkdown md={s.noteLines.join("\n\n")} ctx={ctx} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-ink-3">
        本页内容来自 <code>docs/eoe-growth-wiki/research/SOURCES.md</code>
      </p>
    </article>
  );
}
