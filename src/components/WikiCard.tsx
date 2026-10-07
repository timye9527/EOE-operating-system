import Link from "next/link";
import type { WikiEntry } from "@/lib/content";

export function WikiCard({ entry }: { entry: WikiEntry }) {
  return (
    <Link
      href={`/wiki/${entry.group}/${entry.slug}`}
      className="card flex flex-col gap-1.5 p-3.5 transition hover:shadow-sm active:scale-[0.98]"
    >
      <span className="text-2xl leading-none">{entry.emoji}</span>
      <span className="mt-1 font-bold leading-tight">{entry.title}</span>
      <span className="text-xs text-ink-3">{entry.nameZh}</span>
      <span className="line-clamp-3 text-xs leading-relaxed text-ink-2">{entry.summary}</span>
      {entry.confirmedCount > 0 && (
        <span className="mt-auto pt-1 text-[11px] font-semibold text-mint-ink">✓ EOE 已确认 {entry.confirmedCount} 条</span>
      )}
    </Link>
  );
}
