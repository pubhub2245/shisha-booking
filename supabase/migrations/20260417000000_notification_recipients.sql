-- 通知先スタッフテーブル
-- 予約成立時にエリアが一致するスタッフへ LINE / メール通知を送る

create table if not exists notification_recipients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  line_user_id text,
  email text,
  area_labels text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS: 管理者のみ読み書き可
alter table notification_recipients enable row level security;

create policy "admin_full_access" on notification_recipients
  for all
  using (
    (select (raw_app_meta_data ->> 'role') from auth.users where id = auth.uid()) = 'admin'
  )
  with check (
    (select (raw_app_meta_data ->> 'role') from auth.users where id = auth.uid()) = 'admin'
  );
