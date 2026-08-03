-- ============================================================
-- 店舗の在庫棚：シーシャ店が「今ある（吸える）フレーバー」を登録する。
--  - 来店誘導：フレーバー詳細から「取り扱い店舗」を表示
--  - 店頭QR：/s/[username] を店内メニュー表として提示
--  - 在庫管理：店がアプリを更新＝そのまま在庫の反映
-- 個人の棚(shelf)とは別テーブル。棚は本人のみ閲覧だが、店の棚は公開読み取り。
-- ============================================================
create table if not exists public.shop_flavors (
  shop_id    uuid not null references public.profiles(id) on delete cascade,
  flavor_id  uuid not null references public.flavors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (shop_id, flavor_id)
);

create index if not exists shop_flavors_flavor_idx on public.shop_flavors(flavor_id);

alter table public.shop_flavors enable row level security;
-- 公開メニュー：誰でも閲覧可
create policy "shop_flavors_select_all" on public.shop_flavors for select using (true);
-- 登録・削除は本人（店アカウント）のみ
create policy "shop_flavors_insert_own" on public.shop_flavors for insert with check (auth.uid() = shop_id);
create policy "shop_flavors_delete_own" on public.shop_flavors for delete using (auth.uid() = shop_id);
