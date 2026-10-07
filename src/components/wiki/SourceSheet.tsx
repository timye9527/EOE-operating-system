"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { SourceBrief } from "@/lib/sources";
import { InlineMd } from "./InlineMd";

// 来源编号 [V1] 的小标签 + 点开后从底部弹出的来源卡片。
// 来源数据由服务端从 research/SOURCES.md 解析后传进来。

type Ctx = { sources: Record<string, SourceBrief>; open: (id: string) => void };
const SourceCtx = createContext<Ctx>({ sources: {}, open: () => {} });

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SourceProvider({ sources, children }: { sources: Record<string, SourceBrief>; children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const src = openId ? sources[openId] : null;
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const open = (id: string) => {
    opener.current = document.activeElement as HTMLElement | null;
    setOpenId(id);
  };
  const close = () => setOpenId(null);

  // 打开时把焦点移进弹层（读屏和键盘用户才能用），关闭时还给原来的标签；Tab 在弹层内循环
  useEffect(() => {
    if (!openId) {
      opener.current?.focus?.();
      return;
    }
    panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setOpenId(null);
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  return (
    <SourceCtx.Provider value={{ sources, open }}>
      {children}
      {src && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="source-sheet-title"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={close}
          />
          <div
            ref={panel}
            className="pb-safe relative max-h-[80vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl md:max-w-lg md:rounded-3xl"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line md:hidden" />
            <div className="flex items-center gap-2 text-xs text-ink-3">
              <span className="rounded-md bg-sky px-1.5 py-0.5 font-bold text-sky-ink">{src.id}</span>
              {src.tag && <span>{src.tag}</span>}
              <span>· {src.category}</span>
            </div>
            <h3 id="source-sheet-title" className="mt-2 text-lg font-bold leading-snug">
              <InlineMd text={src.title} />
            </h3>
            <dl className="mt-3 space-y-1 text-sm">
              {src.author && (
                <Row k="作者">
                  <InlineMd text={src.author} />
                </Row>
              )}
              {src.origin && (
                <Row k="来源">
                  <InlineMd text={src.origin} />
                </Row>
              )}
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
                    <InlineMd text={l} />
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
              {/* 用普通链接：整页跳转后浏览器的 :target 才会生效，目标卡片会高亮 */}
              <a href={`/wiki/sources#src-${src.id}`} className="rounded-full border border-line px-3.5 py-1.5 text-sm">
                在资料总表里看
              </a>
              <button
                type="button"
                data-autofocus
                onClick={close}
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
      aria-label={`来源 ${id}：${src.title.replace(/\*/g, "")}${src.summaryOnly ? "（只读到摘要）" : ""}`}
      title={src.title.replace(/\*/g, "")}
    >
      {id}
    </button>
  );
}
