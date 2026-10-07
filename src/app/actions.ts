"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStore, storeMode } from "@/lib/store";
import { daysBetween, todayCN } from "@/lib/date";
import type { GuestSourceCount, LinkItem, Meeting, RoleAssignment } from "@/lib/types";

// 所有写操作都在这里。只有三种写入：新增/删除会后记录、保存下一场例会（可选）。

export type ActionState = { ok: boolean; error?: string };

const int = (v: FormDataEntryValue | null) => {
  const n = Number.parseInt(String(v ?? "0"), 10);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 9999) : 0;
};
const text = (v: FormDataEntryValue | null, max = 2000) => String(v ?? "").trim().slice(0, max);
const url = (v: FormDataEntryValue | null) => {
  const s = text(v, 1000);
  if (!s) return undefined;
  // 允许站内路径（如 /tools#jielong）；其余没写协议的自动补 https://
  return /^https?:\/\//.test(s) || /^\/(?!\/)/.test(s) ? s : `https://${s}`;
};

/** 可选的写入口令（EOE_WRITE_CODE）。不设置则不校验。 */
function checkWriteCode(form: FormData): string | null {
  const expected = process.env.EOE_WRITE_CODE;
  if (!expected) return null;
  return text(form.get("writeCode")) === expected ? null : "口令不对。问一下 VPE / 秘书要俱乐部口令。";
}

function storageError(e: unknown): string {
  console.error(e);
  if (storeMode() === "local" && process.env.VERCEL) {
    return "当前部署没有配置数据库（Vercel 上不能写本地文件）。请按 README 配置 Supabase。";
  }
  return `保存失败：${(e as Error).message}`;
}

// ———— 会后记录 ————

export async function createRecord(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = checkWriteCode(form);
  if (denied) return { ok: false, error: denied };

  const date = text(form.get("date"), 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "请选择日期" };

  let guestSources: GuestSourceCount[] = [];
  try {
    const parsed = JSON.parse(String(form.get("guestSources") ?? "[]")) as GuestSourceCount[];
    guestSources = parsed
      .map((g) => ({ source: String(g.source).trim().slice(0, 40), count: int(String(g.count)) }))
      .filter((g) => g.source && g.count > 0);
  } catch {
    return { ok: false, error: "嘉宾来源格式不对，刷新页面再试一次" };
  }
  const sourced = guestSources.reduce((s, g) => s + g.count, 0);

  try {
    const store = await getStore();
    await store.addRecord({
      date,
      theme: text(form.get("theme"), 200),
      memberCount: int(form.get("memberCount")),
      guestCount: Math.max(int(form.get("guestCount")), sourced),
      guestSources,
      preparedSpeeches: int(form.get("preparedSpeeches")),
      winners: text(form.get("winners"), 500),
      reflection: text(form.get("reflection"), 500),
      note: text(form.get("note")) || undefined,
    });
  } catch (e) {
    return { ok: false, error: storageError(e) };
  }
  revalidatePath("/", "layout");
  redirect("/records?saved=1");
}

export async function deleteRecord(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = checkWriteCode(form);
  if (denied) return { ok: false, error: denied };
  try {
    const store = await getStore();
    await store.deleteRecord(text(form.get("id"), 100));
  } catch (e) {
    return { ok: false, error: storageError(e) };
  }
  revalidatePath("/", "layout");
  redirect("/records");
}

// ———— 下一场例会（可选，日期过了自动隐藏） ————

/** 「角色：名字」一行一个 → RoleAssignment[] */
function parseRoles(raw: string): RoleAssignment[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.split(/[:：]/))
    .filter((p) => p.length >= 2 && p[0].trim())
    .map(([role, ...rest]) => ({ role: role.trim(), name: rest.join(":").trim() }))
    .slice(0, 40);
}

/** 「名称 | 链接」一行一个 → LinkItem[] */
function parseLinks(raw: string): LinkItem[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.split("|").map((s) => s.trim()))
    .filter((p) => p[0])
    .map(([label, u]) => ({ label, url: u ? url(u) : undefined }))
    .slice(0, 20);
}

export async function saveMeeting(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = checkWriteCode(form);
  if (denied) return { ok: false, error: denied };

  const meetingDate = text(form.get("date"), 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meetingDate)) {
    return { ok: false, error: "请选择例会日期（日期过了，这场的信息会自动隐藏）" };
  }
  if (daysBetween(todayCN(), meetingDate) < 0) {
    return { ok: false, error: "这个日期已经过了，保存后不会显示。请选今天或以后的日期。" };
  }

  const meeting: Meeting = {
    date: text(form.get("date"), 10),
    time: text(form.get("time"), 40),
    theme: text(form.get("theme"), 200),
    location: text(form.get("location"), 200) || undefined,
    meetingManager: text(form.get("meetingManager"), 40) || undefined,
    toastmaster: text(form.get("toastmaster"), 40) || undefined,
    roles: parseRoles(text(form.get("roles"), 4000)),
    agendaUrl: url(form.get("agendaUrl")),
    docUrl: url(form.get("docUrl")),
    signupUrl: url(form.get("signupUrl")),
    voteUrl: url(form.get("voteUrl")),
    extraLinks: parseLinks(text(form.get("extraLinks"), 4000)),
    note: text(form.get("note"), 1000) || undefined,
    updatedAt: new Date().toISOString(),
  };
  try {
    const store = await getStore();
    await store.saveMeeting(meeting);
  } catch (e) {
    return { ok: false, error: storageError(e) };
  }
  revalidatePath("/", "layout");
  redirect("/meeting?saved=1");
}
