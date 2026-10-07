import Link from "next/link";
import type { Metadata } from "next";
import { getUpcomingMeeting } from "@/lib/meeting";
import { getTools } from "@/lib/config";
import { listAllWiki, type WikiEntry } from "@/lib/content";
import { MeetingHero, MeetingLinks, MeetingResources } from "@/components/Meeting";
import { LinkTile, PageHeader, SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "例会" };

/** 角色名里包含百科条目的英文名或中文名，就自动链接到角色指南 */
function matchGuide(role: string, entries: WikiEntry[]) {
  const r = role.toLowerCase();
  return entries
    .filter((e) => r.includes(e.title.toLowerCase()) || (e.nameZh && role.includes(e.nameZh)))
    .sort((a, b) => b.title.length - a.title.length)[0];
}

// 例会：长期有效的入口在前；「下一场例会」可选填写，日期过了自动隐藏，不需要每周维护。
export default async function MeetingPage({ searchParams }: PageProps<"/meeting">) {
  const { saved } = await searchParams;
  const [m, { tools }, wiki] = await Promise.all([getUpcomingMeeting(), getTools(), listAllWiki()]);
  const roles = wiki.filter((e) => e.group === "roles");

  return (
    <>
      <PageHeader
        eyebrow="例会"
        title="每次例会都用得上"
        desc="下面的入口长期有效。下一场例会的信息可以不填；填了的话，日期一过会自动隐藏。"
        action={
          <Link href="/meeting/edit" className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm">
            ✏️ 填下一场
          </Link>
        }
      />
      {saved && (
        <p className="mb-3 rounded-2xl bg-mint px-4 py-2.5 text-sm text-mint-ink">
          ✅ 已保存。例会日期一过，这些信息会自动隐藏。
        </p>
      )}

      <SectionTitle>常用入口</SectionTitle>
      <MeetingResources tools={tools} />
      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
        <LinkTile label="会后记录" url="/records/new" sub="1 分钟完成" emoji="✍️" />
        <LinkTile label="全部工具" url="/tools" sub="工具箱" emoji="🧰" />
      </div>

      {roles.length > 0 && (
        <>
          <SectionTitle more={{ href: "/wiki", label: "成长百科" }}>角色指南 · 明天第一次做</SectionTitle>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {roles.map((r) => (
              <LinkTile
                key={r.file}
                label={r.nameZh !== r.title ? `${r.nameZh} ${r.title}` : r.title}
                url={`/wiki/${r.group}/${r.slug}#s8`}
                sub="第一次做要记住什么"
                emoji={r.emoji}
              />
            ))}
          </div>
        </>
      )}

      <SectionTitle>下一场例会</SectionTitle>
      {m ? (
        <div className="space-y-2.5">
          <MeetingHero m={m} />
          <MeetingLinks m={m} />
          {m.roles.length > 0 && (
            <div className="card divide-y divide-line">
              {m.roles.map((r, i) => {
                const guide = matchGuide(r.role, wiki);
                return (
                  <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink-2">{r.role}</p>
                      <p className="font-semibold">{r.name || <span className="text-brand-ink">空缺，求认领 🙋</span>}</p>
                    </div>
                    {guide && (
                      <Link
                        href={`/wiki/${guide.group}/${guide.slug}`}
                        className="shrink-0 rounded-full bg-bg px-2.5 py-1 text-xs text-ink-2 hover:text-brand-ink"
                      >
                        {guide.emoji} 角色指南
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {m.note && <p className="card whitespace-pre-wrap p-4 text-sm leading-relaxed">{m.note}</p>}
        </div>
      ) : (
        <div className="card border-dashed px-4 py-5 text-center text-sm text-ink-2">
          没有填写下一场例会。不填也没关系，上面的入口一直有效。
          <Link href="/meeting/edit" className="mt-2 block text-brand-ink">
            需要的话，填一下 →
          </Link>
        </div>
      )}
    </>
  );
}
