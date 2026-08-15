-- P0: メールアドレス由来の公開表示名を廃止する。
--
-- 旧実装は split_part(email, '@', 1) を display_name / username に転用しており、
-- 本人の明示的な選択なしに email のローカル部が公開プロフィールへ露出していた。
-- 新実装は email を一切参照せず、匿名の初期値を自動生成する。
--   display_name : 煙道ユーザー_<suffix>
--   username     : endoh_<suffix>
-- suffix は UUID を露出しない乱数（読み間違えやすい文字を除いた31文字×6桁 ≒ 8.9億通り）。
-- signup フォームの入力項目は増やさない。あとから本人がプロフィール編集で変更できる。

create or replace function public.endo_random_suffix(p_len int default 6)
returns text
language plpgsql
volatile
set search_path to 'public'
as $$
declare
  -- 0/1/i/l/o など読み間違えやすい文字は除外（口頭でも伝えられるハンドルにする）
  alphabet constant text := '23456789abcdefghjkmnpqrstuvwxyz';
  s text := '';
  i int;
begin
  for i in 1..greatest(p_len, 4) loop
    s := s || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return s;
end;
$$;

comment on function public.endo_random_suffix(int) is
  '匿名ハンドル用のランダム接尾辞。email や UUID を一切含まない。';

-- 一般クライアントから直接呼ぶ必要はない
revoke all on function public.endo_random_suffix(int) from public;
revoke all on function public.endo_random_suffix(int) from anon;
revoke all on function public.endo_random_suffix(int) from authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  suffix text;
  attempt int;
begin
  -- username は UNIQUE。衝突したら別の suffix で数回リトライし、signup 自体は落とさない。
  for attempt in 1..10 loop
    suffix := public.endo_random_suffix(case when attempt <= 7 then 6 else 12 end);
    begin
      insert into public.profiles (id, username, display_name)
      values (new.id, 'endoh_' || suffix, '煙道ユーザー_' || suffix)
      on conflict (id) do nothing;
      return new;
    exception
      when unique_violation then
        null; -- username 衝突 → 次の suffix で再試行
    end;
  end loop;

  -- ここへ到達することは実質ない。最後は username 無しで作り、本人に設定してもらう。
  insert into public.profiles (id, display_name)
  values (new.id, '煙道ユーザー')
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'auth.users への INSERT 時に匿名の初期プロフィールを作る。email 由来の値は使わない（P0: 2026-08-15）。';
