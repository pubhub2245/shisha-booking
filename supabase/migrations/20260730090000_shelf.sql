-- ============================================================
-- マイ棚：ユーザーが持っているフレーバー（→ 作れるミックスを絞り込み）
-- ============================================================
create table if not exists public.shelf (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  flavor_id  uuid not null references public.flavors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, flavor_id)
);

alter table public.shelf enable row level security;
create policy "shelf_select_self" on public.shelf for select using (auth.uid() = user_id);
create policy "shelf_insert_self" on public.shelf for insert with check (auth.uid() = user_id);
create policy "shelf_delete_self" on public.shelf for delete using (auth.uid() = user_id);
