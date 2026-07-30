-- ============================================================
-- ボウル・盛り方（玄人向けセットアップ軸）
-- ============================================================
alter table public.mixes
  add column if not exists bowl_type  text,   -- clay / funnel / vortex / silicone / other
  add column if not exists pack_style text;   -- fluff / flat / dense / overpack / other

update public.mixes
  set bowl_type = 'funnel', pack_style = 'fluff'
where author_id is null;
