"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { SourceBrief } from "@/lib/sources";

// 来源编号 [V1] 的小标签 + 点开后从底部弹出的来源卡片。
// 来源数据由服务端从 research/SOURCES.md 解析后传进来。

type Ctx = { sources: Record<string, SourceBrief>; open: (id: string) => void };
const SourceCtx = createContext<Ctx>({ sources: {}, open: () => {} });

export function SourceProvider({ sources, children }: { sources: Record<string, SourceBrief>; children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const src = openId ? sources[openId] : null;

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  return (
    <SourceCtx.Provider value={{ sources, open: setOpenId }}>
      {children}
      {src && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="关闭"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => setOpenId(null)}
          />
          <div className="pb-safe relative max-h-[80vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl md:max-w-lg md:rounded-3xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line md:hidden" />
            <div className="flex items-center gap-2 text-xs text-ink-3">
              <span className="rounded-md bg-sky px-1.5 py-0.5 font-bold text-sky-ink">{src.id}</span>
              {src.tag && <span>{src.tag}</span>}
              <span>· {src.category}</span>
            </div>
            <h3 className="mt-2 text-lg font-bold leading-snug">{src.title}</h3>
            <dl className="mt-3 space-y-1 text-sm">
              {src.author && <Row k="作者">{src.author}</Row>}
              {src.origin && <Row k="来源">{src.origin}</Row>}
              {src.date && <Row k="时间">{src.date}</Row>}
              {src.depth && (
                <Row k="阅读程度">
                  {src.depth}
                  {src.summaryOnly && (
                    <span className="ml-1.5 rounded bg-sun px-1.5 py-0.5 text-xs text-sun-ink">只读到摘要，引用要谨慎</span>
                  )}
                </Row>
              )}
            </dl>
            {src.noteLines.length > 0 && (
              <div className="mt-3 space-y-1.5 rounded-2xl bg-bg p-3 text-sm leading-relaxed">
                {src.noteLines.map((l, i) => (
                  <p key={i}>
                    <Bold text={l} />
                  </p>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {src.url && (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-ink px-3.5 py-1.5 text-sm font-semibold text-white"
                >
                  打开原文 ↗
                </a>
              )}
              <Link
                href={`/wiki/sources#src-${src.id}`}
                onClick={() => setOpenId(null)}
                className="rounded-full border border-line px-3.5 py-1.5 text-sm"
              >
                在资料总表里看
              </Link>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="ml-auto rounded-full px-3 py-1.5 text-sm text-ink-3"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </SourceCtx.Provider>
  );
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 text-ink-3">{k}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

/** 只处理 **粗体**，其余原样显示 */
function Bold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : <span key={i}>{p.replace(/\*/g, "")}</span>))}
    </>
  );
}

/** 正文里的 [V1] 标签 */
export function SourceRef({ id, missing }: { id: string; missing?: boolean }) {
  const { sources, open } = useContext(SourceCtx);
  const src = sources[id];
  if (missing || !src) {
    return (
      <span className="cred-ref cred-ref-missing" title="资料总表（SOURCES.md）里找不到这个编号">
        {id}?
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => open(id)}
      className={`cred-ref ${src.summaryOnly ? "cred-ref-summary" : ""}`}
      aria-label={`来源 ${id}：${src.title}${src.summaryOnly ? "（只读到摘要）" : ""}`}
      title={src.title}
    >
      {id}
    </button>
  );
}
