-- LINE Webhook で受信した友だち追加・メッセージ送信者の User ID を保存する
-- 管理画面から「スタッフ登録」ボタンで notification_recipients に移せる

create table if not exists line_webhook_users (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null unique,
  display_name text,        -- プロフィールAPI で取得できた場合のみ
  message text,             -- 最新のメッセージ内容（任意）
  registered boolean not null default false,  -- notification_recipients に登録済みか
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- admin のみ操作可能
alter table line_webhook_users enable row level security;

create policy "admin_full_access" on line_webhook_users
  for all
  using ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
         or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
         or (auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'admin')
  with check ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
              or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
              or (auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'admin');

-- Webhook API は service_role キーで書き込むため RLS をバイパスできる
-- フロントエンドからの読み取りは admin RLS で保護される
