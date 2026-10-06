import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Meeting, MeetingRecord } from "@/lib/types";
import type { Store } from "./index";

// Supabase 存储。表结构见 supabase/schema.sql。
// 只在服务端用 service role key 访问；表开启 RLS 且不开放任何 policy，浏览器无法直连。

type RecordRow = {
  id: string;
  date: string;
  theme: string;
  member_count: number;
  guest_count: number;
  guest_sources: MeetingRecord["guestSources"];
  prepared_speeches: number;
  winners: string;
  reflection: string;
  note: string | null;
  created_at: string;
};

const fromRow = (r: RecordRow): MeetingRecord => ({
  id: r.id,
  date: r.date,
  theme: r.theme,
  memberCount: r.member_count,
  guestCount: r.guest_count,
  guestSources: r.guest_sources ?? [],
  preparedSpeeches: r.prepared_speeches,
  winners: r.winners,
  reflection: r.reflection,
  note: r.note ?? undefined,
  createdAt: r.created_at,
});

let client: SupabaseClient | null = null;
function db() {
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  return client;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data;
}

export function supabaseStore(): Store {
  return {
    async listRecords() {
      const rows = check(
        await db()
          .from("meeting_records")
          .select("*")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false }),
      );
      return (rows as RecordRow[]).map(fromRow);
    },
    async getRecord(id) {
      const row = check(await db().from("meeting_records").select("*").eq("id", id).maybeSingle());
      return row ? fromRow(row as RecordRow) : null;
    },
    async addRecord(input) {
      const row = check(
        await db()
          .from("meeting_records")
          .insert({
            date: input.date,
            theme: input.theme,
            member_count: input.memberCount,
            guest_count: input.guestCount,
            guest_sources: input.guestSources,
            prepared_speeches: input.preparedSpeeches,
            winners: input.winners,
            reflection: input.reflection,
            note: input.note ?? null,
          })
          .select("*")
          .single(),
      );
      return fromRow(row as RecordRow);
    },
    async deleteRecord(id) {
      check(await db().from("meeting_records").delete().eq("id", id));
    },
    async getMeeting() {
      const row = check(
        await db().from("kv").select("value").eq("key", "current_meeting").maybeSingle(),
      );
      return (row?.value as Meeting | undefined) ?? null;
    },
    async saveMeeting(meeting) {
      check(
        await db()
          .from("kv")
          .upsert({ key: "current_meeting", value: meeting, updated_at: new Date().toISOString() }),
      );
    },
  };
}
