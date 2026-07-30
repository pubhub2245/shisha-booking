-- ============================================================
-- プロ（シーシャ店スタッフ）認証マーク
--   is_pro は運営のみ付与できる（ユーザー自身は変更不可）
-- ============================================================
alter table public.profiles add column if not exists is_pro boolean not null default false;

-- is_pro をユーザー自身が更新できないよう、列レベルで UPDATE 権限を制限する。
-- テーブル全体の UPDATE を剥奪し、自己編集を許可する列だけ付与し直す。
revoke update on public.profiles from authenticated;
grant update (username, display_name, bio, avatar_url, is_shop, shop_name, shop_area, shop_url)
  on public.profiles to authenticated;

-- 付与の例（運営がSQLで実行）:
--   update public.profiles set is_pro = true where username = '<ユーザー名>';
