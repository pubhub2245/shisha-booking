-- ============================================================
-- パフォーマンス：外部キーにカバリングインデックスを追加（advisor 0001 対応）。
-- 参照テーブルの削除・結合・by-user/by-flavor 検索を高速化する。
-- ============================================================
create index if not exists bookmarks_user_idx        on public.bookmarks(user_id);
create index if not exists comments_user_idx         on public.comments(user_id);
create index if not exists flavors_added_by_idx      on public.flavors(added_by);
create index if not exists likes_user_idx            on public.likes(user_id);
create index if not exists link_clicks_mix_idx       on public.link_clicks(mix_id);
create index if not exists link_clicks_shop_idx      on public.link_clicks(shop_id);
create index if not exists link_clicks_user_idx      on public.link_clicks(user_id);
create index if not exists mix_flavors_flavor_idx    on public.mix_flavors(flavor_id);
create index if not exists mix_unlocks_user_idx      on public.mix_unlocks(user_id);
create index if not exists mixes_author_idx          on public.mixes(author_id);
create index if not exists pro_applications_shop_idx on public.pro_applications(shop_id);
create index if not exists shelf_flavor_idx          on public.shelf(flavor_id);
