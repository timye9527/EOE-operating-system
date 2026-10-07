// EOE Club OS 的核心数据结构。
// 改字段时同步更新：supabase/schema.sql、src/lib/store/*、docs/ARCHITECTURE.md

/** 一个外部链接（模板、资料、工具入口都用它） */
export type LinkItem = {
  label: string;
  url?: string; // 为空 = 待补充，页面会显示为灰色
  note?: string;
};

/** 外部工具 / 资源（content/tools.yaml） */
export type Tool = {
  id: string;
  name: string;
  category: string;
  url?: string;
  purpose?: string;
  note?: string;
  /** 投票模板专用：使用的投票工具名称，例如「腾讯问卷」 */
  tool?: string;
};

export type ToolCategory = { id: string; label: string; emoji?: string };

/** 例会上的一个角色分配 */
export type RoleAssignment = { role: string; name: string };

/** 下一场例会（可选；存储在数据库 kv: current_meeting，缺省时读 content/meeting.yaml；日期过了自动不显示） */
export type Meeting = {
  date: string; // YYYY-MM-DD
  time: string; // 例如 "19:30-21:30"
  theme: string;
  location?: string;
  meetingManager?: string;
  toastmaster?: string;
  roles: RoleAssignment[];
  agendaUrl?: string; // 会单
  docUrl?: string; // 腾讯文档
  signupUrl?: string; // 接龙（微信群接龙说明 / 链接）
  voteUrl?: string; // 本场绑定的投票链接
  extraLinks: LinkItem[];
  note?: string;
  updatedAt?: string;
};

/** 嘉宾来源计数 */
export type GuestSourceCount = { source: string; count: number };

/** 会后 1 分钟记录 */
export type MeetingRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  theme: string;
  memberCount: number;
  guestCount: number;
  guestSources: GuestSourceCount[];
  preparedSpeeches: number;
  winners: string;
  reflection: string; // 一句话复盘
  note?: string;
  createdAt: string; // ISO
};

export type NewMeetingRecord = Omit<MeetingRecord, "id" | "createdAt">;
