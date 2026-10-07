import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWikiDoc, listWiki } from "@/lib/content";
import { DocPage } from "@/components/wiki/DocPage";

export const metadata: Metadata = { title: "官员交接指南" };

export default async function HandoverPage() {
  const [doc, officers] = await Promise.all([getWikiDoc("handover"), listWiki("officers")]);
  if (!doc) notFound();
  return (
    <DocPage
      doc={doc}
      eyebrow="官员交接"
      top={
        officers.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            <span className="py-1.5 text-ink-3">各角色第 9 节：</span>
            {officers.map((o) => (
              <Link
                key={o.slug}
                href={`/wiki/officers/${o.slug}#s9`}
                className="rounded-full border border-line bg-white px-3 py-1.5 hover:border-brand"
              >
                {o.emoji} {o.title}
              </Link>
            ))}
          </div>
        )
      }
    />
  );
}
