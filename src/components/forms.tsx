"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

// 表单共用的小组件（客户端）。
//
// 注意：表单用 onSubmit + startTransition 调用 action，而不是 <form action={...}>。
// 因为 React 19 在 form action 结束后会自动清空表单，出错时用户填的字会丢。

/** 生成 onSubmit：阻止默认提交，在 transition 里调用 Server Action，不清空表单 */
export function submitWith(action: (fd: FormData) => void, startTransition: (fn: () => void) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}

const CODE_KEY = "eoe:writeCode";

/** 可选的写入口令：只有服务器设置了 EOE_WRITE_CODE 才显示；输入一次后记在本机 */
export function WriteCodeField({ required }: { required: boolean }) {
  const [code, setCode] = useState("");
  useEffect(() => {
    if (!required) return;
    try {
      // 挂载后才能读 localStorage
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode(localStorage.getItem(CODE_KEY) ?? "");
    } catch {
      /* 忽略 */
    }
  }, [required]);
  if (!required) return null;
  return (
    <Field label="俱乐部口令" hint="输入一次后会记在这台设备上">
      <input
        name="writeCode"
        type="password"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          try {
            localStorage.setItem(CODE_KEY, e.target.value);
          } catch {
            /* 忽略 */
          }
        }}
        className={inputCls}
        autoComplete="off"
      />
    </Field>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[16px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">
        {label}
        {hint && <span className="ml-1.5 text-xs font-normal text-ink-3">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

/** 大号数字 + 加减按钮（上下排列，窄屏三列也放得下），手机上单手就能点 */
export function Stepper({
  name,
  label,
  value,
  onChange,
}: {
  name?: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const btn =
    "grid h-9 flex-1 place-items-center rounded-xl bg-bg text-xl font-semibold text-ink-2 active:scale-95";
  return (
    <div>
      <span className="mb-1.5 block truncate text-sm font-semibold">{label}</span>
      <div className="rounded-2xl border border-line bg-white p-1.5">
        <input
          name={name}
          inputMode="numeric"
          value={value}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange(Math.max(0, Number.parseInt(e.target.value.replace(/\D/g, "") || "0", 10)))}
          className="block w-full bg-transparent py-1 text-center text-2xl font-black tabular-nums outline-none"
          aria-label={label}
        />
        <div className="flex gap-1.5">
          <button type="button" className={btn} onClick={() => onChange(Math.max(0, value - 1))} aria-label={`${label}减一`}>
            −
          </button>
          <button type="button" className={btn} onClick={() => onChange(value + 1)} aria-label={`${label}加一`}>
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export function SubmitButton({ children, pending }: { children: ReactNode; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-brand py-3.5 text-base font-bold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? "保存中…" : children}
    </button>
  );
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="rounded-2xl bg-brand-soft px-4 py-2.5 text-sm text-brand-ink">⚠️ {error}</p>;
}
