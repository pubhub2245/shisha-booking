-- ============================================================
-- (A) プロ認証申請に「所属店舗」を紐付け（任意）
-- (C) アフィリエイト等のクリック計測（CPAの土台）
-- ============================================================

-- (A) 在籍店を shops エンティティで指定できるように（自由入力の shop_name も併存）
alter table public.pro_applications
  add column if not exists shop_id uuid references public.shops(id) on delete set null;

-- (C) クリックログ
create table if not exists public.link_clicks (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.profiles(id) on delete set null,
  flavor_id  uuid references public.flavors(id) on delete set null,
  mix_id     uuid references public.mixes(id) on delete set null,
  shop_id    uuid references public.shops(id) on delete set null,
  target     text not null,
  created_at timestamptz not null default now()
);
create index if not exists link_clicks_flavor_idx on public.link_clicks(flavor_id);
create index if not exists link_clicks_created_idx on public.link_clicks(created_at);

alter table public.link_clicks enable row level security;
-- 誰でも記録できる（未ログインのクリックも計測）／閲覧は管理者のみ
create policy "link_clicks_insert_any" on public.link_clicks for insert with check (true);
create policy "link_clicks_select_admin" on public.link_clicks for select using (public.is_admin());
