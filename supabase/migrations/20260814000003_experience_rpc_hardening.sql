-- A-3 / A-4：集計RPCのハードニングと命名の明確化
--  A-3: 「体験回数(COUNT(*))」と「体験者数(COUNT DISTINCT user_id)」を名前で分離する。
--       旧: どちらも cnt で意味が混在していた（made=人数 / smoked=回数）。
--  A-4: PUBLIC の既定 EXECUTE を剥がし、anon/authenticated だけに明示付与する。

-- 1つのミックスの「作ってみた」：made_count=延べ回数 / maker_count=人数
create or replace function public.mix_made_status(p_mix uuid)
returns table (made_count bigint, maker_count bigint, made boolean)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.mix_experiences
       where mix_id = p_mix and experience_type = 'made'),
    (select count(distinct user_id) from public.mix_experiences
       where mix_id = p_mix and experience_type = 'made'),
    (select exists(select 1 from public.mix_experiences
       where mix_id = p_mix and experience_type = 'made' and user_id = auth.uid()));
$$;

-- 1つのミックスの「吸った」：smoke_count=延べ回数 / smoker_count=人数
create or replace function public.mix_smoke_status(p_mix uuid)
returns table (smoke_count bigint, smoker_count bigint, mine boolean, my_id uuid, my_verdict text)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.mix_experiences
       where mix_id = p_mix and experience_type = 'smoked'),
    (select count(distinct user_id) from public.mix_experiences
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

-- 全ミックスの「作ってみた」人数（王道自動選出・エリア集計が使うのは人数）
create or replace function public.mix_made_counts()
returns table (mix_id uuid, maker_count bigint)
language sql stable security definer set search_path = public as $$
  select mix_id, count(distinct user_id)
  from public.mix_experiences
  where experience_type = 'made'
  group by mix_id;
$$;

-- A-4：PUBLIC の既定 EXECUTE を剥がし、必要ロールにだけ付与
revoke execute on function public.mix_made_status(uuid)   from public;
revoke execute on function public.mix_smoke_status(uuid)  from public;
revoke execute on function public.mix_made_counts()       from public;
revoke execute on function public.author_made_total(uuid) from public;

grant execute on function public.mix_made_status(uuid)   to anon, authenticated;
grant execute on function public.mix_smoke_status(uuid)  to anon, authenticated;
grant execute on function public.mix_made_counts()       to anon, authenticated;
grant execute on function public.author_made_total(uuid) to anon, authenticated;
