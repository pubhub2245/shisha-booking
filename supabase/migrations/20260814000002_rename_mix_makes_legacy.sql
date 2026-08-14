-- STEP 2（移行の最終段階）：mix_makes を一時退避。
-- 「作った」記録は mix_experiences(experience_type='made') に一本化済み。
-- 全コード参照・refresh_national_reps を移行し、0行・依存0を確認したうえで rename。
-- ※ 即 DROP はしない。動作確認期間ののち、別マイグレーションで DROP する。
alter table if exists public.mix_makes rename to mix_makes_legacy;
