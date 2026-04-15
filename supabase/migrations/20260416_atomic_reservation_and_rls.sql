-- =====================================================================
-- 予約処理のアトミック化 + RLS 厳格化
-- 目的:
--   1. 予約の二重取り防止 (advisory lock + 同一トランザクション内で確定)
--   2. フレーバー在庫の競合防止 (条件付き UPDATE)
--   3. anon に対する customers テーブルの全件 SELECT/UPDATE を閉じる
--   4. キャンセル可否をサーバー (DB) 時刻で判定
-- 設計:
--   create_reservation_atomic() 内で
--     - 営業エリアの advisory lock を取得
--     - 空き状況を再計算 (±20 分バッファ + 6h クールダウン)
--     - customers を upsert
--     - reservations を INSERT
--     - フレーバー在庫を在庫があるときだけ -1
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RLS の厳格化: anon の customers SELECT / UPDATE を撤去
-- ---------------------------------------------------------------------
drop policy if exists "Allow anon select customers by phone" on public.customers;
drop policy if exists "Allow anon update customers" on public.customers;
-- INSERT は匿名予約に必要なので残す。ただし RPC 経由に寄せたいので、後段で security definer の関数を用意する

-- ---------------------------------------------------------------------
-- 2. アトミック予約 RPC
-- ---------------------------------------------------------------------
create or replace function public.create_reservation_atomic(
  p_name text,
  p_name_kana text,
  p_phone text,
  p_area text,
  p_reservation_date date,
  p_reservation_time time,
  p_location text,
  p_quantity int,
  p_flavor_id uuid,
  p_instagram text,
  p_payment_method text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_units int;
  v_count_at_time int;
  v_total_count int;
  v_requested_mins int;
  v_lock_key bigint;
  v_customer_id uuid;
  v_reservation_id uuid;
  v_blocked boolean := false;
  v_rec record;
  v_stock_updated int;
begin
  -- 入力の基本チェック
  if coalesce(trim(p_name), '') = '' or
     coalesce(trim(p_phone), '') = '' or
     coalesce(trim(p_area), '') = '' or
     coalesce(trim(p_location), '') = '' or
     p_reservation_date is null or
     p_reservation_time is null then
    return jsonb_build_object('ok', false, 'error', '必須項目が不足しています');
  end if;

  -- 過去日時の予約は拒否 (JST 基準)
  if (p_reservation_date::timestamp + p_reservation_time)
     at time zone 'Asia/Tokyo'
     < now() then
    return jsonb_build_object('ok', false, 'error', '過去の日時は予約できません');
  end if;

  -- area + date 単位で advisory lock を取得 (同時予約を直列化)
  v_lock_key := abs(hashtextextended(p_area || ':' || p_reservation_date::text, 0));
  perform pg_advisory_xact_lock(v_lock_key);

  -- max_units を取得
  select max_units into v_max_units
    from public.areas
   where label = p_area
     and is_active = true;

  if v_max_units is null or v_max_units = 0 then
    return jsonb_build_object('ok', false, 'error', 'このエリアは現在準備中です');
  end if;

  v_requested_mins := extract(hour from p_reservation_time) * 60
                    + extract(minute from p_reservation_time);

  -- 同一エリア + 日付の生きている予約をロック付きで取得
  -- (FOR UPDATE で同時 INSERT による空き状況の食い違いを防ぐ)
  v_total_count := 0;
  for v_rec in
    select reservation_time
      from public.reservations
     where area = p_area
       and reservation_date = p_reservation_date
       and status not in ('cancelled', 'closed')
     for update
  loop
    v_total_count := v_total_count + 1;
  end loop;

  -- 同時刻枠が満杯か (±20 分バッファ込み)
  select count(*) into v_count_at_time
    from public.reservations
   where area = p_area
     and reservation_date = p_reservation_date
     and status not in ('cancelled', 'closed')
     and abs(
       (extract(hour from reservation_time) * 60
      + extract(minute from reservation_time))
        - v_requested_mins
     ) <= 20
   group by reservation_time
   having count(*) >= v_max_units
   limit 1;

  if v_count_at_time is not null then
    return jsonb_build_object('ok', false, 'error', 'この時間帯は予約が埋まっています');
  end if;

  -- 1 日上限 + 6h クールダウン
  if v_total_count >= v_max_units then
    declare
      v_trigger_mins int;
    begin
      select extract(hour from reservation_time) * 60
           + extract(minute from reservation_time)
        into v_trigger_mins
        from public.reservations
       where area = p_area
         and reservation_date = p_reservation_date
         and status not in ('cancelled', 'closed')
       order by reservation_time
       offset (v_max_units - 1)
       limit 1;

      if v_trigger_mins is not null
         and v_requested_mins >= v_trigger_mins
         and v_requested_mins <= v_trigger_mins + 360 then
        return jsonb_build_object('ok', false, 'error',
          '1日の予約上限に達したため、しばらく予約できません');
      end if;
    end;
  end if;

  -- 顧客 upsert (phone をキーに)
  select id into v_customer_id
    from public.customers
   where phone = p_phone
   for update;

  if v_customer_id is null then
    insert into public.customers (name, name_kana, phone, area, contact_sns)
    values (
      trim(p_name),
      nullif(trim(coalesce(p_name_kana, '')), ''),
      p_phone,
      p_area,
      nullif(trim(coalesce(p_instagram, '')), '')
    )
    returning id into v_customer_id;
  else
    update public.customers
       set name = trim(p_name),
           name_kana = coalesce(nullif(trim(coalesce(p_name_kana, '')), ''), name_kana),
           contact_sns = coalesce(nullif(trim(coalesce(p_instagram, '')), ''), contact_sns)
     where id = v_customer_id;
  end if;

  -- フレーバー在庫を条件付きで -1 (在庫があるときだけ)
  if p_flavor_id is not null then
    update public.flavors
       set stock = stock - 1
     where id = p_flavor_id
       and stock > 0;
    get diagnostics v_stock_updated = row_count;
    if v_stock_updated = 0 then
      -- 在庫切れ。フレーバー指定なしで続行する選択肢もあるが、ここではエラーで返す
      return jsonb_build_object('ok', false, 'error',
        '選択されたフレーバーは在庫切れです');
    end if;
  end if;

  -- 予約を作成
  insert into public.reservations (
    customer_id, reservation_date, reservation_time, area, location,
    quantity, flavor_id, payment_method, admin_note, status
  ) values (
    v_customer_id, p_reservation_date, p_reservation_time, p_area,
    trim(p_location), greatest(coalesce(p_quantity, 1), 1),
    p_flavor_id,
    nullif(trim(coalesce(p_payment_method, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''),
    'received'
  )
  returning id into v_reservation_id;

  return jsonb_build_object('ok', true, 'reservation_id', v_reservation_id);
end;
$$;

grant execute on function public.create_reservation_atomic(
  text, text, text, text, date, time, text, int, uuid, text, text, text
) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. キャンセル RPC (サーバー時刻で 2h 前判定)
-- ---------------------------------------------------------------------
create or replace function public.cancel_reservation_by_phone(
  p_reservation_id uuid,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_date date;
  v_time time;
  v_customer_phone text;
  v_reservation_at timestamptz;
begin
  if p_reservation_id is null or coalesce(trim(p_phone), '') = '' then
    return jsonb_build_object('ok', false, 'error', '情報が不足しています');
  end if;

  select r.status, r.reservation_date, r.reservation_time, c.phone
    into v_status, v_date, v_time, v_customer_phone
    from public.reservations r
    join public.customers c on c.id = r.customer_id
   where r.id = p_reservation_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', '予約が見つかりません');
  end if;

  if v_customer_phone <> p_phone then
    return jsonb_build_object('ok', false, 'error', '電話番号が一致しません');
  end if;

  if v_status = 'cancelled' then
    return jsonb_build_object('ok', false, 'error', '既にキャンセル済みです');
  end if;

  v_reservation_at := (v_date::timestamp + v_time) at time zone 'Asia/Tokyo';
  if v_reservation_at - now() < interval '2 hours' then
    return jsonb_build_object('ok', false, 'error', 'キャンセル期限を過ぎています');
  end if;

  update public.reservations
     set status = 'cancelled'
   where id = p_reservation_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.cancel_reservation_by_phone(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. 電話番号で自分の予約を検索する RPC (RLS 緩和の代替)
-- ---------------------------------------------------------------------
create or replace function public.find_reservations_by_phone(p_phone text)
returns table (
  id uuid,
  reservation_date date,
  reservation_time time,
  area text,
  location text,
  quantity int,
  status text,
  customer_name text
)
language sql
security definer
set search_path = public
as $$
  select r.id, r.reservation_date, r.reservation_time, r.area, r.location,
         r.quantity, r.status, c.name as customer_name
    from public.reservations r
    join public.customers c on c.id = r.customer_id
   where c.phone = p_phone
     and r.status not in ('cancelled', 'closed', 'completed')
   order by r.reservation_date asc, r.reservation_time asc;
$$;

grant execute on function public.find_reservations_by_phone(text) to anon, authenticated;
