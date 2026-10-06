import Link from "next/link";
import type { Metadata } from "next";
import { getStore, storeMode } from "@/lib/store";
import { OpsTabs } from "@/components/OpsTabs";
import { EmptyState, formatDate, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "运营记录" };

export default async function RecordsPage({ searchParams }: PageProps<"/records">) {
  const { saved } = await searchParams;
  const store = await getStore();
  const records = await store.listRecords();

  return (
    <>
      <PageHeader
        eyebrow="运营"
        title="运营记录"
        desc="每场例会后 1 分钟留下的记录，就是俱乐部的记忆。"
        action={
          <Link href="/records/new" className="rounded-full bg-brand px-3.5 py-1.5 text-sm font-semibold text-white">
            ＋ 新记录
          </Link>
        }
      />
      <OpsTabs active="records" />
      {saved && (
        <p className="mb-3 rounded-2xl bg-mint px-4 py-2.5 text-sm text-mint-ink">✅ 记录已保存，谢谢你！</p>
      )}

      {records.length === 0 ? (
        <EmptyState
          title="还没有任何记录"
          desc="下一场例会结束后，花一分钟记第一条吧。"
          action={
            <Link href="/records/new" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
              写第一条会后记录
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {records.map((r) => (
            <li key={r.id}>
              <Link href={`/records/${r.id}`} className="card block p-4 transition hover:shadow-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-brand-ink">{formatDate(r.date)}</p>
                  <p className="text-xs text-ink-3">{r.date.slice(0, 4)}</p>
                </div>
                <p className="mt-0.5 font-bold">{r.theme || "（未填主题）"}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                  <span>👥 会员 {r.memberCount}</span>
                  <span>🙌 嘉宾 {r.guestCount}</span>
                  <span>🎤 备稿 {r.preparedSpeeches}</span>
                </div>
                {r.reflection && <p className="mt-2 line-clamp-2 text-sm text-ink-2">「{r.reflection}」</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-center text-xs text-ink-3">
        数据存储：{storeMode() === "supabase" ? "Supabase 数据库" : "本地文件 data/local-db.json"}
      </p>
    </>
  );
}
