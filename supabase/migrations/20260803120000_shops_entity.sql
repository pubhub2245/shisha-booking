-- ============================================================
-- 店舗を独立エンティティ化し、個人アカウントを所属メンバーとして紐付ける。
--  - shops: お店そのもの（オーナー = 登録者）
--  - shop_members: 個人アカウント ↔ 店舗（オーナー承認制）
--  - shop_flavors: 在庫棚を shops へ再ポイント（承認済みスタッフが編集）
-- 旧モデル（profile.is_shop 自体が店舗）から分離。is_shop は「どこかの店に承認所属している」フラグとして同期。
-- ============================================================

create table if not exists public.shops (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  area        text,
  url         text,
  description text,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists shops_owner_idx on public.shops(owner_id);

create table if not exists public.shop_members (
  shop_id    uuid not null references public.shops(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'staff'   check (role in ('owner','staff')),
  status     text not null default 'pending' check (status in ('pending','approved')),
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);
create index if not exists shop_members_user_idx on public.shop_members(user_id);

-- 在庫棚を shops へ再ポイント（既存は空なので作り直す）
drop table if exists public.shop_flavors cascade;
create table public.shop_flavors (
  shop_id    uuid not null references public.shops(id) on delete cascade,
  flavor_id  uuid not null references public.flavors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (shop_id, flavor_id)
);
create index if not exists shop_flavors_flavor_idx on public.shop_flavors(flavor_id);

-- ---------- RLS ----------
alter table public.shops enable row level security;
create policy "shops_select_all"  on public.shops for select using (true);
create policy "shops_insert_own"  on public.shops for insert with check (auth.uid() = owner_id);
create policy "shops_update_own"  on public.shops for update using (auth.uid() = owner_id);
create policy "shops_delete_own"  on public.shops for delete using (auth.uid() = owner_id);

alter table public.shop_members enable row level security;
-- 承認済みは公開／本人と店オーナーは pending も閲覧可
create policy "shop_members_select" on public.shop_members for select using (
  status = 'approved'
  or user_id = auth.uid()
  or exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
);
-- 自分の行しか作れない。オーナーは owner/approved、他は staff/pending のみ（なりすまし・自己承認の防止）
create policy "shop_members_insert" on public.shop_members for insert with check (
  user_id = auth.uid()
  and (
    (role = 'owner' and status = 'approved'
      and exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()))
    or (role = 'staff' and status = 'pending')
  )
);
-- 承認・変更は店オーナーのみ
create policy "shop_members_update" on public.shop_members for update using (
  exists (select 1 from public.shops s where s.id = shop_members.shop_id and s.owner_id = auth.uid())
);
-- 本人（退店）または店オーナー（除名）
create policy "shop_members_delete" on public.shop_members for delete using (
  user_id = auth.uid()
  or exists (select 1 from public.shops s where s.id = shop_members.shop_id and s.owner_id = auth.uid())
);

alter table public.shop_flavors enable row level security;
create policy "shop_flavors_select_all" on public.shop_flavors for select using (true);
-- 在庫の追加・削除は「承認済みメンバー」のみ
create policy "shop_flavors_insert_member" on public.shop_flavors for insert with check (
  exists (select 1 from public.shop_members m
          where m.shop_id = shop_flavors.shop_id and m.user_id = auth.uid() and m.status = 'approved')
);
create policy "shop_flavors_delete_member" on public.shop_flavors for delete using (
  exists (select 1 from public.shop_members m
          where m.shop_id = shop_flavors.shop_id and m.user_id = auth.uid() and m.status = 'approved')
);

-- ---------- is_shop 同期（承認所属で true に） ----------
create or replace function public.sync_is_shop() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' then
    update public.profiles set is_shop = true where id = new.user_id;
  end if;
  return new;
end $$;

drop trigger if exists shop_members_sync_is_shop on public.shop_members;
create trigger shop_members_sync_is_shop
  after insert or update on public.shop_members
  for each row execute function public.sync_is_shop();
