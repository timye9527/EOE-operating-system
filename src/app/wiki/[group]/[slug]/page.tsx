import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWiki, listWiki, WIKI_GROUPS, type WikiGroup } from "@/lib/content";
import { listWorkbenches } from "@/lib/config";
import { wikiRenderContext } from "@/lib/wiki-context";
import { SourceProvider } from "@/components/wiki/SourceSheet";
import { WikiMarkdown } from "@/components/wiki/WikiMarkdown";
import { navLabel, sectionKind, SectionView } from "@/components/wiki/Sections";
import { CredLegend } from "@/components/wiki/CredLegend";
import { HandoverBanner } from "@/components/wiki/HandoverBanner";
import { Pill } from "@/components/ui";

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
  return { title: entry ? `${entry.nameZh} ${entry.title}` : "成长百科" };
}

export default async function WikiPage({ params }: Props) {
  const { group, slug } = await params;
  const entry = await getWiki(group, slug);
  if (!entry) notFound();

  const { ctx, sources } = await wikiRenderContext(entry.file, [entry.preamble, ...entry.sections.map((s) => s.body)]);
  const workbench = (await listWorkbenches()).find((w) => w.wiki === `${entry.group}/${entry.slug}`);
  const first = entry.sections.find((s) => sectionKind(s) === "first");
  const confirmedAt = entry.sections.find((s) => sectionKind(s) === "eoe") ?? entry.sections.find((s) => s.num === 9);

  return (
    <SourceProvider sources={sources}>
      <article>
        <nav className="mb-3 text-sm text-ink-3">
          <Link href="/wiki" className="hover:text-brand-ink">
            成长百科
          </Link>{" "}
          / {WIKI_GROUPS[entry.group].label}
        </nav>

        <header className="mb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-3xl shadow-sm">
              {entry.emoji}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight">
                {entry.nameZh} <span className="text-ink-2">{entry.title !== entry.nameZh && entry.title}</span>
              </h1>
              {entry.subtitle && <p className="truncate text-sm text-ink-3">{entry.subtitle}</p>}
            </div>
          </div>
          {entry.summary && <p className="mt-3 text-[15px] leading-relaxed">{entry.summary}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {first && (
              <a href={`#${first.id}`}>
                <Pill tone="brand">明天第一次做？看这里 ↓</Pill>
              </a>
            )}
            {entry.confirmedCount > 0 && confirmedAt && (
              <a href={`#${confirmedAt.id}`}>
                <Pill tone="mint">✓ EOE 已确认 {entry.confirmedCount} 条</Pill>
              </a>
            )}
            {workbench && (
              <Link href={`/workbench/${workbench.slug}`}>
                <Pill>打开 {workbench.title} 工作台 →</Pill>
              </Link>
            )}
            {entry.updated && <Pill>更新于 {entry.updated}</Pill>}
          </div>
        </header>

        {/* 章节快速跳转 */}
        <div className="no-scrollbar sticky top-14 z-20 -mx-4 mb-4 flex gap-1.5 overflow-x-auto bg-bg/95 px-4 py-2 backdrop-blur">
          {entry.sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                sectionKind(s) === "first"
                  ? "border-brand bg-brand-soft text-brand-ink"
                  : "border-line bg-white text-ink-2 hover:border-brand hover:text-brand-ink"
              }`}
            >
              {navLabel(s)}
            </a>
          ))}
        </div>

        <div className="mb-3 space-y-2">
          {entry.preamble && (
            <div className="text-sm">
              <WikiMarkdown md={entry.preamble} ctx={ctx} />
            </div>
          )}
          <CredLegend compact />
        </div>

        <div className="space-y-3">
          {entry.sections.map((s) => (
            <SectionView key={s.id} s={s} ctx={ctx} />
          ))}
        </div>

        {entry.group === "officers" && (
          <div className="mt-5">
            <HandoverBanner />
          </div>
        )}

        <p className="mt-6 text-center text-xs text-ink-3">
          本页内容来自 <code>docs/eoe-growth-wiki/content/{entry.file}</code>
        </p>
      </article>
    </SourceProvider>
  );
}
