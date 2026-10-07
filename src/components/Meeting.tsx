import type { Meeting, Tool } from "@/lib/types";
import { formatDate, LinkTile } from "@/components/ui";

// 「例会」的两部分：
//   MeetingResources —— 每次例会都用得上的入口（来自 content/tools.yaml），长期有效，不用每周更新
//   MeetingHero / MeetingLinks —— 可选填写的「下一场例会」，日期过了自动隐藏

export function MeetingHero({ m, compact }: { m: Meeting; compact?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink p-5 text-white">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/80 blur-2xl" />
      <div className="relative">
        <p className="text-xs font-semibold tracking-wide text-white/60">下一场例会</p>
        <p className="mt-0.5 text-sm font-semibold text-brand">
          {formatDate(m.date)} {m.time && `· ${m.time}`}
        </p>
        <h2 className={`mt-1 font-black leading-snug ${compact ? "text-xl" : "text-2xl"}`}>{m.theme || "主题待定"}</h2>
        {m.location && <p className="mt-1 text-sm text-white/70">📍 {m.location}</p>}
        {(m.meetingManager || m.toastmaster) && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-white/10 px-3 py-2">
              <p className="text-xs text-white/60">会议经理</p>
              <p className="font-semibold">{m.meetingManager || "—"}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2">
              <p className="text-xs text-white/60">主持人</p>
              <p className="font-semibold">{m.toastmaster || "—"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** 这一场填了的链接（没填的不显示） */
export function MeetingLinks({ m }: { m: Meeting }) {
  const links = [
    { label: "会单", url: m.agendaUrl, sub: "这一场的流程与角色", emoji: "📋" },
    { label: "腾讯文档", url: m.docUrl, sub: "这一场的总表", emoji: "📝" },
    { label: "接龙", url: m.signupUrl, sub: "这一场的接龙", emoji: "🙋" },
    { label: "投票", url: m.voteUrl, sub: "这一场的投票", emoji: "🗳️" },
    ...m.extraLinks.map((l) => ({ label: l.label, url: l.url, sub: l.note ?? "其他链接", emoji: "🔗" })),
  ].filter((l) => l.url);
  if (!links.length) return null;
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {links.map((l) => (
        <LinkTile key={l.label} {...l} />
      ))}
    </div>
  );
}

const TONES = ["brand", "sky", "mint", "grape", "sun"] as const;
const EMOJI: Record<string, string> = { meeting: "📝", vote: "🗳️" };

/** 每次例会都用得上的入口：tools.yaml 里「例会协作」和「投票模板」两类 */
export function MeetingResources({ tools, limit }: { tools: Tool[]; limit?: number }) {
  const list = tools.filter((t) => t.category === "meeting" || t.category === "vote");
  const shown = limit ? list.slice(0, limit) : list;
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {shown.map((t, i) => (
        <LinkTile
          key={t.id}
          label={t.name}
          url={t.url}
          sub={t.purpose}
          emoji={EMOJI[t.category] ?? "🔗"}
          tone={TONES[i % TONES.length]}
        />
      ))}
    </div>
  );
}
