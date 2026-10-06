import Link from "next/link";
import type { Metadata } from "next";
import { getStore } from "@/lib/store";
import { computeStats } from "@/lib/stats";
import { GuestSourceBars } from "@/components/GuestSourceBars";
import { OpsTabs } from "@/components/OpsTabs";
import { EmptyState, PageHeader, SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "运营看板" };

// 数据不足时不画图：趋势至少要 3 场，来源至少要 1 位嘉宾。
const MIN_FOR_TREND = 3;

export default async function DashboardPage() {
  const store = await getStore();
  const s = computeStats(await store.listRecords());

  return (
    <>
      <PageHeader eyebrow="运营" title="运营看板" desc="全部来自会后记录，自动计算。" />
      <OpsTabs active="dashboard" />

      {s.meetings === 0 ? (
        <EmptyState
          title="还没有数据"
          desc="写下第一条会后记录后，这里会出现例会数量、平均出席、嘉宾来源等。"
          action={
            <Link href="/records/new" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
              写会后记录
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <Tile label="例会数量" value={s.meetings} unit="场" />
            <Tile label="平均出席" value={s.avgAttendance ?? 0} unit="人" sub={`其中会员平均 ${s.avgMembers}`} />
            <Tile label="累计嘉宾" value={s.totalGuests} unit="位" />
            <Tile label="备稿演讲" value={s.totalPrepared} unit="篇" />
          </div>

          <SectionTitle>嘉宾从哪里来？</SectionTitle>
          <div className="card p-4">
            {s.totalGuests === 0 ? (
              <p className="text-sm text-ink-2">还没有记录到嘉宾。</p>
            ) : (
              <GuestSourceBars data={s.guestSources} total={s.totalGuests} />
            )}
          </div>

          <SectionTitle>近期趋势 · 每场出席人数</SectionTitle>
          <div className="card p-4">
            {s.meetings < MIN_FOR_TREND ? (
              <p className="text-sm text-ink-2">
                再记录 {MIN_FOR_TREND - s.meetings} 场就能看到趋势。现在画图意义不大 🙂
              </p>
            ) : (
              <Trend data={s.recent} />
            )}
          </div>
        </>
      )}
    </>
  );
}

function Tile({ label, value, unit, sub }: { label: string; value: number; unit: string; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-3">{label}</p>
      <p className="mt-1 text-3xl font-black tabular-nums tracking-tight">
        {value}
        <span className="ml-0.5 text-sm font-medium text-ink-3">{unit}</span>
      </p>
      {sub && <p className="mt-0.5 text-xs text-ink-3">{sub}</p>}
    </div>
  );
}

/** 每场出席 = 会员 + 嘉宾。单一度量、单一颜色；嘉宾部分用浅色叠在上方并有图例。 */
function Trend({ data }: { data: { id: string; date: string; memberCount: number; guestCount: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.memberCount + d.guestCount));
  return (
    <>
      <div className="mb-3 flex gap-4 text-xs text-ink-2">
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm bg-brand" /> 会员
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm bg-brand/35" /> 嘉宾
        </span>
      </div>
      <div className="flex h-40 items-end gap-1.5">
        {data.map((d) => {
          const total = d.memberCount + d.guestCount;
          return (
            <Link
              key={d.id}
              href={`/records/${d.id}`}
              title={`${d.date}：会员 ${d.memberCount} + 嘉宾 ${d.guestCount} = ${total}`}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            >
              <span className="mb-1 text-[11px] tabular-nums text-ink-2">{total}</span>
              <div
                className="flex w-full max-w-9 flex-col gap-[2px] overflow-hidden rounded-t-[4px] group-hover:opacity-80"
                style={{ height: `${(total / max) * 100}%` }}
              >
                {d.guestCount > 0 && <div className="bg-brand/35" style={{ flexGrow: d.guestCount }} />}
                {d.memberCount > 0 && <div className="bg-brand" style={{ flexGrow: d.memberCount }} />}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5 border-t border-line pt-1.5">
        {data.map((d) => (
          <span key={d.id} className="min-w-0 flex-1 truncate text-center text-[10px] text-ink-3">
            {Number(d.date.slice(5, 7))}/{Number(d.date.slice(8, 10))}
          </span>
        ))}
      </div>
      <Link href="/records" className="mt-3 inline-block text-sm text-brand-ink">
        查看每场明细 →
      </Link>
    </>
  );
}
