import "server-only";
import { getMeetingSeed } from "@/lib/config";
import { getStore } from "@/lib/store";
import type { Meeting } from "@/lib/types";

/** 本周例会：优先读数据库（网页上改过的），否则用 content/meeting.yaml 的默认值 */
export async function getCurrentMeeting(): Promise<Meeting> {
  const store = await getStore();
  return (await store.getMeeting()) ?? (await getMeetingSeed());
}
