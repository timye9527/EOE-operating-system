import type { MeetingRecord } from "@/lib/types";

// 运营看板的统计。全部从会后记录现算，不额外存储。

export type ClubStats = {
  meetings: number;
  avgMembers: number | null;
  avgAttendance: number | null; // 会员 + 嘉宾
  totalGuests: number;
  totalPrepared: number;
  guestSources: { source: string; count: number }[]; // 降序
  recent: MeetingRecord[]; // 时间正序，最多 12 场
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeStats(records: MeetingRecord[]): ClubStats {
  const n = records.length;
  const sum = (f: (r: MeetingRecord) => number) => records.reduce((s, r) => s + f(r), 0);
  const sources = new Map<string, number>();
  for (const r of records) {
    const attributed = r.guestSources.reduce((s, g) => s + g.count, 0);
    for (const g of r.guestSources) sources.set(g.source, (sources.get(g.source) ?? 0) + g.count);
    // 记录了嘉宾人数但没填来源的部分，算作「未填写」，保证总数对得上
    if (r.guestCount > attributed) sources.set("未填写", (sources.get("未填写") ?? 0) + r.guestCount - attributed);
  }
  return {
    meetings: n,
    avgMembers: n ? round1(sum((r) => r.memberCount) / n) : null,
    avgAttendance: n ? round1(sum((r) => r.memberCount + r.guestCount) / n) : null,
    totalGuests: sum((r) => r.guestCount),
    totalPrepared: sum((r) => r.preparedSpeeches),
    guestSources: [...sources.entries()]
      .map(([source, count]) => ({ source, count }))
      .filter((g) => g.count > 0)
      .sort((a, b) => b.count - a.count),
    recent: [...records].sort((a, b) => a.date.localeCompare(b.date)).slice(-12),
  };
}
