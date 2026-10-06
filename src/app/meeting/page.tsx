import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentMeeting } from "@/lib/meeting";
import { listWiki, type WikiEntry } from "@/lib/content";
import { MeetingHero, MeetingLinks } from "@/components/Meeting";
import { PageHeader, SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "本周例会" };

/** 角色名里包含百科条目的英文名或中文名，就自动链接到角色指南 */
function matchGuide(role: string, entries: WikiEntry[]) {
  const r = role.toLowerCase();
  return entries
    .filter((e) => r.includes(e.title.toLowerCase()) || (e.nameZh && role.includes(e.nameZh)))
    .sort((a, b) => b.title.length - a.title.length)[0];
}

export default async function MeetingPage({ searchParams }: PageProps<"/meeting">) {
  const { saved } = await searchParams;
  const m = await getCurrentMeeting();
  const roleEntries = [...(await listWiki("roles")), ...(await listWiki("officers"))];

  return (
    <>
      <PageHeader
        eyebrow="本周例会"
        title="这周的一切，都在这里"
        action={
          <Link href="/meeting/edit" className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm">
            ✏️ 编辑
          </Link>
        }
      />
      {saved && (
        <p className="mb-3 rounded-2xl bg-mint px-4 py-2.5 text-sm text-mint-ink">✅ 已保存，大家现在看到的就是最新信息。</p>
      )}

      <MeetingHero m={m} />

      <SectionTitle>快捷入口</SectionTitle>
      <MeetingLinks m={m} />

      <SectionTitle>角色安排</SectionTitle>
      <div className="card divide-y divide-line">
        {[
          ...(m.meetingManager ? [{ role: "例会经理 Meeting Manager", name: m.meetingManager }] : []),
          ...(m.toastmaster ? [{ role: "主持人 Toastmaster", name: m.toastmaster }] : []),
          ...m.roles,
        ].map((r, i) => {
          const guide = matchGuide(r.role, roleEntries);
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
        {!m.roles.length && !m.toastmaster && !m.meetingManager && (
          <p className="px-4 py-4 text-sm text-ink-3">还没有填写角色。点右上角「编辑」添加。</p>
        )}
      </div>

      {m.note && (
        <>
          <SectionTitle>备注</SectionTitle>
          <p className="card whitespace-pre-wrap p-4 text-sm leading-relaxed">{m.note}</p>
        </>
      )}

      <p className="mt-6 text-center text-xs text-ink-3">
        {m.updatedAt ? `最后更新：${new Date(m.updatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}` : "当前显示的是 content/meeting.yaml 中的默认内容"}
      </p>
    </>
  );
}
