import Link from "next/link";
import type { Metadata } from "next";
import { getGuestSources } from "@/lib/config";
import { getCurrentMeeting } from "@/lib/meeting";
import { getStore } from "@/lib/store";
import { daysBetween, todayCN } from "@/lib/date";
import { RecordForm } from "@/components/RecordForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "会后 1 分钟记录" };

export default async function NewRecordPage() {
  const [meeting, configured, store] = await Promise.all([getCurrentMeeting(), getGuestSources(), getStore()]);
  const records = await store.listRecords();

  // 用过的自定义来源，自动出现在下次的选项里
  const used = records.flatMap((r) => r.guestSources.map((g) => g.source));
  const options = [...new Set([...configured, ...used])];

  // 最近一场例会刚开完（今天或前 3 天内）→ 自动带出日期和主题
  const today = todayCN();
  const fresh = /^\d{4}-\d{2}-\d{2}$/.test(meeting.date) && daysBetween(meeting.date, today) >= 0 && daysBetween(meeting.date, today) <= 3;

  return (
    <>
      <PageHeader
        eyebrow="会后 1 分钟记录"
        title="辛苦啦，花一分钟记一下 ✍️"
        desc="只记最关键的几个数。数据会自动进入运营看板。"
        action={
          <Link href="/records" className="text-sm text-ink-3">
            取消
          </Link>
        }
      />
      <div className="card p-4">
        <RecordForm
          defaults={{ date: fresh ? meeting.date : today, theme: fresh ? meeting.theme : "" }}
          sourceOptions={options}
          writeCodeRequired={!!process.env.EOE_WRITE_CODE}
        />
      </div>
    </>
  );
}
