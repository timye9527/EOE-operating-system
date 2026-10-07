import Link from "next/link";
import type { Metadata } from "next";
import { getTools } from "@/lib/config";
import { getCurrentMeeting } from "@/lib/meeting";
import { MeetingForm } from "@/components/MeetingForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "填写下一场例会" };

export default async function EditMeetingPage() {
  const [meeting, { tools }] = await Promise.all([getCurrentMeeting(), getTools()]);
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
        />
      </div>
    </>
  );
}
