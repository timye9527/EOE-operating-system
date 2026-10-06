import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStore } from "@/lib/store";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { formatDate } from "@/components/ui";

export const metadata: Metadata = { title: "会后记录" };

export default async function RecordDetail({ params }: PageProps<"/records/[id]">) {
  const { id } = await params;
  const store = await getStore();
  const r = await store.getRecord(id);
  if (!r) notFound();

  const stat = (label: string, value: number) => (
    <div className="rounded-2xl bg-bg px-3 py-2.5 text-center">
      <p className="text-2xl font-black tabular-nums">{value}</p>
      <p className="text-xs text-ink-3">{label}</p>
    </div>
  );

  return (
    <>
      <nav className="mb-3 text-sm text-ink-3">
        <Link href="/records" className="hover:text-brand-ink">
          运营记录
        </Link>{" "}
        / {r.date}
      </nav>
      <div className="card space-y-4 p-5">
        <div>
          <p className="text-sm font-semibold text-brand-ink">{formatDate(r.date)}</p>
          <h1 className="text-xl font-black">{r.theme || "（未填主题）"}</h1>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {stat("会员出席", r.memberCount)}
          {stat("嘉宾", r.guestCount)}
          {stat("备稿演讲", r.preparedSpeeches)}
        </div>
        {r.guestSources.length > 0 && (
          <div>
            <p className="mb-1.5 text-sm font-semibold">嘉宾来源</p>
            <div className="flex flex-wrap gap-1.5">
              {r.guestSources.map((g) => (
                <span key={g.source} className="rounded-full bg-brand-soft px-2.5 py-1 text-sm text-brand-ink">
                  {g.source} ×{g.count}
                </span>
              ))}
            </div>
          </div>
        )}
        {r.winners && (
          <div>
            <p className="text-sm font-semibold">🏆 获奖者</p>
            <p className="text-sm text-ink-2">{r.winners}</p>
          </div>
        )}
        {r.reflection && (
          <div>
            <p className="text-sm font-semibold">💡 一句话复盘</p>
            <p className="text-sm text-ink-2">{r.reflection}</p>
          </div>
        )}
        {r.note && (
          <div>
            <p className="text-sm font-semibold">备注</p>
            <p className="whitespace-pre-wrap text-sm text-ink-2">{r.note}</p>
          </div>
        )}
        <p className="text-xs text-ink-3">
          记录于 {new Date(r.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
        </p>
      </div>
      <div className="mt-6">
        <DeleteRecordButton id={r.id} writeCodeRequired={!!process.env.EOE_WRITE_CODE} />
      </div>
    </>
  );
}
