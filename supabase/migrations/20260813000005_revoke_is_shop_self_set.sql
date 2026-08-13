-- is_shop はユーザーが自分で立てるべきでない（店舗所属の承認トリガー sync_is_shop
-- ＝SECURITY DEFINER/postgres が同期する）。authenticated の列UPDATE権限を剥奪。
revoke update (is_shop) on public.profiles from authenticated;
