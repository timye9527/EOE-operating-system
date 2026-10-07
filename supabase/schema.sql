-- EOE Club OS v0.1 数据库结构（Supabase / PostgreSQL）
-- 使用：Supabase 控制台 → SQL Editor → 粘贴执行一次即可。

-- 会后 1 分钟记录
create table if not exists meeting_records (
  id                uuid primary key default gen_random_uuid(),
  date              date not null,
  theme             text not null default '',
  member_count      integer not null default 0,
  guest_count       integer not null default 0,
  -- [{ "source": "小红书", "count": 2 }, ...]
  guest_sources     jsonb not null default '[]'::jsonb,
  prepared_speeches integer not null default 0,
  winners           text not null default '',
  reflection        text not null default '',
  note              text,
  created_at        timestamptz not null default now()
);

create index if not exists meeting_records_date_idx on meeting_records (date desc);

-- 简单键值存储：只有 current_meeting（下一场例会，可选，日期过了自动隐藏）
create table if not exists kv (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- 开启 RLS 且不建任何 policy：只有服务端的 service role key 能读写，
-- 浏览器端的 anon key 无法直接访问这些表。
alter table meeting_records enable row level security;
alter table kv enable row level security;
