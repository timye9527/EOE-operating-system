import Link from "next/link";
import type { ReactNode } from "react";
import type { WikiDoc } from "@/lib/content";
import { wikiRenderContext } from "@/lib/wiki-context";
import { SourceProvider } from "./SourceSheet";
import { WikiMarkdown } from "./WikiMarkdown";
import { SectionView } from "./Sections";

// 通用文档页（EOE 背景 / 官员交接）：一级标题 + 前言 + 各节，原文照排。
export async function DocPage({ doc, eyebrow, top }: { doc: WikiDoc; eyebrow: string; top?: ReactNode }) {
  const { ctx, sources } = await wikiRenderContext(doc.file, [doc.preamble, ...doc.sections.map((s) => s.body)]);
  return (
    <SourceProvider sources={sources}>
      <article>
        <nav className="mb-3 text-sm text-ink-3">
          <Link href="/wiki" className="hover:text-brand-ink">
            成长百科
          </Link>{" "}
          / {eyebrow}
        </nav>
        <h1 className="mb-3 text-2xl font-black tracking-tight">{doc.heading}</h1>
        {doc.preamble && (
          <div className="mb-3 text-sm">
            <WikiMarkdown md={doc.preamble} ctx={ctx} />
          </div>
        )}
        {top}
        <div className="space-y-3">
          {doc.sections.map((s) => (
            <SectionView key={s.id} s={s} ctx={ctx} />
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-ink-3">
          本页内容来自 <code>docs/eoe-growth-wiki/content/{doc.file}</code>
        </p>
      </article>
    </SourceProvider>
  );
}
