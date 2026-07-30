-- ============================================================
-- 炭・熱源セットアップ + 火力スケールを 1-100 へ
-- ============================================================
alter table public.mixes
  add column if not exists hms_type       text,     -- foil / kaloud / provost / other
  add column if not exists charcoal_type  text,     -- cube / flat / coconut / ogatan / other
  add column if not exists charcoal_count integer,
  add column if not exists wind_cover     boolean;

-- heat_curve の火力を 1-5 → 1-100 スケールへ換算
update public.mixes set heat_curve = (
  select jsonb_agg(
    jsonb_build_object('t', (e->>'t')::int, 'v', least(100, greatest(1, (e->>'v')::int * 20)))
  )
  from jsonb_array_elements(heat_curve) e
)
where heat_curve is not null;

-- サンプルの炭セットアップ（後で本物に差し替え）
update public.mixes
  set hms_type = 'kaloud', charcoal_type = 'cube', charcoal_count = 3, wind_cover = false
where author_id is null;
