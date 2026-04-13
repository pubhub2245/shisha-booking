-- 未ログインユーザー（anon）が予約フォームからデータを登録できるようにする
-- Server Action はサーバーサイドで実行されるが、anon key を使用するため RLS が適用される

-- customers テーブル: anon ユーザーの INSERT を許可
create policy "Allow anon insert customers"
  on public.customers
  for insert
  to anon
  with check (true);

-- reservations テーブル: anon ユーザーの INSERT を許可
create policy "Allow anon insert reservations"
  on public.reservations
  for insert
  to anon
  with check (true);

-- customers テーブル: anon ユーザーの phone による SELECT を許可（重複チェック用）
create policy "Allow anon select customers by phone"
  on public.customers
  for select
  to anon
  using (true);

-- customers テーブル: anon ユーザーの UPDATE を許可（既存顧客の名前更新用）
create policy "Allow anon update customers"
  on public.customers
  for update
  to anon
  using (true)
  with check (true);
