-- 立ち上げ時の炭のサイズ（mm）。
--
-- 「炭3個」だけでは熱量が決まらない。26mm のキューブ3個と 22mm のキューブ3個では
-- 与える熱がまるで違うので、個数と同じ強さで比較に効く。
-- キューブなら一辺、フラットなら長辺の目安を入れる（正確さより、比べられることを優先）。
--
-- 追加のみ・nullable なので既存データと RLS に影響しない。

alter table public.mixes
  add column if not exists charcoal_size_mm smallint;

comment on column public.mixes.charcoal_size_mm is
  '立ち上げ時の炭のサイズ（mm）。キューブは一辺、フラットは長辺の目安';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'mixes_charcoal_size_mm_check') then
    alter table public.mixes
      add constraint mixes_charcoal_size_mm_check
      check (charcoal_size_mm is null or (charcoal_size_mm between 5 and 100));
  end if;
end $$;

-- 熱管理カーブ（mixes.heat_curve / jsonb）の各点は
--   { t: 経過分, v: 火力, coals?: その時点の個数, coalState?: 'fresh'|'half'|'late' }
-- を持つ。coalState は「その時点で炭がどれだけ燃えているか」で、
-- 同じ3個でも熾したてか終盤かで温度が変わるため、個数と対で見る。
-- jsonb なのでスキーマ変更は不要（この注記は経緯を残すためのもの）。
