import Link from "next/link";

// 官员交接指南的醒目入口：首页、成长百科、工作台、官员页都放一个。
export function HandoverBanner({ compact }: { compact?: boolean }) {
  return (
    <Link
      href="/wiki/handover"
      className={`flex items-center gap-3 rounded-[1.25rem] bg-sun transition hover:shadow-sm active:scale-[0.99] ${
        compact ? "px-3.5 py-2.5" : "p-4"
      }`}
    >
      <span className={`grid shrink-0 place-items-center rounded-2xl bg-white/70 ${compact ? "h-9 w-9 text-lg" : "h-11 w-11 text-xl"}`}>
        🤝
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">官员交接指南</span>
        <span className="block truncate text-sm text-sun-ink">换届前后都看这里 · 附可勾选的交接清单</span>
      </span>
      <span className="text-sun-ink">→</span>
    </Link>
  );
}
