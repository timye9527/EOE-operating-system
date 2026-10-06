import type { Meeting } from "@/lib/types";
import { formatDate, LinkTile } from "@/components/ui";

export function MeetingHero({ m, compact }: { m: Meeting; compact?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink p-5 text-white">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/80 blur-2xl" />
      <div className="relative">
        <p className="text-sm font-semibold text-brand">
          {formatDate(m.date)} {m.time && `· ${m.time}`}
        </p>
        <h2 className={`mt-1 font-black leading-snug ${compact ? "text-xl" : "text-2xl"}`}>{m.theme || "主题待定"}</h2>
        {m.location && <p className="mt-1 text-sm text-white/70">📍 {m.location}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-white/10 px-3 py-2">
            <p className="text-xs text-white/60">Meeting Manager</p>
            <p className="font-semibold">{m.meetingManager || "待定"}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2">
            <p className="text-xs text-white/60">Toastmaster</p>
            <p className="font-semibold">{m.toastmaster || "待定"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MeetingLinks({ m, compact }: { m: Meeting; compact?: boolean }) {
  const main = [
    { label: "会单", url: m.agendaUrl, sub: "本场流程与角色", emoji: "📋", tone: "brand" as const },
    { label: "腾讯文档", url: m.docUrl, sub: "例会总表", emoji: "📝", tone: "sky" as const },
    { label: "接龙", url: m.signupUrl, sub: "在微信群里接龙", emoji: "🙋", tone: "mint" as const },
    { label: "投票", url: m.voteUrl, sub: "本场投票", emoji: "🗳️", tone: "grape" as const },
  ];
  const more = [
    { label: "角色指南", url: "/wiki", sub: "成长百科", emoji: "📘" },
    { label: "会后记录", url: "/records/new", sub: "1 分钟完成", emoji: "✍️" },
    ...m.extraLinks.map((l) => ({ label: l.label, url: l.url, sub: l.note ?? "其他链接", emoji: "🔗" })),
    { label: "其他工具", url: "/tools", sub: "工具箱", emoji: "🧰" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {main.map((l) => (
        <LinkTile key={l.label} {...l} />
      ))}
      {!compact && more.map((l) => <LinkTile key={l.label} {...l} />)}
    </div>
  );
}
