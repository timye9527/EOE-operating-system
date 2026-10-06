import type { Metadata } from "next";
import { listWiki, WIKI_GROUPS, type WikiGroup } from "@/lib/content";
import { WikiCard } from "@/components/WikiCard";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "成长百科" };

export default async function WikiIndex() {
  const groups = await Promise.all(
    (Object.keys(WIKI_GROUPS) as WikiGroup[]).map(async (g) => [g, await listWiki(g)] as const),
  );
  return (
    <>
      <PageHeader
        eyebrow="成长百科"
        title="每个角色，都有一条成长路线"
        desc="不知道怎么做？先看「第一次做只需要记住什么」，再看 60 / 80 / 90 分怎么做。"
      />
      {groups.map(([g, entries]) => (
        <section key={g} className="mb-8">
          <div className="mb-3 flex items-baseline gap-2">
            <h2 className="text-lg font-bold">{WIKI_GROUPS[g].label}</h2>
            <span className="text-xs text-ink-3">{WIKI_GROUPS[g].en}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
            {entries.map((e) => (
              <WikiCard key={e.slug} entry={e} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
