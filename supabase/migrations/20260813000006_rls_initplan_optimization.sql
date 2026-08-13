-- 性能：RLSポリシー内の auth.uid()/jwt()/role() を (select ...) で1回評価にする
-- （Supabase アドバイザー auth_rls_initplan 対応・67ポリシー）。行ごとの再評価を避けるだけで判定結果は不変。
do $$
declare r record;
begin
  for r in
    select policyname, schemaname, tablename, qual, with_check
    from pg_policies
    where schemaname = 'public' and (
      (qual is not null and qual ~ 'auth\.(uid|jwt|role)\(\)' and qual !~ '\(\s*select auth\.') or
      (with_check is not null and with_check ~ 'auth\.(uid|jwt|role)\(\)' and with_check !~ '\(\s*select auth\.')
    )
  loop
    execute format('ALTER POLICY %I ON %I.%I%s%s;',
      r.policyname, r.schemaname, r.tablename,
      case when r.qual is not null
        then ' USING (' || replace(replace(replace(r.qual,'auth.uid()','(select auth.uid())'),'auth.jwt()','(select auth.jwt())'),'auth.role()','(select auth.role())') || ')'
        else '' end,
      case when r.with_check is not null
        then ' WITH CHECK (' || replace(replace(replace(r.with_check,'auth.uid()','(select auth.uid())'),'auth.jwt()','(select auth.jwt())'),'auth.role()','(select auth.role())') || ')'
        else '' end
    );
  end loop;
end $$;
