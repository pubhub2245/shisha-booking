-- bars テーブル
create table if not exists public.bars (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text not null,
  area text not null,
  created_at timestamptz default now()
);
alter table public.bars enable row level security;
create policy "Anyone can read bars" on public.bars for select using (true);
create policy "Authenticated can manage bars" on public.bars for all to authenticated using (true) with check (true);

-- flavors テーブル
create table if not exists public.flavors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  stock integer not null default 0,
  created_at timestamptz default now()
);
alter table public.flavors enable row level security;
create policy "Anyone can read flavors" on public.flavors for select using (true);
create policy "Authenticated can manage flavors" on public.flavors for all to authenticated using (true) with check (true);

-- areas テーブルを更新
delete from public.areas;
insert into public.areas (prefecture, city, label, is_active) values
  ('宮崎県', '宮崎市', '宮崎市内（西橘周辺）', true),
  ('宮崎県', '都城市', '都城市内（牟田町周辺）', true),
  ('鹿児島県', '鹿児島市', '鹿児島市内（天文館周辺）', true);

-- reservations に flavor_id カラム追加
alter table public.reservations add column if not exists flavor_id uuid references public.flavors(id);

-- フレーバー在庫デクリメント用RPC関数
create or replace function public.decrement_flavor_stock(flavor_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.flavors
  set stock = greatest(stock - 1, 0)
  where id = flavor_id;
end;
$$;
