-- ============================================================
-- 関数の EXECUTE 権限剥奪（v1の補正）。
-- Supabase は anon/authenticated へ default privileges で直接 EXECUTE を付与するため、
-- PUBLIC からの revoke だけでは足りない。ロールを明示して剥奪する。
--  - sync_is_shop: トリガー専用 → anon/authenticated 両方から剥奪（トリガー発火には不要）
--  - review_pro_application / transfer_shop_ownership: 内部で権限検証済み。anon は不要 → 剥奪
-- is_admin / increment_view は RLS・閲覧計測で必要なため触らない。
-- ============================================================
revoke execute on function public.sync_is_shop() from anon, authenticated;
revoke execute on function public.review_pro_application(uuid, boolean) from anon;
revoke execute on function public.transfer_shop_ownership(uuid, uuid) from anon;
