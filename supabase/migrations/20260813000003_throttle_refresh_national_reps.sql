-- 性能：/national 等から毎リクエスト呼ばれる王道スナップショット再計算を5分に1回へ間引く。
create table if not exists public.national_reps_meta (
  singleton boolean primary key default true,
  last_refresh timestamptz not null default 'epoch'
);
insert into public.national_reps_meta(singleton) values (true) on conflict do nothing;
revoke all on public.national_reps_meta from anon, authenticated;

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
  select last_refresh into last_run from public.national_reps_meta where singleton limit 1;
  if last_run is not null and last_run > now() - interval '5 minutes' then
    return;
  end if;
  update public.national_reps_meta set last_refresh = now() where singleton;

  foreach c in array cats loop
    select m.id, m.author_id into best_id, best_author
    from public.mixes m
    left join (select mix_id, count(*) cnt from public.mix_makes group by mix_id) mk on mk.mix_id = m.id
    where m.hidden = false and m.taste_tags @> array[c] and (m.like_count + 2 * coalesce(mk.cnt, 0)) >= 1
    order by (m.author_id is not null) desc, (m.like_count + 2 * coalesce(mk.cnt, 0)) desc, m.created_at asc
    limit 1;
    if best_id is null then continue; end if;
    select mix_id into prev from public.national_reps where category = c;
    if prev is distinct from best_id then
      insert into public.national_reps(category, mix_id, updated_at) values (c, best_id, now())
        on conflict (category) do update set mix_id = excluded.mix_id, updated_at = now();
      if best_author is not null then
        insert into public.notifications(user_id, actor_id, type, mix_id)
        values (best_author, null, 'national_selected', best_id);
      end if;
    end if;
  end loop;
end;
$function$;
