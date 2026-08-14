-- STEP 7: 作り手が煙道に残した実績（事実の可視化。スコア・段位ではない）
--   ・作り方  ＝ 公開されている作り方の件数
--   ・王道    ＝ 現在の公式王道の件数（過去の認定歴は加算しない）
--   ・吸われた／再現された ＝ **他者による**体験のみ（作り手本人の自己体験は除外）
-- 公開するのは集計値のみ。個票・user_id・日時は返さない。
create or replace function public.author_endo_stats(p_author uuid)
returns table (
  method_count    bigint,
  orthodoxy_count bigint,
  smoke_count     bigint,
  smoker_count    bigint,
  made_count      bigint,
  maker_count     bigint
)
language sql stable security definer set search_path = public as $$
  with own as (
    select id from public.mixes where author_id = p_author and hidden = false
  ),
  others as (
    select e.experience_type, e.user_id
    from public.mix_experiences e
    join own o on o.id = e.mix_id
    where e.user_id <> p_author
  )
  select
    (select count(*) from own),
    (select count(*) from public.combo_orthodoxy c join own o on o.id = c.mix_id),
    (select count(*) from others where experience_type in ('smoked','made')),
    (select count(distinct user_id) from others where experience_type in ('smoked','made')),
    (select count(*) from others where experience_type = 'made'),
    (select count(distinct user_id) from others where experience_type = 'made');
$$;

revoke execute on function public.author_endo_stats(uuid) from public;
grant  execute on function public.author_endo_stats(uuid) to anon, authenticated;
