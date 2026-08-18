-- 比較の読み出し。
--
-- これまで直接比較（compared_to_mix_id / comparison / comparison_axes）は
-- 書き込むだけで、どこからも読まれていなかった。集計値は /admin/theme の総数のみ。
-- 「比較はゴールではなく、比較から次の実験が生まれること」が目的なので、
-- 比較の結果を読み出せないと、比較した本人にも他の作り手にも何も返らない。
--
-- mix_experiences の SELECT は本人のみ（RLS）なので、他人を含む集計は SECURITY DEFINER で行う。
-- 作者が自分の作り方を作った体験は、theme_method_stats / theme_progress と同じく除外する。

-- ---------------------------------------------------------------------------
-- 作り方ごとの「比較された実績」。
--
-- 1件の比較は2つの作り方にまたがる。比較した側（subject）だけを数えると、
-- 比較相手にされ続けている作り方の実績が0のままになるので、両側を数える。
-- better/worse は相手側から見ると裏返るので、object 側では入れ替える。
--
-- preferred（どちらが好まれたか）は公開画面には出さない。出すと勝敗表になり、
-- 王道が人気投票になる（CLAUDE.md 行動原則3）。運営用の /admin/theme のみで使う。
-- ---------------------------------------------------------------------------
create or replace function public.theme_comparison_stats(p_combo_key text)
returns table (
  mix_id uuid,
  compared int,
  differed int,
  same_count int,
  preferred int
)
language sql
security definer
set search_path = public
stable
as $$
  with theme as (
    select m.id, m.author_id from public.mixes m where m.combo_key = p_combo_key
  ),
  src as (
    select e.mix_id, e.compared_to_mix_id, e.comparison
    from public.mix_experiences e
    join theme t on t.id = e.mix_id
    where e.experience_type = 'made'
      and e.comparison is not null
      and e.compared_to_mix_id is not null
      and (t.author_id is null or e.user_id <> t.author_id)
  ),
  events as (
    select mix_id, comparison as result from src
    union all
    select
      compared_to_mix_id as mix_id,
      case comparison when 'better' then 'worse' when 'worse' then 'better' else 'same' end as result
    from src
  )
  select
    t.id as mix_id,
    (select count(*) from events v where v.mix_id = t.id)::int as compared,
    (select count(*) from events v where v.mix_id = t.id and v.result <> 'same')::int as differed,
    (select count(*) from events v where v.mix_id = t.id and v.result = 'same')::int as same_count,
    (select count(*) from events v where v.mix_id = t.id and v.result = 'better')::int as preferred
  from theme t;
$$;

revoke all on function public.theme_comparison_stats(text) from public;
grant execute on function public.theme_comparison_stats(text) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- テーマ全体で「どんな違いとして現れたか」（comparison_axes の集計）。
-- 5軸（ボウル・詰め方・HMD・炭・初期加熱）ではなく、味の出方を表す言葉のほう。
-- どの言葉で差が語られているかは、まだ母数が無いうちは運営だけが見る。
-- ---------------------------------------------------------------------------
create or replace function public.theme_comparison_axes(p_combo_key text)
returns table (
  axis text,
  count int
)
language sql
security definer
set search_path = public
stable
as $$
  with theme as (
    select m.id, m.author_id from public.mixes m where m.combo_key = p_combo_key
  ),
  src as (
    select unnest(e.comparison_axes) as axis
    from public.mix_experiences e
    join theme t on t.id = e.mix_id
    where e.experience_type = 'made'
      and e.comparison is not null
      and (t.author_id is null or e.user_id <> t.author_id)
  )
  select axis, count(*)::int from src group by axis order by count(*) desc, axis;
$$;

revoke all on function public.theme_comparison_axes(text) from public;
grant execute on function public.theme_comparison_axes(text) to anon, authenticated;
