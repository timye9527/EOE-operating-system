import Link from "next/link";
import type { Metadata } from "next";
import { getTools } from "@/lib/config";
import { getCurrentMeeting } from "@/lib/meeting";
import { MeetingForm } from "@/components/MeetingForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "编辑本周例会" };

export default async function EditMeetingPage() {
  const [meeting, { tools }] = await Promise.all([getCurrentMeeting(), getTools()]);
  return (
    <>
      <PageHeader
        eyebrow="本周例会"
        title="更新本周例会"
        desc="通常由 Meeting Manager 或 VPE 在会前 3 天更新。保存后所有人立刻看到。"
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
