import "server-only";
import { getMeetingSeed } from "@/lib/config";
import { getStore } from "@/lib/store";
import { daysBetween, todayCN } from "@/lib/date";
import type { Meeting } from "@/lib/types";

/** 最近一次填写的例会：优先读数据库（网页上填的），否则用 content/meeting.yaml 的默认值 */
export async function getCurrentMeeting(): Promise<Meeting> {
  const store = await getStore();
  return (await store.getMeeting()) ?? (await getMeetingSeed());
}

/**
 * 下一场例会：只有填了日期、且日期是今天或以后才返回。
 * 没人维护时，过期的信息会自动隐藏，页面只剩长期有效的入口——不会显示过时内容。
 */
export async function getUpcomingMeeting(): Promise<Meeting | null> {
  const m = await getCurrentMeeting();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date)) return null;
  return daysBetween(todayCN(), m.date) >= 0 ? m : null;
}
