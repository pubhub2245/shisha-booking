-- STEP 3 追加確認への対応：
-- 王道 mix そのものが削除され、combo_orthodoxy が FK の ON DELETE CASCADE で消える場合、
-- 「いつ王道が終了したか」が履歴に残っていなかった。
--
-- 対策：combo_orthodoxy の AFTER DELETE トリガを「revoked 履歴の唯一の発生源」にする。
--   - mix 削除による cascade delete   → 履歴が残る（今回の穴）
--   - revoke_orthodoxy()（運営の解除） → 履歴が残る
--   - combo_key 変更による自動解除     → 履歴が残る
-- これにより DELETE 経路がどれでも必ず1件記録され、二重記録も起きない。
-- （certify_orthodoxy の差し替えは UPDATE なのでこのトリガは発火せず、
--   'replaced' + 'certified' の明示記録がそのまま有効。）

create or replace function public.orthodoxy_log_delete()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.combo_orthodoxy_history(combo_key, mix_id, action, changed_by)
    values (old.combo_key, old.mix_id, 'revoked', auth.uid());
  return old;
end;
$$;

drop trigger if exists combo_orthodoxy_delete_trg on public.combo_orthodoxy;
create trigger combo_orthodoxy_delete_trg
  after delete on public.combo_orthodoxy
  for each row execute function public.orthodoxy_log_delete();

-- 解除RPC：履歴の明示 insert を削除（トリガ側に一本化して二重記録を防ぐ）
create or replace function public.revoke_orthodoxy(p_combo_key text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception '権限がありません';
  end if;
  -- 履歴は AFTER DELETE トリガが記録する
  delete from public.combo_orthodoxy where combo_key = p_combo_key;
end;
$$;

-- combo_key 変更時の自動解除：同上、明示 insert を削除
create or replace function public.orthodoxy_on_combo_key_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- 履歴は AFTER DELETE トリガが記録する
  delete from public.combo_orthodoxy
   where mix_id = new.id and combo_key = old.combo_key;
  return new;
end;
$$;
