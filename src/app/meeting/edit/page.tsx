import Link from "next/link";
import type { Metadata } from "next";
import { getMeetingSeed, getTools } from "@/lib/config";
import { getUpcomingMeeting } from "@/lib/meeting";
import { todayCN } from "@/lib/date";
import { MeetingForm } from "@/components/MeetingForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "填写下一场例会" };

export default async function EditMeetingPage() {
  // 只预填还没过期的那一场；过期的不带出来（否则旧主题、旧角色会被当成新的保存）
  const [upcoming, seed, { tools }] = await Promise.all([getUpcomingMeeting(), getMeetingSeed(), getTools()]);
  const meeting = upcoming ?? { ...seed, date: "" };
  return (
    <>
      <PageHeader
        eyebrow="例会"
        title="填写下一场例会（可选）"
        desc="不填也没关系。填了以后，例会日期一过会自动隐藏，不需要回来删。"
        action={
          <Link href="/meeting" className="text-sm text-ink-3">
            取消
          </Link>
        }
      />
      <div className="card p-4">
        <MeetingForm
          meeting={meeting}
          voteTemplates={tools.filter((t) => t.category === "vote")}
          writeCodeRequired={!!process.env.EOE_WRITE_CODE}
          minDate={todayCN()}
        />
      </div>
    </>
  );
}
