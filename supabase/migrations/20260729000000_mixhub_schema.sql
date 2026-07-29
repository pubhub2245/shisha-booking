-- ============================================================
-- MixHub — シーシャ ミックス図鑑 スキーマ
-- 旧・出張シーシャ予約アプリからの方向転換に伴う新規スキーマ。
-- ============================================================

-- ---------- profiles（ユーザー / 店舗） ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique,
  display_name text,
  bio          text,
  avatar_url   text,
  -- 店舗登録
  is_shop      boolean not null default false,
  shop_name    text,
  shop_area    text,
  shop_url     text,
  created_at   timestamptz not null default now()
);

-- サインアップ時に profiles を自動作成
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    split_part(coalesce(new.email, 'user'), '@', 1) || '_' || substr(new.id::text, 1, 6),
    split_part(coalesce(new.email, 'user'), '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- flavors（フレーバー・マスタ / アフィリエイト） ----------
create table if not exists public.flavors (
  id            uuid primary key default gen_random_uuid(),
  brand         text not null,
  name          text not null,
  affiliate_url text,          -- 購入アフィリエイトリンク
  image_url     text,
  created_at    timestamptz not null default now(),
  unique (brand, name)
);

-- ---------- mixes（ミックス投稿） ----------
create table if not exists public.mixes (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid references public.profiles(id) on delete set null, -- null = MixHub 編集部
  title           text not null,
  description     text,
  taste_tags      text[] not null default '{}',           -- 甘い / スッキリ / フルーツ 等
  strength        text check (strength in ('light','medium','strong')),
  heat_management text,                                    -- 熱帯（炭）管理・時間経過のノウハウ
  placement_note  text,                                    -- フレーバーの置き方
  like_count      integer not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists mixes_created_at_idx on public.mixes (created_at desc);
create index if not exists mixes_like_count_idx on public.mixes (like_count desc);
create index if not exists mixes_taste_tags_idx on public.mixes using gin (taste_tags);

-- ---------- mix_flavors（ミックスで使うフレーバー） ----------
create table if not exists public.mix_flavors (
  id            uuid primary key default gen_random_uuid(),
  mix_id        uuid not null references public.mixes(id) on delete cascade,
  flavor_id     uuid references public.flavors(id) on delete set null,
  position      integer not null default 0,
  brand         text,
  name          text not null,
  ratio         integer,        -- 割合（%）や pt。任意
  placement     text,           -- このフレーバー固有の置き方
  affiliate_url text,           -- 購入リンク（flavor_id が無い場合はここに直接）
  created_at    timestamptz not null default now()
);
create index if not exists mix_flavors_mix_id_idx on public.mix_flavors (mix_id);

-- ---------- likes（いいね） ----------
create table if not exists public.likes (
  mix_id     uuid not null references public.mixes(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (mix_id, user_id)
);

-- like_count を likes に同期
create or replace function public.sync_like_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.mixes set like_count = like_count + 1 where id = new.mix_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.mixes set like_count = greatest(like_count - 1, 0) where id = old.mix_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists on_like_change on public.likes;
create trigger on_like_change
  after insert or delete on public.likes
  for each row execute function public.sync_like_count();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles    enable row level security;
alter table public.flavors     enable row level security;
alter table public.mixes       enable row level security;
alter table public.mix_flavors enable row level security;
alter table public.likes       enable row level security;

-- profiles: 全員閲覧可、本人のみ作成・更新
create policy "profiles_select_all"  on public.profiles for select using (true);
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id);

-- flavors: 全員閲覧可、ログインユーザーは追加可
create policy "flavors_select_all"    on public.flavors for select using (true);
create policy "flavors_insert_authed" on public.flavors for insert
  with check (auth.role() = 'authenticated');

-- mixes: 全員閲覧可、本人のみ作成・更新・削除
create policy "mixes_select_all"    on public.mixes for select using (true);
create policy "mixes_insert_self"   on public.mixes for insert with check (auth.uid() = author_id);
create policy "mixes_update_self"   on public.mixes for update using (auth.uid() = author_id);
create policy "mixes_delete_self"   on public.mixes for delete using (auth.uid() = author_id);

-- mix_flavors: 全員閲覧可、親ミックスの所有者のみ編集
create policy "mix_flavors_select_all" on public.mix_flavors for select using (true);
create policy "mix_flavors_write_owner" on public.mix_flavors for all
  using (exists (select 1 from public.mixes m where m.id = mix_id and m.author_id = auth.uid()))
  with check (exists (select 1 from public.mixes m where m.id = mix_id and m.author_id = auth.uid()));

-- likes: 全員閲覧可、本人のみ付与・解除
create policy "likes_select_all"  on public.likes for select using (true);
create policy "likes_insert_self" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes_delete_self" on public.likes for delete using (auth.uid() = user_id);

-- トリガ用の SECURITY DEFINER 関数は RPC 経由で呼ばせない（Supabase advisor 対応）
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.sync_like_count() from anon, authenticated, public;

-- ============================================================
-- Seed — 図鑑を初回から充実させるためのショーケース
--   author_id = null（MixHub 編集部）で投入
-- ============================================================
insert into public.flavors (id, brand, name, affiliate_url) values
  ('11111111-0000-0000-0000-000000000001','AL FAKHER','ダブルアップル','https://www.amazon.co.jp/s?k=al+fakher+double+apple&tag=mixhub-22'),
  ('11111111-0000-0000-0000-000000000002','AL FAKHER','ミント','https://www.amazon.co.jp/s?k=al+fakher+mint&tag=mixhub-22'),
  ('11111111-0000-0000-0000-000000000003','AL FAKHER','レモンミント','https://www.amazon.co.jp/s?k=al+fakher+lemon+mint&tag=mixhub-22'),
  ('11111111-0000-0000-0000-000000000004','ADALYA','ラブ66','https://www.amazon.co.jp/s?k=adalya+love+66&tag=mixhub-22'),
  ('11111111-0000-0000-0000-000000000005','ADALYA','アイスアクア','https://www.amazon.co.jp/s?k=adalya+ice+aqua&tag=mixhub-22'),
  ('11111111-0000-0000-0000-000000000006','FUMARI','ホワイトグミベア','https://www.amazon.co.jp/s?k=fumari+white+gummi+bear&tag=mixhub-22'),
  ('11111111-0000-0000-0000-000000000007','FUMARI','アンビエンス','https://www.amazon.co.jp/s?k=fumari+ambrosia&tag=mixhub-22'),
  ('11111111-0000-0000-0000-000000000008','AZURE','ピーチベリー','https://www.amazon.co.jp/s?k=azure+peach+berry&tag=mixhub-22')
on conflict (id) do nothing;

insert into public.mixes (id, author_id, title, description, taste_tags, strength, heat_management, placement_note, like_count) values
  ('22222222-0000-0000-0000-000000000001', null,
   '王道スッキリ｜ダブルアップル × ミント',
   '迷ったらこれ。定番の甘さにミントの清涼感を重ねた、誰にでも刺さる王道ミックス。初めての一杯にもおすすめ。',
   array['甘い','スッキリ','定番'], 'medium',
   '序盤は炭3つで軽め、中盤に1つ足して立ち上げる。飛ばしすぎ注意。',
   'ダブルアップルを底に厚め、ミントは表面に薄く散らす。', 42),
  ('22222222-0000-0000-0000-000000000002', null,
   'ひたすら爽快｜レモンミント × アイスアクア',
   '暑い日に吸いたい、突き抜ける清涼系。酸味と冷涼感でリフレッシュしたいときに。',
   array['スッキリ','爽快','夏'], 'light',
   '終始弱火キープ。熱を入れすぎると苦味が出るので炭は2〜3つで。',
   'フラットに均一敷き。密度は詰めすぎず空気の通り道を残す。', 28),
  ('22222222-0000-0000-0000-000000000003', null,
   '甘党の極み｜ラブ66 × ホワイトグミベア',
   'ベリーとキャンディの濃厚な甘さ。デザート感覚でじっくり楽しみたい人へ。',
   array['甘い','フルーツ','濃厚'], 'medium',
   '中火で長く。甘い系は熱が回ると蜜が出るので中盤以降にピークを作る。',
   'ふんわり盛りで空気を含ませる。押さえつけない。', 35)
on conflict (id) do nothing;

insert into public.mix_flavors (mix_id, flavor_id, position, brand, name, ratio, affiliate_url) values
  ('22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001',0,'AL FAKHER','ダブルアップル',70,'https://www.amazon.co.jp/s?k=al+fakher+double+apple&tag=mixhub-22'),
  ('22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002',1,'AL FAKHER','ミント',30,'https://www.amazon.co.jp/s?k=al+fakher+mint&tag=mixhub-22'),
  ('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000003',0,'AL FAKHER','レモンミント',60,'https://www.amazon.co.jp/s?k=al+fakher+lemon+mint&tag=mixhub-22'),
  ('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000005',1,'ADALYA','アイスアクア',40,'https://www.amazon.co.jp/s?k=adalya+ice+aqua&tag=mixhub-22'),
  ('22222222-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000004',0,'ADALYA','ラブ66',50,'https://www.amazon.co.jp/s?k=adalya+love+66&tag=mixhub-22'),
  ('22222222-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000006',1,'FUMARI','ホワイトグミベア',50,'https://www.amazon.co.jp/s?k=fumari+white+gummi+bear&tag=mixhub-22')
on conflict do nothing;
