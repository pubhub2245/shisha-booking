-- ============================================================
-- 炭イベント（タイムライン上のマーカー）
--   heat_events = [{ "t": 経過分, "type": add|remove|ash|rotate|other, "note": "..." }, ...]
-- ============================================================
alter table public.mixes add column if not exists heat_events jsonb;

update public.mixes set heat_events =
  '[{"t":5,"type":"add","note":"炭を1つ追加"},{"t":20,"type":"ash","note":"灰を落とす"}]'::jsonb
where id = '22222222-0000-0000-0000-000000000001';

update public.mixes set heat_events =
  '[{"t":10,"type":"rotate","note":"炭をローテーション"},{"t":22,"type":"ash"}]'::jsonb
where id = '22222222-0000-0000-0000-000000000007';
