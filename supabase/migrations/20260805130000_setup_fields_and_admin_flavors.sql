-- ============================================================
-- セットアップ項目の追加とフレーバー追加権限の変更
--  - mixes.hms_other: HMS「その他」選択時の自由入力名
--  - mixes.charcoal_orientation: フラット炭の縦置き/横置き
--  - フレーバー図鑑への追加は「管理者のみ」に厳格化（プロを外す）
-- ============================================================
alter table public.mixes
  add column if not exists hms_other text,
  add column if not exists charcoal_orientation text;

-- フレーバー追加は管理者のみ（従来のプロ/管理者 → 管理者のみ）
drop policy if exists "flavors_insert_pro" on public.flavors;
drop policy if exists "flavors_insert_admin" on public.flavors;
create policy "flavors_insert_admin" on public.flavors for insert with check (
  added_by = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);
