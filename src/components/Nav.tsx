"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// 一级栏目只有这些。不要再加（见 docs/PRODUCT.md）。
const NAV: { href: string; label: string; match: string[]; icon: ReactNode }[] = [
  { href: "/", label: "首页", match: ["/"], icon: <IconHome /> },
  { href: "/meeting", label: "本周例会", match: ["/meeting"], icon: <IconCalendar /> },
  { href: "/wiki", label: "成长百科", match: ["/wiki"], icon: <IconBook /> },
  { href: "/workbench", label: "工作台", match: ["/workbench"], icon: <IconDesk /> },
  { href: "/records", label: "运营", match: ["/records", "/dashboard"], icon: <IconChart /> },
];

function isActive(pathname: string, match: string[]) {
  return match.some((m) => (m === "/" ? pathname === "/" : pathname.startsWith(m)));
}

export function TopBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-sm font-black text-white">
            E
          </span>
          <span className="font-bold tracking-tight">
            EOE <span className="font-medium text-ink-3">Club OS</span>
          </span>
        </Link>
        <nav className="hidden gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                isActive(pathname, n.match)
                  ? "bg-ink text-white"
                  : "text-ink-2 hover:bg-white"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/records/new"
          className="rounded-full bg-brand px-3 py-1.5 text-sm font-semibold text-white md:hidden"
        >
          ＋ 会后记录
        </Link>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {NAV.map((n) => {
          const active = isActive(pathname, n.match);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                className={`flex flex-col items-center gap-0.5 pt-2 text-[11px] ${
                  active ? "font-semibold text-brand-ink" : "text-ink-3"
                }`}
              >
                <span className={`h-6 w-6 ${active ? "text-brand" : ""}`}>{n.icon}</span>
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ——— 图标（内联 SVG，不引第三方图标库） ———
const svg = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  className: "h-full w-full",
};
function IconHome() {
  return (
    <svg {...svg}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg {...svg}>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="M8 14h3" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg {...svg}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" />
      <path d="M9 8h7" />
    </svg>
  );
}
function IconDesk() {
  return (
    <svg {...svg}>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg {...svg}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}
