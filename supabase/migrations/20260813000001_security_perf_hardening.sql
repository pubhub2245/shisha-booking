-- 運用堅牢化：SECURITY DEFINER 関数の search_path 固定、anon EXECUTE 剥奪、FKカバリングインデックス。
-- （Supabase アドバイザー 0011 / 0028 / 0001 対応）

-- 1) role-mutable search_path の関数を固定
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('geo_distance_m','onsite_rate_delay_hours')
  loop
    execute format('alter function %s set search_path = public', r.sig);
  end loop;
end $$;

-- 2) アプリが authenticated からのみ呼ぶ SECURITY DEFINER RPC の anon EXECUTE を剥奪
revoke execute on function public.notify(uuid, text, uuid, uuid) from anon;
revoke execute on function public.onsite_checkin(uuid, double precision, double precision) from anon;
revoke execute on function public.onsite_rate(uuid, integer, text) from anon;
revoke execute on function public.record_onsite_rating(uuid, double precision, double precision) from anon;
revoke execute on function public.save_arbitration(bigint, text) from anon;

-- 3) 未インデックス外部キーのカバリングインデックス
create index if not exists idx_comment_likes_user_id      on public.comment_likes(user_id);
create index if not exists idx_flavor_log_helpful_user_id on public.flavor_log_helpful(user_id);
create index if not exists idx_flavor_ratings_user_id     on public.flavor_ratings(user_id);
create index if not exists idx_idea_comments_user_id      on public.idea_comments(user_id);
create index if not exists idx_idea_votes_user_id         on public.idea_votes(user_id);
create index if not exists idx_ideas_user_id              on public.ideas(user_id);
create index if not exists idx_mix_name_votes_user_id     on public.mix_name_votes(user_id);
create index if not exists idx_mix_names_user_id          on public.mix_names(user_id);
create index if not exists idx_mix_onsite_ratings_user_id on public.mix_onsite_ratings(user_id);
create index if not exists idx_national_reps_mix_id       on public.national_reps(mix_id);
create index if not exists idx_notifications_actor_id     on public.notifications(actor_id);
create index if not exists idx_notifications_mix_id       on public.notifications(mix_id);
create index if not exists idx_profiles_pinned_mix_id     on public.profiles(pinned_mix_id);
create index if not exists idx_reports_mix_id             on public.reports(mix_id);
create index if not exists idx_reports_reporter_id        on public.reports(reporter_id);
