"use client";

import { useActionState, useState, useTransition } from "react";
import { saveMeeting, type ActionState } from "@/app/actions";
import type { Meeting, Tool } from "@/lib/types";
import { Field, FormError, inputCls, submitWith, SubmitButton, WriteCodeField } from "@/components/forms";

// 编辑本周例会。纯文本输入为主：角色「角色：名字」一行一个，额外链接「名称 | 链接」一行一个。

export function MeetingForm({
  meeting: m,
  voteTemplates,
  writeCodeRequired,
}: {
  meeting: Meeting;
  voteTemplates: Tool[];
  writeCodeRequired: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveMeeting, { ok: true });
  const [, startTransition] = useTransition();
  const [voteUrl, setVoteUrl] = useState(m.voteUrl ?? "");

  return (
    <form onSubmit={submitWith(action, startTransition)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="日期">
          <input name="date" type="date" defaultValue={m.date} className={inputCls} />
        </Field>
        <Field label="时间">
          <input name="time" defaultValue={m.time} placeholder="19:30 - 21:30" className={inputCls} />
        </Field>
      </div>
      <Field label="主题">
        <input name="theme" defaultValue={m.theme} className={inputCls} />
      </Field>
      <Field label="地点" hint="可选">
        <input name="location" defaultValue={m.location} className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Meeting Manager">
          <input name="meetingManager" defaultValue={m.meetingManager} className={inputCls} />
        </Field>
        <Field label="Toastmaster">
          <input name="toastmaster" defaultValue={m.toastmaster} className={inputCls} />
        </Field>
      </div>
      <Field label="主要角色" hint="一行一个：角色：名字（名字空着 = 空缺）">
        <textarea
          name="roles"
          rows={8}
          defaultValue={m.roles.map((r) => `${r.role}：${r.name}`).join("\n")}
          placeholder={"计时官 Timer：小周\n即兴主持 Table Topics Master：Mia"}
          className={`${inputCls} font-mono text-sm leading-relaxed`}
        />
      </Field>

      <fieldset className="space-y-3 rounded-2xl bg-bg p-3">
        <legend className="px-1 text-sm font-semibold">链接（直接粘贴）</legend>
        <Field label="📋 会单">
          <input name="agendaUrl" defaultValue={m.agendaUrl} placeholder="https://" className={inputCls} />
        </Field>
        <Field label="📝 腾讯文档">
          <input name="docUrl" defaultValue={m.docUrl} placeholder="https://docs.qq.com/..." className={inputCls} />
        </Field>
        <Field label="🙋 接龙" hint="接龙在微信群里，这里可放说明或链接">
          <input name="signupUrl" defaultValue={m.signupUrl} placeholder="https://" className={inputCls} />
        </Field>
        <Field label="🗳️ 投票">
          {voteTemplates.length > 0 && (
            <select
              className={`${inputCls} mb-2 text-sm`}
              value=""
              onChange={(e) => e.target.value && setVoteUrl(e.target.value)}
            >
              <option value="">从投票模板中选择…</option>
              {voteTemplates
                .filter((t) => t.url)
                .map((t) => (
                  <option key={t.id} value={t.url}>
                    {t.name}
                    {t.tool ? `（${t.tool}）` : ""}
                  </option>
                ))}
            </select>
          )}
          <input
            name="voteUrl"
            value={voteUrl}
            onChange={(e) => setVoteUrl(e.target.value)}
            placeholder="本场投票链接"
            className={inputCls}
          />
        </Field>
        <Field label="其他链接" hint="一行一个：名称 | 链接">
          <textarea
            name="extraLinks"
            rows={3}
            defaultValue={m.extraLinks.map((l) => `${l.label} | ${l.url ?? ""}`).join("\n")}
            placeholder="会场导航 | https://..."
            className={`${inputCls} font-mono text-sm`}
          />
        </Field>
      </fieldset>

      <Field label="备注" hint="可选">
        <textarea name="note" rows={2} defaultValue={m.note} className={inputCls} />
      </Field>

      <WriteCodeField required={writeCodeRequired} />
      <FormError error={state.error} />
      <SubmitButton pending={pending}>保存本周例会</SubmitButton>
    </form>
  );
}
