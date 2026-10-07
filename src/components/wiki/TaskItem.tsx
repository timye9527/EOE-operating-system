"use client";

import { useEffect, useState, type ReactNode } from "react";

// 成长百科里的 `- [ ]` 清单项。勾选状态只保存在这台设备（localStorage）：
// 系统没有登录，所以做不到「按用户」保存。key = 文件 + 条目文字的哈希，
// 同一条清单在百科页和官员工作台里显示，勾选状态是同一份。

const PREFIX = "eoe:task:";

export function TaskItem({ storageKey, className, children }: { storageKey: string; className?: string; children: ReactNode }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      // 挂载后才能读本机存档
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecked(localStorage.getItem(PREFIX + storageKey) === "1");
    } catch {
      /* 隐私模式等情况读不到，忽略 */
    }
  }, [storageKey]);

  const toggle = () => {
    const next = !checked;
    setChecked(next);
    try {
      if (next) localStorage.setItem(PREFIX + storageKey, "1");
      else localStorage.removeItem(PREFIX + storageKey);
    } catch {
      /* 忽略 */
    }
  };

  return (
    <li className={`task-item ${checked ? "is-done" : ""} ${className ?? ""}`}>
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={toggle}
          className="mt-[0.3em] h-5 w-5 shrink-0 accent-[var(--brand)]"
        />
        <span className="task-text min-w-0 flex-1">{children}</span>
      </label>
    </li>
  );
}
