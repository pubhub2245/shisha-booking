-- STEP 2: mix_experiences（実体験ログ）＋集計RPC
-- 「吸った(smoked)/作ってみた(made)」を1テーブルで履歴として蓄積する。
-- 検証状態(verification)は experience_type とは別概念として分離。
-- 同一ユーザーが同一 mix を何度でも記録できる（unique(user_id, mix_id) は付けない）。

create table if not exists public.mix_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mix_id  uuid not null references public.mixes(id)    on delete cascade,
  -- 体験の種類：吸った / 作ってみた（再現）
  experience_type text not null default 'smoked'
    check (experience_type in ('smoked','made')),
  -- 検証状態（experience_type とは分離）：自己申告 / 店舗QR / 運営
  verification_type text not null default 'self'
    check (verification_type in ('self','shop_qr','admin')),
  verified_at timestamptz,                                        -- nullable
  shop_id uuid references public.shops(id) on delete set null,    -- nullable（将来の店舗連携）
  -- 主観的な満足度（味覚5軸とは別概念・任意）
  verdict text check (verdict in ('again','good','ok','not_for_me')),
  occurred_at timestamptz not null default now(),                 -- 実際に吸った日時
  created_at  timestamptz not null default now(),                 -- 記録した日時
  note text
);

create index if not exists mix_experiences_user_occurred_idx on public.mix_experiences (user_id, occurred_at desc);
create index if not exists mix_experiences_mix_idx           on public.mix_experiences (mix_id);
create index if not exists mix_experiences_mix_type_idx      on public.mix_experiences (mix_id, experience_type);

-- RLS：本人のみ read/write。公開集計は下の SECURITY DEFINER RPC 経由（base は非公開）。
alter table public.mix_experiences enable row level security;

create policy mix_experiences_select_own on public.mix_experiences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy mix_experiences_insert_own on public.mix_experiences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy mix_experiences_update_own on public.mix_experiences
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy mix_experiences_delete_own on public.mix_experiences
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---- 集計RPC（SECURITY DEFINER：RLSを跨いで count のみ返す。個票・verdict/note は返さない）----

-- 1つのミックスの made 状態（総メイカー数＝ユニークユーザー / 自分が作ったか）
create or replace function public.mix_made_status(p_mix uuid)
returns table (cnt bigint, made boolean)
language sql stable security definer set search_path = public as $$
  select
    (select count(distinct user_id) from public.mix_experiences
       where mix_id = p_mix and experience_type = 'made'),
    (select exists(select 1 from public.mix_experiences
       where mix_id = p_mix and experience_type = 'made' and user_id = auth.uid()));
$$;

-- 1つのミックスの smoked 状態（総記録数 / 自分の最新記録の id・verdict）
create or replace function public.mix_smoke_status(p_mix uuid)
returns table (cnt bigint, mine boolean, my_id uuid, my_verdict text)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.mix_experiences
       where mix_id = p_mix and experience_type = 'smoked'),
    (select exists(select 1 from public.mix_experiences
       where mix_id = p_mix and experience_type = 'smoked' and user_id = auth.uid())),
    (select id from public.mix_experiences
       where mix_id = p_mix and experience_type = 'smoked' and user_id = auth.uid()
       order by occurred_at desc limit 1),
    (select verdict from public.mix_experiences
       where mix_id = p_mix and experience_type = 'smoked' and user_id = auth.uid()
       order by occurred_at desc limit 1);
$$;

-- 全ミックスの made 数（王道自動選出・エリアランキングの集計用）
create or replace function public.mix_made_counts()
returns table (mix_id uuid, cnt bigint)
language sql stable security definer set search_path = public as $$
  select mix_id, count(distinct user_id)
  from public.mix_experiences
  where experience_type = 'made'
  group by mix_id;
$$;

-- ある作り手の作品が「作ってみた」された総回数（プロフィール実績用）
create or replace function public.author_made_total(p_author uuid)
returns bigint
language sql stable security definer set search_path = public as $$
  select count(*)
  from public.mix_experiences e
  join public.mixes m on m.id = e.mix_id
  where m.author_id = p_author and e.experience_type = 'made';
$$;

grant execute on function public.mix_made_status(uuid)  to anon, authenticated;
grant execute on function public.mix_smoke_status(uuid)  to anon, authenticated;
grant execute on function public.mix_made_counts()       to anon, authenticated;
grant execute on function public.author_made_total(uuid) to anon, authenticated;

-- ---- 既存 refresh_national_reps を mix_experiences(made) 参照へ付け替え ----
-- （mix_makes は 0 行。挙動は「作った数×2」の重み付けのまま維持）
create or replace function public.refresh_national_reps()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  cats text[] := array['フルーツ','シトラス','ミント','ベリー','デザート','トロピカル','スパイス','ドリンク','お茶','和'];
  c text;
  best_id uuid;
  best_author uuid;
  prev uuid;
  last_run timestamptz;
begin
  -- Throttle: skip the full recompute if it ran within the last 5 minutes.
  select last_refresh into last_run from public.national_reps_meta where singleton limit 1;
  if last_run is not null and last_run > now() - interval '5 minutes' then
    return;
  end if;
  update public.national_reps_meta set last_refresh = now() where singleton;

  foreach c in array cats loop
    select m.id, m.author_id
      into best_id, best_author
    from public.mixes m
    left join (
      select mix_id, count(distinct user_id) cnt
      from public.mix_experiences
      where experience_type = 'made'
      group by mix_id
    ) mk on mk.mix_id = m.id
    where m.hidden = false
      and m.taste_tags @> array[c]
      and (m.like_count + 2 * coalesce(mk.cnt, 0)) >= 1
    order by (m.author_id is not null) desc, (m.like_count + 2 * coalesce(mk.cnt, 0)) desc, m.created_at asc
    limit 1;

    if best_id is null then
      continue;
    end if;

    select mix_id into prev from public.national_reps where category = c;
    if prev is distinct from best_id then
      insert into public.national_reps(category, mix_id, updated_at)
        values (c, best_id, now())
        on conflict (category) do update set mix_id = excluded.mix_id, updated_at = now();
      if best_author is not null then
        insert into public.notifications(user_id, actor_id, type, mix_id)
        values (best_author, null, 'national_selected', best_id);
      end if;
    end if;
  end loop;
end;
$function$;
