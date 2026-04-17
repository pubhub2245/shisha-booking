-- Webhook API は anon key で呼ばれるため、INSERT と UPDATE を許可する。
-- セキュリティは LINE の署名検証（HMAC-SHA256）がアプリ層で担保する。
-- SELECT は admin のみ（既存ポリシー）のまま。

create policy "webhook_insert" on line_webhook_users
  for insert
  with check (true);

create policy "webhook_update" on line_webhook_users
  for update
  using (true)
  with check (true);
