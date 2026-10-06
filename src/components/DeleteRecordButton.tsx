"use client";

import { useActionState } from "react";
import { deleteRecord, type ActionState } from "@/app/actions";
import { FormError, WriteCodeField } from "@/components/forms";

// 记错了可以删掉重记（v0.1 不做编辑，删了重填一分钟更简单）
export function DeleteRecordButton({ id, writeCodeRequired }: { id: string; writeCodeRequired: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(deleteRecord, { ok: true });
  return (
    <details className="text-center">
      <summary className="cursor-pointer list-none text-sm text-ink-3">记错了？删除这条记录</summary>
      <form action={action} className="card mt-3 space-y-3 p-4 text-left">
        <p className="text-sm text-ink-2">删除后无法恢复。确定吗？</p>
        <input type="hidden" name="id" value={id} />
        <WriteCodeField required={writeCodeRequired} />
        <FormError error={state.error} />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl border border-brand py-2.5 text-sm font-semibold text-brand-ink disabled:opacity-60"
        >
          {pending ? "删除中…" : "确认删除"}
        </button>
      </form>
    </details>
  );
}
