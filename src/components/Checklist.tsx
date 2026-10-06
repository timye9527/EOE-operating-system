"use client";

import { useEffect, useState } from "react";

// 官员工作台的 Checklist。勾选状态只存在本机浏览器（localStorage），
// 按 reset 周期自动换一张新的（每周 / 每月），不需要数据库，也不会催办任何人。

function periodKey(reset: "week" | "month" | "never" | undefined) {
  const now = new Date();
  if (reset === "month") return `${now.getFullYear()}-${now.getMonth() + 1}`;
  if (reset === "week") {
    // 以周一为一周开始
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return `w${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`;
  }
  return "all";
}

export function Checklist({
  id,
  items,
  reset,
}: {
  id: string;
  items: string[];
  reset?: "week" | "month" | "never";
}) {
  const [key, setKey] = useState<string | null>(null);
  const [done, setDone] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const k = `eoe:checklist:${id}:${periodKey(reset)}`;
    let saved: Record<number, boolean> = {};
    try {
      saved = JSON.parse(localStorage.getItem(k) ?? "{}");
    } catch {
      /* 隐私模式等情况下读不到，忽略 */
    }
    // 读取本机存档必须在挂载后进行（服务端没有 localStorage）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKey(k);
    setDone(saved);
  }, [id, reset]);

  const toggle = (i: number) => {
    const next = { ...done, [i]: !done[i] };
    setDone(next);
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* 忽略 */
      }
    }
  };

  const count = items.filter((_, i) => done[i]).length;
  const label = reset === "week" ? "本周" : reset === "month" ? "本月" : "";

  return (
    <div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl px-1 py-1.5 hover:bg-bg">
              <input
                type="checkbox"
                checked={!!done[i]}
                onChange={() => toggle(i)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--brand)]"
              />
              <span className={`text-sm leading-relaxed ${done[i] ? "text-ink-3 line-through" : ""}`}>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-3">
        {label && `${label}已完成 `}
        {count}/{items.length} · 勾选只保存在这台设备
        {reset && reset !== "never" ? `，${reset === "week" ? "每周一" : "每月 1 号"}自动换新` : ""}
      </p>
    </div>
  );
}
