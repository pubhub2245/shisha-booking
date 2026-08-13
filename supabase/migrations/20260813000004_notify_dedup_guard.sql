-- 連続する同一通知（同 recipient/actor/type/mix/comment）を1分間デデュープして通知スパムを抑制。
create or replace function public.notify(p_recipient uuid, p_type text, p_mix uuid default null::uuid, p_comment uuid default null::uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if p_recipient is null or p_recipient = auth.uid() then
    return;
  end if;
  if exists (
    select 1 from public.notifications
    where user_id = p_recipient
      and actor_id is not distinct from auth.uid()
      and type = p_type
      and coalesce(mix_id::text,'') = coalesce(p_mix::text,'')
      and coalesce(comment_id::text,'') = coalesce(p_comment::text,'')
      and created_at > now() - interval '1 minute'
  ) then
    return;
  end if;
  insert into public.notifications(user_id, actor_id, type, mix_id, comment_id)
  values (p_recipient, auth.uid(), p_type, p_mix, p_comment);
end;
$function$;
