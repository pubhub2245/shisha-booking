-- P0: refresh_national_reps() を一般クライアント（anon / authenticated）から実行不可にする。
--
-- SECURITY DEFINER にもかかわらず anon へ EXECUTE が残っており、未認証でも
-- 代表スナップショットの再計算と notifications への INSERT を誘発できる状態だった。
--
-- 事前確認（2026-08-15）:
--   * アプリからの呼び出し箇所は 0 件（lib/queries.ts のラッパも本コミットで削除）
--   * /national の表示は combo_orthodoxy（唯一の source of truth）のみを参照
--   * pg_cron 未導入・スケジュール実行なし
--   * national_reps テーブルを読むアプリコードは無し
-- 以後は運営（postgres / service_role）専用の内部運用 RPC とする。

revoke all on function public.refresh_national_reps() from public;
revoke all on function public.refresh_national_reps() from anon;
revoke all on function public.refresh_national_reps() from authenticated;

comment on function public.refresh_national_reps() is
  '内部運用専用。postgres / service_role のみ実行可（2026-08-15 に anon / authenticated から revoke）。';

-- national_reps に残っていた4件は、experience 0 の時点で旧 like_count（シード由来）だけから
-- 生成された参考データ。author_id は全て null で、アプリからは読まれていない。
-- 「架空の王道」に見えないよう行のみ削除する（テーブルと構造は残す）。
delete from public.national_reps;
