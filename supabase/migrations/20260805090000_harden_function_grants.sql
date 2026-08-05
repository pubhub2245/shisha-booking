-- ============================================================
-- セキュリティ強化（Supabase advisor 対応）：
-- SECURITY DEFINER 関数の不要な EXECUTE 権限を剥奪する。
--  - sync_is_shop: トリガー専用。RPC で呼べる必要はない → public から剥奪
--  - review_pro_application: 管理者専用（内部で is_admin 検証）→ anon 不要
-- 注意: is_admin / increment_view は RLS・閲覧計測で必要なため触らない。
-- ============================================================
revoke execute on function public.sync_is_shop() from public;

revoke execute on function public.review_pro_application(uuid, boolean) from public;
grant execute on function public.review_pro_application(uuid, boolean) to authenticated;
