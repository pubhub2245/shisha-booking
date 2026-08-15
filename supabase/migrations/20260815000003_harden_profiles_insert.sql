-- P0寄り: profiles の権限列を一般クライアントが INSERT で任意指定できないようにする。
--
-- 監査時点では anon / authenticated に profiles の「全列」INSERT 権限があり、
-- is_admin / is_pro / is_founder / is_shop を自分で立てた行を挿入し得る状態だった
-- （実際には handle_new_user() が先に行を作るため PK 衝突で失敗するが、
--   トリガと RLS だけに依存せず DB 権限側でも塞ぐ＝多層防御）。
--
-- UPDATE 側は 20260813000002 / 20260813000005 で既に列を絞ってあるので、それと揃える。

revoke insert on public.profiles from anon;
revoke insert on public.profiles from authenticated;

-- 本人が自分の行に入れてよい列だけを許可する。
-- created_at は default、is_admin / is_pro / is_founder / is_shop は運営専用（付与しない）。
grant insert (
  id,
  username,
  display_name,
  bio,
  avatar_url,
  shop_name,
  shop_area,
  shop_url,
  pinned_mix_id,
  ui_mode
) on public.profiles to authenticated;

-- anon は RLS(profiles_insert_self: auth.uid() = id) を満たせないため INSERT を一切許可しない。
-- 初期プロフィールの作成は handle_new_user()（SECURITY DEFINER）が行うので signup は壊れない。

comment on table public.profiles is
  '公開プロフィール。権限列(is_admin/is_pro/is_founder/is_shop)は運営のみが変更でき、一般ロールには INSERT/UPDATE 権限を与えない。';
