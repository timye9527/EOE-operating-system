import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Meeting, MeetingRecord } from "@/lib/types";
import type { Store } from "./index";

// 本地 JSON 文件存储：零配置，适合本机开发或自有服务器。
// Vercel 等平台磁盘不持久，请改用 Supabase（见 README）。
const DB_PATH = path.join(process.cwd(), "data", "local-db.json");

type LocalDb = { records: MeetingRecord[]; kv: Record<string, unknown> };

async function read(): Promise<LocalDb> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const db = JSON.parse(raw) as Partial<LocalDb>;
    return { records: db.records ?? [], kv: db.kv ?? {} };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return { records: [], kv: {} };
    throw e;
  }
}

async function write(db: LocalDb) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

const byDateDesc = (a: MeetingRecord, b: MeetingRecord) =>
  b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);

export const localStore: Store = {
  async listRecords() {
    return (await read()).records.sort(byDateDesc);
  },
  async getRecord(id) {
    return (await read()).records.find((r) => r.id === id) ?? null;
  },
  async addRecord(input) {
    const db = await read();
    const record: MeetingRecord = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
    db.records.push(record);
    await write(db);
    return record;
  },
  async deleteRecord(id) {
    const db = await read();
    db.records = db.records.filter((r) => r.id !== id);
    await write(db);
  },
  async getMeeting() {
    return ((await read()).kv.current_meeting as Meeting | undefined) ?? null;
  },
  async saveMeeting(meeting) {
    const db = await read();
    db.kv.current_meeting = meeting;
    await write(db);
  },
};
