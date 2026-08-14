-- STEP 6: 味覚5軸（実際に吸った人による味の強度）
--   投稿者の taste_tags（味の系統）とは別概念。
--   体験(mix_experiences)に紐づけ、1体験1評価。過去評価は上書きしない＝履歴として蓄積。
--   mix_id / user_id は冗長保持せず experience から JOIN する。

create table if not exists public.taste_evaluations (
  experience_id uuid primary key references public.mix_experiences(id) on delete cascade,
  sweetness smallint check (sweetness between 1 and 5),  -- 甘さ
  coolness  smallint check (coolness  between 1 and 5),  -- 爽快感
  sourness  smallint check (sourness  between 1 and 5),  -- 酸味
  richness  smallint check (richness  between 1 and 5),  -- 濃厚さ
  heaviness smallint check (heaviness between 1 and 5),  -- 重さ
  created_at timestamptz not null default now(),
  -- 全項目 NULL の空レコードを作らせない（1軸だけの評価は許可する）
  constraint taste_evaluations_not_empty
    check (num_nonnulls(sweetness, coolness, sourness, richness, heaviness) > 0)
);

alter table public.taste_evaluations enable row level security;

-- 個票は本人のみ。experience_id が本人所有であることを DB 側でも保証する
-- （他人の experience にぶら下げて評価を作れないようにする）。
create policy taste_evaluations_select_own on public.taste_evaluations
  for select to authenticated
  using (exists (select 1 from public.mix_experiences e
                  where e.id = experience_id and e.user_id = (select auth.uid())));

create policy taste_evaluations_insert_own on public.taste_evaluations
  for insert to authenticated
  with check (exists (select 1 from public.mix_experiences e
                       where e.id = experience_id and e.user_id = (select auth.uid())));

create policy taste_evaluations_update_own on public.taste_evaluations
  for update to authenticated
  using (exists (select 1 from public.mix_experiences e
                  where e.id = experience_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.mix_experiences e
                       where e.id = experience_id and e.user_id = (select auth.uid())));

create policy taste_evaluations_delete_own on public.taste_evaluations
  for delete to authenticated
  using (exists (select 1 from public.mix_experiences e
                  where e.id = experience_id and e.user_id = (select auth.uid())));

-- ---------------------------------------------------------------
-- 公開集計：mix(method)単位の平均と母数。個票・user_id は返さない。
-- NULL は AVG から自動的に除外されるため、軸ごとに母数(count)が異なる。
-- ---------------------------------------------------------------
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
  select
    round(avg(t.sweetness), 1), count(t.sweetness),
    round(avg(t.coolness),  1), count(t.coolness),
    round(avg(t.sourness),  1), count(t.sourness),
    round(avg(t.richness),  1), count(t.richness),
    round(avg(t.heaviness), 1), count(t.heaviness),
    count(distinct e.user_id)
  from public.taste_evaluations t
  join public.mix_experiences e on e.id = t.experience_id
  where e.mix_id = p_mix;
$$;

-- STEP 2 で定めたハードニング基準：PUBLIC の既定 EXECUTE を剥がして必要ロールにだけ付与
revoke execute on function public.mix_taste_summary(uuid) from public;
grant  execute on function public.mix_taste_summary(uuid) to anon, authenticated;
