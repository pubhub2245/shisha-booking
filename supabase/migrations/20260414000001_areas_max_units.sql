-- areas テーブルに max_units カラム追加
alter table public.areas add column if not exists max_units integer not null default 0;

-- 各エリアの台数を設定
update public.areas set max_units = 0 where label = '宮崎市内（西橘周辺）';
update public.areas set max_units = 2 where label = '都城市内（牟田町周辺）';
update public.areas set max_units = 6 where label = '鹿児島市内（天文館周辺）';
