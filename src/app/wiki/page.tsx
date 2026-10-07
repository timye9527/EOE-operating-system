import Link from "next/link";
import type { Metadata } from "next";
import { getWikiDoc, listWiki, skippedWikiFiles, WIKI_GROUPS, type WikiGroup } from "@/lib/content";
import { getSources } from "@/lib/sources";
import { WikiCard } from "@/components/WikiCard";
import { CredLegend } from "@/components/wiki/CredLegend";
import { HandoverBanner } from "@/components/wiki/HandoverBanner";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "成长百科" };

export default async function WikiIndex() {
  const [groups, context, sources, skipped] = await Promise.all([
    Promise.all((Object.keys(WIKI_GROUPS) as WikiGroup[]).map(async (g) => [g, await listWiki(g)] as const)),
    getWikiDoc("eoe-context"),
    getSources(),
    skippedWikiFiles(),
  ]);
  const sourceCount = Object.keys(sources.byId).length;

  return (
    <>
      <PageHeader
        eyebrow="EOE 成长百科"
        title="换一届官员，经验不丢"
        desc="每个角色都有：为什么值得做、60/80/90 分、前人经验、踩坑，以及「如果你明天第一次做」。"
      />

      <div className="mb-6 space-y-2.5">
        {context && (
          <Link href="/wiki/context" className="card flex items-center gap-3 p-4 transition hover:shadow-sm">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint text-xl">🌱</span>
            <span className="min-w-0">
              <span className="block font-bold">先读这个：EOE 现状与背景</span>
              <span className="block text-sm text-ink-2">我们是谁、多少人、已经确认了哪些规则</span>
            </span>
          </Link>
        )}
        <HandoverBanner />
        <CredLegend compact />
      </div>

      {groups.map(([g, entries]) => (
        <section key={g} className="mb-8">
          <div className="mb-3 flex items-baseline gap-2">
            <h2 className="text-lg font-bold">{WIKI_GROUPS[g].label}</h2>
            <span className="text-xs text-ink-3">{WIKI_GROUPS[g].en}</span>
          </div>
          {entries.length ? (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
              {entries.map((e) => (
                <WikiCard key={e.slug} entry={e} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-3">还没有内容。</p>
          )}
        </section>
      ))}

      <p className="text-center text-sm">
        <Link href="/wiki/sources" className="text-ink-2 underline underline-offset-4 hover:text-brand-ink">
          📚 资料来源总表（{sourceCount} 条）
        </Link>
      </p>
      {skipped.length > 0 && (
        <p className="mt-4 rounded-2xl bg-sun px-4 py-3 text-sm text-sun-ink">
          这些文件没有显示，因为文件名要用英文小写和短横线（如 <code>meeting-manager.md</code>）：
          {skipped.map((f) => (
            <code key={f} className="ml-1">
              {f}
            </code>
          ))}
        </p>
      )}
      <p className="mt-3 text-center text-xs text-ink-3">
        内容来自 <code>docs/eoe-growth-wiki/</code>。新增角色：往 <code>docs/eoe-growth-wiki/content/officers/</code> 或{" "}
        <code>.../roles/</code> 放一个 .md 文件即可（文件名用英文小写和短横线）。
      </p>
    </>
  );
}
