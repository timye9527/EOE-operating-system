import "server-only";
import { connection } from "next/server";
import type { Meeting, MeetingRecord, NewMeetingRecord } from "@/lib/types";
import { localStore } from "./local";
import { supabaseStore } from "./supabase";

/**
 * 存储接口。只有两类真正需要写入的数据：
 * - 会后记录（records）
 * - 本周例会（kv: current_meeting）
 * 其余内容（成长百科、工作台、工具）都在 content/ 里，用 Git 管理。
 */
export interface Store {
  listRecords(): Promise<MeetingRecord[]>; // 按日期倒序
  getRecord(id: string): Promise<MeetingRecord | null>;
  addRecord(input: NewMeetingRecord): Promise<MeetingRecord>;
  deleteRecord(id: string): Promise<void>;
  getMeeting(): Promise<Meeting | null>;
  saveMeeting(meeting: Meeting): Promise<void>;
}

export function storeMode(): "supabase" | "local" {
  return process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? "supabase"
    : "local";
}

/** 读取数据前调用：标记页面为按请求动态渲染（数据每次都是最新的） */
export async function getStore(): Promise<Store> {
  await connection();
  return storeMode() === "supabase" ? supabaseStore() : localStore;
}
