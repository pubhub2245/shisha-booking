-- STEP 6 最終調整：公開味覚平均を「ユーザー単位の2段階平均」にする。
--   ① 同一user × 同一mix の複数評価をまず平均（1人が何度も評価して平均を動かせないように）
--   ② そのユーザー平均どうしを平均
-- 母数は experience 数ではなく、その軸を評価した distinct user 数。
-- experience 履歴そのものは削除・統合しない（煙道帳は従来どおり experience 単位）。
create or replace function public.mix_taste_summary(p_mix uuid)
returns table (
  sweetness_avg numeric, sweetness_count bigint,
  coolness_avg  numeric, coolness_count  bigint,
  sourness_avg  numeric, sourness_count  bigint,
  richness_avg  numeric, richness_count  bigint,
  heaviness_avg numeric, heaviness_count bigint,
  rater_count   bigint
)
language sql stable security definer set search_path = public as $$
  with per_user as (
    select e.user_id,
           avg(t.sweetness) as sweetness,
           avg(t.coolness)  as coolness,
           avg(t.sourness)  as sourness,
           avg(t.richness)  as richness,
           avg(t.heaviness) as heaviness
    from public.taste_evaluations t
    join public.mix_experiences e on e.id = t.experience_id
    where e.mix_id = p_mix
    group by e.user_id
  )
  select
    round(avg(sweetness), 1), count(sweetness),
    round(avg(coolness),  1), count(coolness),
    round(avg(sourness),  1), count(sourness),
    round(avg(richness),  1), count(richness),
    round(avg(heaviness), 1), count(heaviness),
    count(*)
  from per_user;
$$;

revoke execute on function public.mix_taste_summary(uuid) from public;
grant  execute on function public.mix_taste_summary(uuid) to anon, authenticated;
