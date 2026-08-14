-- STEP 3: 王道（公式認定）と推薦を別概念として実装する。
--   combo_key            = フレーバー組み合わせ（親・既存 mixes.combo_key を使用。combos テーブルは作らない）
--   mixes の1行           = 具体的な作り方(method)
--   combo_orthodoxy      = その組み合わせで公式認定された王道（1 combo_key につき最大1件）
--   method_recommendations = 運営・認証プロによる「この作り方を推薦する」記録（複数可）
-- 支持データ（吸われた回数等）は保存しない。mix_experiences から集計する。

-- ---------------------------------------------------------------
-- 推薦できる人の判定：既存の is_admin() と profiles.is_pro を再利用する
-- （認証プロ判定を新規に重複実装しない。店舗アカウント解禁は Phase2 でこの関数だけ直す）
-- ---------------------------------------------------------------
create or replace function public.can_recommend()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or coalesce((select is_pro from public.profiles where id = auth.uid()), false);
$$;
revoke execute on function public.can_recommend() from public;
grant execute on function public.can_recommend() to authenticated;

-- ---------------------------------------------------------------
-- 1) method_recommendations（推薦）
-- ---------------------------------------------------------------
create table if not exists public.method_recommendations (
  id uuid primary key default gen_random_uuid(),
  mix_id uuid not null references public.mixes(id) on delete cascade,
  proposed_by uuid not null references public.profiles(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (mix_id, proposed_by)   -- 同一人物による同一 method の重複推薦を禁止
);
create index if not exists method_recommendations_mix_idx on public.method_recommendations (mix_id);

alter table public.method_recommendations enable row level security;

-- 誰でも閲覧可（「推薦」バッジの表示に使う）
create policy method_recommendations_select on public.method_recommendations
  for select using (true);
-- 追加できるのは運営・認証プロのみ、かつ自分名義でのみ
create policy method_recommendations_insert on public.method_recommendations
  for insert to authenticated
  with check (proposed_by = (select auth.uid()) and public.can_recommend());
-- 取り消しは本人か運営
create policy method_recommendations_delete on public.method_recommendations
  for delete to authenticated
  using (proposed_by = (select auth.uid()) or public.is_admin());

-- ---------------------------------------------------------------
-- 2) combo_orthodoxy（公式王道・現在の状態のみ）
--    変動値（smoke_count / again_rate / score 等）は持たせない＝認定事実のみ
-- ---------------------------------------------------------------
create table if not exists public.combo_orthodoxy (
  combo_key text primary key,
  mix_id uuid not null references public.mixes(id) on delete cascade,
  certified_by uuid not null references public.profiles(id),
  certified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists combo_orthodoxy_mix_idx on public.combo_orthodoxy (mix_id);

alter table public.combo_orthodoxy enable row level security;
-- 閲覧は公開。書き込みポリシーは作らない＝一般クライアントから直接 INSERT/UPDATE/DELETE 不可。
-- 変更は下の SECURITY DEFINER RPC（運営のみ）を通す。
create policy combo_orthodoxy_select on public.combo_orthodoxy
  for select using (true);

-- ★ combo_key 整合性のDB側担保：
--   指定された combo_key と、その mix が実際に属する combo_key が一致することを必須にする。
--   CHECK 制約ではサブクエリが書けないためトリガで強制する（アプリ側チェックだけにしない）。
create or replace function public.combo_orthodoxy_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  actual text;
begin
  select combo_key into actual from public.mixes where id = new.mix_id;
  if actual is null then
    raise exception 'mix % が存在しません', new.mix_id;
  end if;
  if actual is distinct from new.combo_key then
    raise exception '組み合わせが一致しません（mix の combo_key=% / 指定=%）', actual, new.combo_key;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists combo_orthodoxy_guard_trg on public.combo_orthodoxy;
create trigger combo_orthodoxy_guard_trg
  before insert or update on public.combo_orthodoxy
  for each row execute function public.combo_orthodoxy_guard();

-- ---------------------------------------------------------------
-- 3) combo_orthodoxy_history（王道は育つ＝過去の王道を失わない）
--    監査ログなので mixes への FK は張らない（mix 削除後も履歴を残すため）
-- ---------------------------------------------------------------
create table if not exists public.combo_orthodoxy_history (
  id uuid primary key default gen_random_uuid(),
  combo_key text not null,
  mix_id uuid not null,
  action text not null check (action in ('certified','replaced','revoked')),
  changed_by uuid,
  event_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists combo_orthodoxy_history_key_idx on public.combo_orthodoxy_history (combo_key, event_at desc);

alter table public.combo_orthodoxy_history enable row level security;
-- V1では一般UIに履歴を出さない。閲覧は運営のみ。書き込みはRPC(SECURITY DEFINER)経由のみ。
create policy combo_orthodoxy_history_select_admin on public.combo_orthodoxy_history
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------
-- 4) 王道の認定 / 変更 / 解除（運営のみ・RPC経由）
-- ---------------------------------------------------------------

