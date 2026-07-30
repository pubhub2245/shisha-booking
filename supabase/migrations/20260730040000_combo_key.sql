-- ============================================================
-- Combo（組み合わせ）キー
--   フレーバーの「種類（brand|name）」のみを正規化し、割合・順番・重複を無視して
--   ソート連結する。同じ組み合わせの複数の「作り方」を束ねるために使う。
-- ============================================================
alter table public.mixes add column if not exists combo_key text not null default '';

update public.mixes m set combo_key = coalesce((
  select string_agg(k, ' + ' order by k)
  from (
    select distinct lower(trim(coalesce(mf.brand,'')) || '|' || trim(mf.name)) as k
    from public.mix_flavors mf where mf.mix_id = m.id
  ) s
), '');

create index if not exists mixes_combo_key_idx on public.mixes (combo_key);
