import Link from "next/link";
import { getUpcomingMeeting } from "@/lib/meeting";
import { listWiki } from "@/lib/content";
import { getTools, listWorkbenches } from "@/lib/config";
import { getStore } from "@/lib/store";
import { MeetingHero, MeetingLinks, MeetingResources } from "@/components/Meeting";
import { formatDate, SectionTitle } from "@/components/ui";
import { HandoverBanner } from "@/components/wiki/HandoverBanner";

// 首页只回答一个问题：我今天来这里能干什么？

function greeting() {
  const h = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Shanghai" }).format(new Date()),
  );
  if (h < 5) return "夜深了";
  if (h < 11) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

const ACTIONS = [
  { href: "/records/new", emoji: "✍️", title: "写会后记录", sub: "1 分钟搞定", cls: "bg-brand text-white", subCls: "text-white/80" },
  { href: "/wiki", emoji: "📘", title: "我要做角色", sub: "看角色指南", cls: "bg-sky", subCls: "text-sky-ink" },
  { href: "/workbench", emoji: "🧭", title: "我是官员", sub: "打开工作台", cls: "bg-mint", subCls: "text-mint-ink" },
  { href: "/tools", emoji: "🧰", title: "找链接", sub: "工具与模板", cls: "bg-sun", subCls: "text-sun-ink" },
];

export default async function Home() {
  const store = await getStore();
  const [meeting, { tools }, roles, officers, benches, records] = await Promise.all([
    getUpcomingMeeting(),
    getTools(),
    listWiki("roles"),
    listWiki("officers"),
    listWorkbenches(),
    store.listRecords(),
  ]);
  return (
    <>
      <div className="mb-4">
        <p className="text-sm text-ink-3">{greeting()} 👋</p>
        <h1 className="mt-0.5 text-2xl font-black tracking-tight md:text-3xl">今天想做点什么？</h1>
      </div>

      {/* 例会：有填写下一场就显示；没有（或已过期）就只显示长期有效的入口 */}
      {meeting ? (
        <>
          <Link href="/meeting" className="block transition active:scale-[0.99]">
            <MeetingHero m={meeting} compact />
          </Link>
          <div className="mt-2.5">
            <MeetingLinks m={meeting} />
          </div>
        </>
      ) : (
        <>
          <SectionTitle more={{ href: "/meeting", label: "例会" }}>例会常用入口</SectionTitle>
          <MeetingResources tools={tools} limit={4} />
        </>
      )}

      {/* 常用操作 */}
      <SectionTitle>常用操作</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className={`rounded-3xl p-4 transition active:scale-[0.98] ${a.cls}`}>
            <span className="text-2xl">{a.emoji}</span>
            <p className="mt-2 font-bold">{a.title}</p>
            <p className={`text-xs ${a.subCls}`}>{a.sub}</p>
          </Link>
        ))}
      </div>

      {/* 成长百科 */}
      <SectionTitle more={{ href: "/wiki", label: "全部" }}>成长百科</SectionTitle>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[...roles, ...officers].map((r) => (
          <Link
            key={r.file}
            href={`/wiki/${r.group}/${r.slug}`}
            className="card w-32 shrink-0 p-3 transition hover:shadow-sm"
          >
            <span className="text-xl">{r.emoji}</span>
            <p className="mt-1 truncate text-sm font-bold">{r.title}</p>
            {r.nameZh !== r.title && <p className="truncate text-xs text-ink-3">{r.nameZh}</p>}
          </Link>
        ))}
      </div>

      {/* 官员工作台 */}
      <SectionTitle more={{ href: "/workbench", label: "全部" }}>官员工作台</SectionTitle>
      <div className="mb-2.5">
        <HandoverBanner compact />
      </div>
      <div className="flex flex-wrap gap-2">
        {benches.map((w) => (
          <Link
            key={w.slug}
            href={`/workbench/${w.slug}`}
            className="rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold hover:border-brand"
          >
            {w.emoji} {w.title}
          </Link>
        ))}
        {benches.length === 0 &&
          officers.map((o) => (
            <Link key={o.slug} href={`/wiki/officers/${o.slug}`} className="rounded-full border border-line bg-white px-3.5 py-2 text-sm">
              {o.emoji} {o.title}
            </Link>
          ))}
      </div>

      {/* 最近记录 */}
      <SectionTitle more={{ href: "/records", label: "全部记录" }}>最近记录</SectionTitle>
      {records.length === 0 ? (
        <Link href="/records/new" className="card block border-dashed p-4 text-center text-sm text-ink-2">
          还没有会后记录。下一场例会后，花 1 分钟写第一条 →
        </Link>
      ) : (
        <div className="card divide-y divide-line">
          {records.slice(0, 3).map((r) => (
            <Link key={r.id} href={`/records/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{r.theme || "（未填主题）"}</p>
                <p className="text-xs text-ink-3">{formatDate(r.date)}</p>
              </div>
              <p className="shrink-0 text-sm tabular-nums text-ink-2">
                {r.memberCount + r.guestCount} 人 · 嘉宾 {r.guestCount}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