-- 認定（未認定なら certified、既にあれば別 method へ replaced）
-- p_combo_key を渡した場合は mix の実際の combo_key と一致するか検証する。
create or replace function public.certify_orthodoxy(p_mix uuid, p_combo_key text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  target_key text;
  prev_mix uuid;
begin
  if not public.is_admin() then
    raise exception '権限がありません';
  end if;

  select combo_key into target_key from public.mixes where id = p_mix;
  if target_key is null then
    raise exception 'mix % が存在しません', p_mix;
  end if;
  -- 呼び出し側が combo_key を明示した場合は不一致を拒否する
  if p_combo_key is not null and p_combo_key is distinct from target_key then
    raise exception '組み合わせが一致しません（mix の combo_key=% / 指定=%）', target_key, p_combo_key;
  end if;

  select mix_id into prev_mix from public.combo_orthodoxy where combo_key = target_key;

  if prev_mix is null then
    insert into public.combo_orthodoxy(combo_key, mix_id, certified_by, certified_at)
      values (target_key, p_mix, auth.uid(), now());
    insert into public.combo_orthodoxy_history(combo_key, mix_id, action, changed_by)
      values (target_key, p_mix, 'certified', auth.uid());
  elsif prev_mix is distinct from p_mix then
    update public.combo_orthodoxy
       set mix_id = p_mix, certified_by = auth.uid(), certified_at = now()
     where combo_key = target_key;
    -- 旧王道が降りたことと、新王道が就いたことの双方を残す
    insert into public.combo_orthodoxy_history(combo_key, mix_id, action, changed_by)
      values (target_key, prev_mix, 'replaced', auth.uid());
    insert into public.combo_orthodoxy_history(combo_key, mix_id, action, changed_by)
      values (target_key, p_mix, 'certified', auth.uid());
  end if;
end;
$$;

-- 解除
create or replace function public.revoke_orthodoxy(p_combo_key text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  prev_mix uuid;
begin
  if not public.is_admin() then
    raise exception '権限がありません';
  end if;
  select mix_id into prev_mix from public.combo_orthodoxy where combo_key = p_combo_key;
  if prev_mix is null then
    return;
  end if;
  delete from public.combo_orthodoxy where combo_key = p_combo_key;
  insert into public.combo_orthodoxy_history(combo_key, mix_id, action, changed_by)
    values (p_combo_key, prev_mix, 'revoked', auth.uid());
end;
$$;

revoke execute on function public.certify_orthodoxy(uuid, text) from public;
revoke execute on function public.revoke_orthodoxy(text)        from public;
grant execute on function public.certify_orthodoxy(uuid, text) to authenticated;
grant execute on function public.revoke_orthodoxy(text)        to authenticated;

-- ---------------------------------------------------------------
-- 5) B-8 ケース6：王道 mix のフレーバー構成が変わり combo_key が変化した場合
--    → 「元の組み合わせの王道」ではなくなるので自動的に解除し、履歴に残す。
--    （編集をブロックする案・複雑な同期を作る案より単純で、DB側で完結し安全側に倒れる）
-- ---------------------------------------------------------------
create or replace function public.orthodoxy_on_combo_key_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.combo_orthodoxy_history(combo_key, mix_id, action, changed_by)
    select o.combo_key, o.mix_id, 'revoked', auth.uid()
      from public.combo_orthodoxy o
     where o.mix_id = new.id and o.combo_key = old.combo_key;

  delete from public.combo_orthodoxy
   where mix_id = new.id and combo_key = old.combo_key;

  return new;
end;
$$;

drop trigger if exists mixes_combo_key_change_trg on public.mixes;
create trigger mixes_combo_key_change_trg
  after update of combo_key on public.mixes
  for each row
  when (old.combo_key is distinct from new.combo_key)
  execute function public.orthodoxy_on_combo_key_change();
