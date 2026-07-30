-- ============================================================
-- プロ認証の審査制
--   ユーザーが SNS アカウント付きで申請 → 運営（管理者）が確認して承認 → is_pro 付与
-- ============================================================
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- 管理者判定ヘルパ
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 申請テーブル
create table if not exists public.pro_applications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  sns_type    text not null check (sns_type in ('x','instagram')),
  sns_handle  text not null,
  shop_name   text not null,
  message     text,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists pro_app_status_idx on public.pro_applications (status, created_at desc);
create unique index if not exists pro_app_one_pending on public.pro_applications (user_id) where status = 'pending';

alter table public.pro_applications enable row level security;
create policy "pro_app_select_self_or_admin" on public.pro_applications for select
  using (auth.uid() = user_id or public.is_admin());
create policy "pro_app_insert_self" on public.pro_applications for insert
  with check (auth.uid() = user_id);

-- 審査（管理者のみ）。is_pro は列権限で保護しているため SECURITY DEFINER 経由でのみ付与。
create or replace function public.review_pro_application(p_app_id uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_user uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  select user_id into v_user from public.pro_applications where id = p_app_id;
  if v_user is null then
    raise exception 'application not found';
  end if;
  if p_approve then
    update public.pro_applications set status = 'approved', reviewed_at = now() where id = p_app_id;
    update public.profiles set is_pro = true where id = v_user;
  else
    update public.pro_applications set status = 'rejected', reviewed_at = now() where id = p_app_id;
  end if;
end;
$$;
revoke execute on function public.review_pro_application(uuid, boolean) from public;
grant execute on function public.review_pro_application(uuid, boolean) to authenticated;

-- 管理者の付与例（運営がSQLで実行）:
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = '<管理者メール>');
