-- profiles.role を auth.users.raw_app_meta_data に同期するトリガー
-- これにより JWT の app_metadata.role から role を読めるようになり、
-- proxy で profiles テーブルをクエリする必要がなくなる（RLS 再帰問題を回避）

-- 1. 同期用関数
create or replace function public.sync_role_to_app_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
  set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', new.role)
  where id = new.id;
  return new;
end;
$$;

-- 2. INSERT / UPDATE トリガー
drop trigger if exists on_profile_role_sync on public.profiles;
create trigger on_profile_role_sync
  after insert or update of role on public.profiles
  for each row
  execute function public.sync_role_to_app_metadata();

-- 3. 既存データの一括同期（既にprofilesにデータがある場合）
update auth.users
set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', p.role)
from public.profiles p
where auth.users.id = p.id;
