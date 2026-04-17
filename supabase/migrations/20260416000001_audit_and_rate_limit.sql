-- =====================================================================
-- 1. ログイン試行レート制限テーブル + RPC
-- 2. 監査ログテーブル
-- =====================================================================

-- ---------------------------------------------------------------------
-- login_attempts
--   IP アドレスとメールごとの試行回数を記録。
--   - 同一 IP: 60 秒で 10 回まで
--   - 同一 email: 5 分で 5 回まで
-- ---------------------------------------------------------------------
create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  email text,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_ip_created_at_idx
  on public.login_attempts (ip, created_at desc);
create index if not exists login_attempts_email_created_at_idx
  on public.login_attempts (email, created_at desc);

alter table public.login_attempts enable row level security;
-- 直接の SELECT は禁止。RPC 経由でのみ書き込み/参照する。

create or replace function public.check_login_rate_limit(
  p_ip text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip_count int;
  v_email_count int;
begin
  -- 古いログを掃除 (30 分超)
  delete from public.login_attempts where created_at < now() - interval '30 minutes';

  select count(*) into v_ip_count
    from public.login_attempts
   where ip = p_ip
     and created_at > now() - interval '60 seconds';

  if v_ip_count >= 10 then
    return jsonb_build_object('allowed', false, 'retry_after_seconds', 60);
  end if;

  if p_email is not null then
    select count(*) into v_email_count
      from public.login_attempts
     where email = p_email
       and created_at > now() - interval '5 minutes';

    if v_email_count >= 5 then
      return jsonb_build_object('allowed', false, 'retry_after_seconds', 300);
    end if;
  end if;

  insert into public.login_attempts (ip, email) values (p_ip, p_email);
  return jsonb_build_object('allowed', true);
end;
$$;

grant execute on function public.check_login_rate_limit(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- audit_logs
--   管理者の重要操作 (ステータス更新, スタッフ削除, etc.) を追跡。
-- ---------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  resource_type text not null,
  resource_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_resource_idx on public.audit_logs (resource_type, resource_id);

alter table public.audit_logs enable row level security;

-- admin のみ閲覧可
create policy "Admins can read audit logs"
  on public.audit_logs for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
    )
  );

-- 認証ユーザーは自分の操作を記録可
create policy "Authenticated can insert audit logs"
  on public.audit_logs for insert
  to authenticated
  with check (actor_id = auth.uid());
