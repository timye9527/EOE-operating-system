// 嘉宾来源的横向条形图（单一系列，一种颜色，按数量降序）。
// 纯 HTML/CSS，无图表库。每根条带 title 悬停提示，数值始终以文字显示。

export function GuestSourceBars({
  data,
  total,
  limit,
}: {
  data: { source: string; count: number }[];
  total: number;
  limit?: number;
}) {
  const rows = limit ? data.slice(0, limit) : data;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const pct = total ? Math.round((r.count / total) * 100) : 0;
        return (
          <li key={r.source} title={`${r.source}：${r.count} 人（${pct}%）`}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className={r.source === "未填写" ? "text-ink-3" : ""}>{r.source}</span>
              <span className="tabular-nums text-ink-2">
                {r.count} 人 <span className="text-xs text-ink-3">{pct}%</span>
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-line/50">
              <div
                className={`h-2.5 rounded-full ${r.source === "未填写" ? "bg-ink-3/40" : "bg-brand"}`}
                style={{ width: `${Math.max(4, (r.count / max) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
