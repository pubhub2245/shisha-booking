-- ============================================================
-- フレーバー図鑑への追加はプロ認証者（＋管理者）のみに制限し、追加者を記録する。
-- ============================================================

-- 追加者（誰が図鑑に登録したか）
alter table public.flavors
  add column if not exists added_by uuid references public.profiles(id) on delete set null;

-- 追加は「本人＝プロ or 管理者」のみ（誰でも→プロのみへ）
drop policy if exists "flavors_insert_authed" on public.flavors;
create policy "flavors_insert_pro" on public.flavors for insert with check (
  added_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.is_pro or p.is_admin)
  )
);
