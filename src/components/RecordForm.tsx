"use client";

import { useActionState, useState, useTransition } from "react";
import { createRecord, type ActionState } from "@/app/actions";
import type { GuestSourceCount } from "@/lib/types";
import { Field, FormError, inputCls, submitWith, Stepper, SubmitButton, WriteCodeField } from "@/components/forms";

// 会后 1 分钟记录。设计目标：一分钟以内填完。
// 必填只有日期；其余都有默认值。嘉宾来源 = 点一下 +1。

export function RecordForm({
  defaults,
  sourceOptions,
  writeCodeRequired,
}: {
  defaults: { date: string; theme: string };
  sourceOptions: string[];
  writeCodeRequired: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createRecord, { ok: true });
  const [, startTransition] = useTransition();
  const [members, setMembers] = useState(0);
  const [guests, setGuests] = useState(0);
  const [prepared, setPrepared] = useState(0);
  const [sources, setSources] = useState<GuestSourceCount[]>([]);
  const [options, setOptions] = useState(sourceOptions);
  const [custom, setCustom] = useState("");

  const sourced = sources.reduce((s, g) => s + g.count, 0);
  const countOf = (src: string) => sources.find((g) => g.source === src)?.count ?? 0;

  const bump = (src: string, delta: number) => {
    const next = [...sources];
    const i = next.findIndex((g) => g.source === src);
    if (i === -1) {
      if (delta > 0) next.push({ source: src, count: delta });
    } else {
      next[i] = { ...next[i], count: Math.max(0, next[i].count + delta) };
    }
    const filtered = next.filter((g) => g.count > 0);
    const total = filtered.reduce((s, g) => s + g.count, 0);
    setSources(filtered);
    // 来源点多了，嘉宾人数自动跟上
    if (total > guests) setGuests(total);
  };

  const addCustom = () => {
    const name = custom.trim().slice(0, 40);
    if (!name) return;
    if (!options.includes(name)) setOptions([...options, name]);
    bump(name, 1);
    setCustom("");
  };

  return (
    <form onSubmit={submitWith(action, startTransition)} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="日期">
          <input name="date" type="date" required defaultValue={defaults.date} className={inputCls} />
        </Field>
        <Field label="主题">
          <input name="theme" defaultValue={defaults.theme} placeholder="本场主题" className={inputCls} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Stepper name="memberCount" label="会员出席" value={members} onChange={setMembers} />
        <Stepper name="guestCount" label="嘉宾" value={guests} onChange={(n) => setGuests(Math.max(n, sourced))} />
        <Stepper name="preparedSpeeches" label="备稿篇数" value={prepared} onChange={setPrepared} />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold">
          嘉宾从哪里来？
          <span className="ml-1.5 text-xs font-normal text-ink-3">
            点一下 +1，点 − 减一 · 已标注 {sourced}/{guests}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {options.map((src) => {
            const c = countOf(src);
            return (
              <span
                key={src}
                className={`inline-flex items-center overflow-hidden rounded-full border text-sm transition ${
                  c ? "border-brand bg-brand-soft text-brand-ink" : "border-line bg-white text-ink-2"
                }`}
              >
                <button type="button" onClick={() => bump(src, 1)} className="px-3 py-1.5 active:scale-95">
                  {src}
                  {c > 0 && <b className="ml-1.5 tabular-nums">×{c}</b>}
                </button>
                {c > 0 && (
                  <button
                    type="button"
                    onClick={() => bump(src, -1)}
                    className="border-l border-brand/30 px-2.5 py-1.5"
                    aria-label={`${src}减一`}
                  >
                    −
                  </button>
                )}
              </span>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="自定义来源，例如：某某活动"
            className={`${inputCls} py-2 text-sm`}
          />
          <button
            type="button"
            onClick={addCustom}
            className="shrink-0 rounded-xl border border-line bg-white px-3 text-sm"
          >
            添加
          </button>
        </div>
        <input type="hidden" name="guestSources" value={JSON.stringify(sources)} />
      </div>

      <Field label="获奖者" hint="可选">
        <input name="winners" placeholder="例如：最佳备稿 小王 / 最佳即兴 Mia" className={inputCls} />
      </Field>

      <Field label="一句话复盘" hint="这场最值得记住的一件事">
        <input name="reflection" placeholder="例如：即兴环节嘉宾参与度很高" className={inputCls} />
      </Field>

      <details className="rounded-2xl border border-line bg-white px-3 py-2">
        <summary className="cursor-pointer text-sm text-ink-2">备注（可选）</summary>
        <textarea name="note" rows={3} className={`${inputCls} mt-2`} placeholder="任何想补充的" />
      </details>

      <WriteCodeField required={writeCodeRequired} />
      <FormError error={state.error} />
      <SubmitButton pending={pending}>保存记录</SubmitButton>
    </form>
  );
}
