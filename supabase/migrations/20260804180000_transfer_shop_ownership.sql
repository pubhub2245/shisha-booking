-- ============================================================
-- オーナー権限の譲渡：各店舗の「承認できる人（オーナー）」は1人。
-- 現オーナーは、同じ店舗の承認済みメンバーへオーナー権限を引き継げる。
-- （導入時：最初に対応した従業員が仮オーナー → 後から本来のオーナーへ委譲）
-- shops.owner_id と shop_members.role を SECURITY DEFINER で原子的に更新する。
-- ============================================================
create or replace function public.transfer_shop_ownership(p_shop_id uuid, p_new_owner uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur uuid;
begin
  select owner_id into cur from public.shops where id = p_shop_id;
  if cur is null then
    raise exception 'shop not found';
  end if;
  -- 実行者は現オーナーのみ
  if cur <> auth.uid() then
    raise exception 'only the current owner can transfer ownership';
  end if;
  if p_new_owner = cur then
    return; -- 変化なし
  end if;
  -- 譲渡先は同じ店舗の承認済みメンバーであること
  if not exists (
    select 1 from public.shop_members m
    where m.shop_id = p_shop_id and m.user_id = p_new_owner and m.status = 'approved'
  ) then
    raise exception 'target must be an approved member of the shop';
  end if;

  update public.shops set owner_id = p_new_owner where id = p_shop_id;
  update public.shop_members set role = 'owner' where shop_id = p_shop_id and user_id = p_new_owner;
  update public.shop_members set role = 'staff' where shop_id = p_shop_id and user_id = cur;
end;
$$;

revoke all on function public.transfer_shop_ownership(uuid, uuid) from public;
grant execute on function public.transfer_shop_ownership(uuid, uuid) to authenticated;
