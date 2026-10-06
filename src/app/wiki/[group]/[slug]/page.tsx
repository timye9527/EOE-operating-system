import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWiki, listWiki, WIKI_GROUPS, type WikiGroup, type WikiSection } from "@/lib/content";
import { listWorkbenches } from "@/lib/config";
import { Markdown, Pill } from "@/components/ui";

type Props = { params: Promise<{ group: string; slug: string }> };

export async function generateStaticParams() {
  const all = await Promise.all(
    (Object.keys(WIKI_GROUPS) as WikiGroup[]).map(async (g) =>
      (await listWiki(g)).map((e) => ({ group: g, slug: e.slug })),
    ),
  );
  return all.flat();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { group, slug } = await params;
  const entry = await getWiki(group, slug);
  return { title: entry ? `${entry.title} ${entry.nameZh}` : "成长百科" };
}

const LEVEL_STYLE = {
  60: { tag: "60 分", sub: "把事做完", cls: "bg-sky text-sky-ink", bar: "bg-sky-ink/70 w-3/5" },
  80: { tag: "80 分", sub: "做得稳、做得好", cls: "bg-mint text-mint-ink", bar: "bg-mint-ink/70 w-4/5" },
  90: { tag: "90 分", sub: "做出影响", cls: "bg-brand-soft text-brand-ink", bar: "bg-brand w-[90%]" },
} as const;

export default async function WikiPage({ params }: Props) {
  const { group, slug } = await params;
  const entry = await getWiki(group, slug);
  if (!entry) notFound();

  const levels = entry.sections.filter((s) => s.kind === "level");
  const firstTime = entry.sections.find((s) => s.kind === "first-time");
  const workbench = (await listWorkbenches()).find((w) => w.wiki === `${entry.group}/${entry.slug}`);

  // 渲染顺序：按 Markdown 原顺序；60/80/90 合并成一个「成长路线」块，放在第一个 level 章节的位置
  const blocks: ({ type: "section"; s: WikiSection } | { type: "levels" })[] = [];
  for (const s of entry.sections) {
    if (s.kind === "level") {
      if (s === levels[0]) blocks.push({ type: "levels" });
    } else if (s.kind !== "first-time") {
      blocks.push({ type: "section", s });
    }
  }

  const toc = [
    ...(firstTime ? [{ id: firstTime.id, title: "第一次做" }] : []),
    ...blocks.map((b) =>
      b.type === "levels" ? { id: "levels", title: "60/80/90 成长路线" } : { id: b.s.id, title: b.s.title },
    ),
    ...(entry.notes.length ? [{ id: "notes", title: "更多研究资料" }] : []),
  ];

  return (
    <article>
      <nav className="mb-3 text-sm text-ink-3">
        <Link href="/wiki" className="hover:text-brand-ink">
          成长百科
        </Link>{" "}
        / {WIKI_GROUPS[entry.group].label}
      </nav>

      <header className="mb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-3xl shadow-sm">
            {entry.emoji}
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{entry.title}</h1>
            <p className="text-sm text-ink-2">{entry.nameZh}</p>
          </div>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed">{entry.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.status === "draft" ? <Pill tone="sun">草稿 · 欢迎补充</Pill> : <Pill tone="mint">已审阅</Pill>}
          {entry.updated && <Pill>更新于 {entry.updated}</Pill>}
          {workbench && (
            <Link href={`/workbench/${workbench.slug}`}>
              <Pill tone="brand">打开 {workbench.title} 工作台 →</Pill>
            </Link>
          )}
        </div>
      </header>

      {/* 章节快速跳转 */}
      <div className="no-scrollbar sticky top-14 z-20 -mx-4 mb-4 flex gap-1.5 overflow-x-auto bg-bg/95 px-4 py-2 backdrop-blur">
        {toc.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className="shrink-0 rounded-full border border-line bg-white px-3 py-1 text-xs text-ink-2 hover:border-brand hover:text-brand-ink"
          >
            {t.title}
          </a>
        ))}
      </div>

      {firstTime && (
        <section id={firstTime.id} className="mb-4 rounded-3xl bg-ink p-5 text-white">
          <p className="mb-2 text-xs font-semibold tracking-wide text-brand">第一次做？只需要记住这些</p>
          <Markdown invert>{firstTime.body}</Markdown>
        </section>
      )}

      <div className="space-y-3">
        {blocks.map((b) =>
          b.type === "levels" ? (
            <section key="levels" id="levels" className="card p-4">
              <h2 className="mb-3 text-lg font-bold">成长路线 · 60 → 80 → 90</h2>
              <ol className="space-y-3">
                {levels.map((l) => {
                  const st = LEVEL_STYLE[l.level ?? 60];
                  return (
                    <li key={l.id} id={l.id} className="rounded-2xl border border-line p-3.5">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-sm font-black ${st.cls}`}>{st.tag}</span>
                        <span className="text-sm text-ink-2">{st.sub}</span>
                      </div>
                      <div className="mb-2.5 h-1.5 rounded-full bg-line/60">
                        <div className={`h-1.5 rounded-full ${st.bar}`} />
                      </div>
                      <Markdown>{l.body}</Markdown>
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : (
            <section
              key={b.s.id}
              id={b.s.id}
              className={b.s.kind === "eoe" ? "rounded-[1.25rem] bg-mint p-4" : "card p-4"}
            >
              <h2 className={`mb-2 text-lg font-bold ${b.s.kind === "eoe" ? "text-mint-ink" : ""}`}>
                {b.s.kind === "eoe" && "🌱 "}
                {b.s.title}
              </h2>
              <Markdown>{b.s.body}</Markdown>
            </section>
          ),
        )}

        {entry.notes.length > 0 && (
          <section id="notes" className="card p-4">
            <h2 className="mb-1 text-lg font-bold">更多研究资料</h2>
            <p className="mb-3 text-xs text-ink-3">来自 content/notes/{entry.slug}/，点开阅读</p>
            <div className="divide-y divide-line">
              {entry.notes.map((n) => (
                <details key={n.slug} className="group py-2.5">
                  <summary className="cursor-pointer list-none font-semibold">
                    <span className="mr-1.5 inline-block text-ink-3 transition group-open:rotate-90">›</span>
                    {n.title}
                    <span className="mt-0.5 block pl-4 text-xs font-normal text-ink-3">
                      {[n.date, n.source, n.author].filter(Boolean).join(" · ")}
                    </span>
                  </summary>
                  <div className="pl-4 pt-2">
                    <Markdown>{n.body}</Markdown>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-ink-3">
        想补充这一页？编辑 <code>content/{entry.group}/{entry.slug}.md</code>，或把资料放进{" "}
        <code>content/notes/{entry.slug}/</code>
      </p>
    </article>
  );
}
