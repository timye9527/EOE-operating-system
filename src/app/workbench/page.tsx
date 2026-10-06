import Link from "next/link";
import type { Metadata } from "next";
import { listWorkbenches } from "@/lib/config";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "官员工作台" };

export default async function WorkbenchIndex() {
  const benches = await listWorkbenches();
  return (
    <>
      <PageHeader
        eyebrow="官员工作台"
        title="我是哪位官员？"
        desc="点进去：我的职责、这周 / 这个月该做什么、模板和工具都在哪里。"
      />
      <div className="grid gap-2.5 sm:grid-cols-2">
        {benches.map((w) => (
          <Link
            key={w.slug}
            href={`/workbench/${w.slug}`}
            className="card flex items-center gap-3 p-4 transition hover:shadow-sm active:scale-[0.99]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-2xl">
              {w.emoji}
            </span>
            <span className="min-w-0">
              <span className="block font-bold">
                {w.title} <span className="text-sm font-normal text-ink-3">{w.nameZh}</span>
              </span>
              <span className="block truncate text-sm text-ink-2">{w.tagline}</span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
