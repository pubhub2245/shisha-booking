-- 直接比較：この一台を「前に作った別の作り方」と比べてどうだったか。
--
-- 設計の背景（docs/第一テーマ_設計再構成.md §10）：
-- 2台の味覚5軸を引き算する方式は、数日〜数週間空くと成立しない（前の絶対値を覚えていない）。
-- 人間が答えられるのは相対評価なので「前より良い/同じ/前より良くない」を直接聞く。
-- experience 1件に付随する属性なので、別テーブルにせず mix_experiences に持たせる。
-- 追加のみ・すべて nullable なので、既存データと既存の RLS（本人のみ）に影響しない。

alter table public.mix_experiences
  add column if not exists compared_to_mix_id uuid references public.mixes(id) on delete set null,
  add column if not exists comparison text,
  add column if not exists comparison_axes text[] not null default '{}';

comment on column public.mix_experiences.compared_to_mix_id is
  '比較対象の作り方。自分が過去に作った別の mix を指す';
comment on column public.mix_experiences.comparison is
  'better=この一台の方が good / same=同じくらい / worse=比較対象の方が good';
comment on column public.mix_experiences.comparison_axes is
  'どこが違ったか（甘い/軽い/濃い/涼しい/重い）。任意・複数可';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mix_experiences_comparison_check'
  ) then
    alter table public.mix_experiences
      add constraint mix_experiences_comparison_check
      check (comparison is null or comparison in ('better', 'same', 'worse'));
  end if;

  -- 同じ作り方どうしは比較にならない
  if not exists (
    select 1 from pg_constraint where conname = 'mix_experiences_comparison_not_self'
  ) then
    alter table public.mix_experiences
      add constraint mix_experiences_comparison_not_self
      check (compared_to_mix_id is null or compared_to_mix_id <> mix_id);
  end if;

  -- 比較結果だけあって相手がいない、という状態を作らない
  if not exists (
    select 1 from pg_constraint where conname = 'mix_experiences_comparison_pair'
  ) then
    alter table public.mix_experiences
      add constraint mix_experiences_comparison_pair
      check (comparison is null or compared_to_mix_id is not null);
  end if;
end $$;

create index if not exists mix_experiences_comparison_idx
  on public.mix_experiences (compared_to_mix_id, mix_id)
  where compared_to_mix_id is not null;


-- ---------------------------------------------------------------------------
-- テーマ内の作り方ごとの実績。
-- mix_experiences の SELECT は本人のみなので、他人を含む集計は SECURITY DEFINER で行う。
-- maker_count は「作者以外が作った人数」＝ Reproduction（作者の自作は含めない）。
-- ---------------------------------------------------------------------------
create or replace function public.theme_method_stats(p_combo_key text)
returns table (
  mix_id uuid,
  maker_count int,
  made_total int,
  repeat_makers int
)
language sql
security definer
set search_path = public
stable
as $$
  with theme as (
    select m.id, m.author_id from public.mixes m where m.combo_key = p_combo_key
  ),
  made as (
    select e.mix_id, e.user_id
    from public.mix_experiences e
    join theme t on t.id = e.mix_id
    where e.experience_type = 'made'
      and (t.author_id is null or e.user_id <> t.author_id)
  )
  select
    t.id as mix_id,
    (select count(distinct d.user_id) from made d where d.mix_id = t.id)::int as maker_count,
    (select count(*) from made d where d.mix_id = t.id)::int as made_total,
    (
      select count(*)::int from (
        select d.user_id from made d where d.mix_id = t.id
        group by d.user_id having count(*) >= 2
      ) r
    ) as repeat_makers
  from theme t;
$$;

revoke all on function public.theme_method_stats(text) from public;
grant execute on function public.theme_method_stats(text) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- テーマの段階指標（docs/第一テーマ_設計再構成.md §12）。
--   L1 参加者   … テーマの作り方を1台以上作った人（自分が投稿した作り方は除く＝他人の作り方を試した人）
--   L2 継続者   … テーマ内で2台以上作った人（同じ作り方の反復を含む）
--   L3 複数METHOD … 異なる2つ以上の作り方を作った人
--   L3 比較者   … 直接比較を1件以上記録した人  ★決定的な指標は 比較者 / L1
--   L4 比較件数 … 直接比較の総数
-- ---------------------------------------------------------------------------
create or replace function public.theme_progress(p_combo_key text)
returns table (
  method_count int,
  participants int,
  repeaters int,
  multi_method int,
  comparers int,
  comparisons int,
  made_total int
)
language sql
security definer
set search_path = public
stable
as $$
  with theme as (
    select m.id, m.author_id from public.mixes m where m.combo_key = p_combo_key
  ),
  made as (
    select e.user_id, e.mix_id, e.comparison
    from public.mix_experiences e
    join theme t on t.id = e.mix_id
    where e.experience_type = 'made'
      and (t.author_id is null or e.user_id <> t.author_id)
  )
  select
    (select count(*) from theme)::int,
    (select count(distinct user_id) from made)::int,
    (select count(*)::int from (select user_id from made group by user_id having count(*) >= 2) x),
    (select count(*)::int from (select user_id from made group by user_id having count(distinct mix_id) >= 2) x),
    (select count(distinct user_id) from made where comparison is not null)::int,
    (select count(*) from made where comparison is not null)::int,
    (select count(*) from made)::int;
$$;

revoke all on function public.theme_progress(text) from public;
grant execute on function public.theme_progress(text) to anon, authenticated;
