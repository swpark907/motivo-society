-- 플랫폼 13단계: 활동별 장부(H07)
-- · 들어온 돈(참가비 · 환불 · 수수료)은 주문에서 계산한다. 여기 복사하지 않는다.
-- · 호스트가 직접 적는 것은 지출과 기타 수입뿐이다(activity_ledger_entries). 영수증 사진을 붙일 수 있다.
-- · 장부는 기본으로 관리하는 사람만 본다. 호스트가 공개하면 확정된 참가자가 합계와 항목을 본다(영수증은 빼고).
-- · 적고 · 고치고 · 지운 것은 전과 후를 감사 기록에 남기고, 관리하는 사람은 그 기록을 장부에서 본다.

-- 영수증도 보관함 파일이다. 표지 사진과 섞이지 않게 쓰임새를 나눈다.
alter table public.media_assets add column purpose text not null default 'image'
  check (purpose in ('image', 'receipt'));

drop function public.media_register(text, text);
create or replace function public.media_register(p_path text, p_alt text, p_purpose text default 'image')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_kind text := split_part(p_path, '/', 1);
  v_owner text := split_part(p_path, '/', 2);
  v_alt text := nullif(trim(coalesce(p_alt, '')), '');
  v_id uuid;
begin
  if v_uid is null then raise exception 'auth_required'; end if;
  if p_path !~ '^(u|c)/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$' then raise exception 'invalid_path'; end if;
  if p_purpose not in ('image', 'receipt') then raise exception 'invalid_kind'; end if;
  -- 영수증은 올린 사람의 보관함에만 둔다.
  if p_purpose = 'receipt' and v_kind <> 'u' then raise exception 'invalid_path'; end if;
  if not public._media_folder_ok(v_kind, v_owner) then raise exception 'forbidden'; end if;
  if char_length(coalesce(v_alt, '')) > 120 then raise exception 'too_long'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'media' and name = p_path) then
    raise exception 'file_missing';
  end if;
  if (select count(*) from public.media_assets
      where (v_kind = 'u' and owner_user_id = v_uid) or (v_kind = 'c' and club_id = v_owner::uuid)) >= 200 then
    raise exception 'saved_limit';
  end if;

  insert into public.media_assets (owner_user_id, club_id, path, alt, uploaded_by, purpose)
  values (case when v_kind = 'u' then v_uid end, case when v_kind = 'c' then v_owner::uuid end,
    p_path, v_alt, v_uid, p_purpose)
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.media_register(text, text, text) from public, anon;
grant execute on function public.media_register(text, text, text) to authenticated;

-- 영수증은 표지로 쓰지 않는다.
create or replace function public.activity_set_cover(p_activity uuid, p_media uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_act public.activities;
  v_asset public.media_assets;
begin
  if not public.can_manage_activity(p_activity) then raise exception 'forbidden'; end if;
  select * into v_act from public.activities where id = p_activity;
  if v_act.series_id is not null then raise exception 'session_cover'; end if;
  if p_media is null then
    update public.activities set cover_path = null where id = p_activity;
  else
    select * into v_asset from public.media_assets where id = p_media;
    if not found then raise exception 'not_found'; end if;
    if v_asset.purpose <> 'image' then raise exception 'media_not_usable'; end if;
    if not (v_asset.owner_user_id = auth.uid()
            or (v_asset.club_id is not null and v_asset.club_id = v_act.club_id
                and public.club_has_permission(v_asset.club_id, 'activity.create'))) then
      raise exception 'media_not_usable';
    end if;
    update public.activities set cover_path = 'media:' || v_asset.path where id = p_activity;
  end if;
  perform public._write_audit('activity.cover_set', p_activity, null,
    jsonb_build_object('media', p_media));
end;
$$;

alter table public.activities add column ledger_public boolean not null default false;

create table public.activity_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  kind text not null check (kind in ('expense', 'income')),
  amount integer not null check (amount between 1 and 100000000),
  memo text not null check (char_length(memo) between 1 and 60),
  occurred_on date not null,
  receipt_media_id uuid references public.media_assets (id) on delete set null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index activity_ledger_entries_activity_idx
  on public.activity_ledger_entries (activity_id, occurred_on, created_at);
create trigger activity_ledger_entries_touch before update on public.activity_ledger_entries
  for each row execute function public.touch_updated_at();

-- 직접 읽기는 관리하는 사람만. 참가자는 activity_ledger()로 영수증 없이 본다.
alter table public.activity_ledger_entries enable row level security;
create policy activity_ledger_entries_read on public.activity_ledger_entries for select
  using (public.can_manage_activity(activity_id));
revoke insert, update, delete on public.activity_ledger_entries from anon, authenticated;

-- 영수증으로 붙일 수 있는 이미지: 내가 올린 영수증(이미 붙어 있던 것은 그대로 둔다).
create or replace function public._ledger_receipt_ok(p_media uuid, p_keep uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_media is null or p_media = p_keep or exists (
    select 1 from public.media_assets
    where id = p_media and purpose = 'receipt' and owner_user_id = auth.uid()
  );
$$;

-- 적거나(p_id 없음) 고친다. 장부는 시즌 회차가 아니라 시즌에 둔다.
create or replace function public.ledger_entry_save(
  p_activity uuid, p_kind text, p_amount integer, p_memo text, p_occurred_on date,
  p_receipt uuid default null, p_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_memo text := trim(coalesce(p_memo, ''));
  v_before public.activity_ledger_entries;
  v_id uuid;
begin
  if not public.can_manage_activity(p_activity) then raise exception 'forbidden'; end if;
  if exists (select 1 from public.activities where id = p_activity and series_id is not null) then
    raise exception 'session_ledger';
  end if;
  if p_kind not in ('expense', 'income') then raise exception 'invalid_kind'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 100000000 then raise exception 'invalid_amount'; end if;
  if v_memo = '' then raise exception 'name_required'; end if;
  if char_length(v_memo) > 60 then raise exception 'too_long'; end if;
  if p_occurred_on is null then raise exception 'date_required'; end if;
  if (select count(*) from public.activity_ledger_entries where activity_id = p_activity) >= 200
     and p_id is null then
    raise exception 'saved_limit';
  end if;

  if p_id is null then
    if not public._ledger_receipt_ok(p_receipt, null) then raise exception 'media_not_usable'; end if;
    insert into public.activity_ledger_entries
      (activity_id, kind, amount, memo, occurred_on, receipt_media_id, created_by)
    values (p_activity, p_kind, p_amount, v_memo, p_occurred_on, p_receipt, auth.uid())
    returning id into v_id;
    perform public._write_audit('ledger.created', p_activity, null, jsonb_build_object(
      'after', jsonb_build_object('kind', p_kind, 'amount', p_amount, 'memo', v_memo,
        'occurred_on', p_occurred_on)));
  else
    select * into v_before from public.activity_ledger_entries
      where id = p_id and activity_id = p_activity for update;
    if not found then raise exception 'not_found'; end if;
    if not public._ledger_receipt_ok(p_receipt, v_before.receipt_media_id) then
      raise exception 'media_not_usable';
    end if;
    update public.activity_ledger_entries
      -- 새 영수증이 없으면 붙어 있던 것을 그대로 둔다.
      set kind = p_kind, amount = p_amount, memo = v_memo, occurred_on = p_occurred_on,
          receipt_media_id = coalesce(p_receipt, receipt_media_id)
      where id = p_id
      returning id into v_id;
    perform public._write_audit('ledger.updated', p_activity, null, jsonb_build_object(
      'before', jsonb_build_object('kind', v_before.kind, 'amount', v_before.amount,
        'memo', v_before.memo, 'occurred_on', v_before.occurred_on),
      'after', jsonb_build_object('kind', p_kind, 'amount', p_amount, 'memo', v_memo,
        'occurred_on', p_occurred_on)));
  end if;
  return v_id;
end;
$$;

create or replace function public.ledger_entry_delete(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.activity_ledger_entries;
begin
  select * into v_row from public.activity_ledger_entries where id = p_id;
  if not found or not public.can_manage_activity(v_row.activity_id) then raise exception 'not_found'; end if;
  delete from public.activity_ledger_entries where id = p_id;
  perform public._write_audit('ledger.deleted', v_row.activity_id, null, jsonb_build_object(
    'before', jsonb_build_object('kind', v_row.kind, 'amount', v_row.amount, 'memo', v_row.memo,
      'occurred_on', v_row.occurred_on)));
end;
$$;

create or replace function public.activity_set_ledger_public(p_activity uuid, p_public boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_activity(p_activity) then raise exception 'forbidden'; end if;
  if exists (select 1 from public.activities where id = p_activity and series_id is not null) then
    raise exception 'session_ledger';
  end if;
  update public.activities set ledger_public = coalesce(p_public, false) where id = p_activity;
  perform public._write_audit('ledger.visibility', p_activity, null,
    jsonb_build_object('public', coalesce(p_public, false)));
end;
$$;

-- 장부 한 장. 관리하는 사람: 전부(영수증 · 정산 상태 · 고친 기록). 공개된 장부의 확정 참가자: 합계와 항목만.
-- 그 밖에는 access = 'none'.
create or replace function public.activity_ledger(p_activity uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_act public.activities;
  v_manager boolean;
  v_received integer;
  v_refunded integer;
  v_fee integer;
  v_income integer;
  v_expense integer;
  v_out jsonb;
begin
  select * into v_act from public.activities where id = p_activity;
  if not found or auth.uid() is null or v_act.series_id is not null then
    return jsonb_build_object('access', 'none');
  end if;
  v_manager := public.can_manage_activity(p_activity);
  if not v_manager and not (v_act.ledger_public and public.is_confirmed_participant(p_activity, auth.uid())) then
    return jsonb_build_object('access', 'none');
  end if;

  select coalesce(sum(o.amount), 0),
         coalesce(sum(round(o.amount * coalesce(o.fee_rate, 0))), 0)
    into v_received, v_fee
    from public.orders o
    where o.activity_id = p_activity and o.status in ('paid', 'refunded', 'partially_refunded');
  select coalesce(sum(r.amount), 0),
         v_fee - coalesce(sum(round(r.amount * coalesce(o.fee_rate, 0))), 0)
    into v_refunded, v_fee
    from public.refunds r join public.orders o on o.id = r.order_id
    where o.activity_id = p_activity and r.status in ('approved', 'paid');
  select coalesce(sum(amount) filter (where kind = 'income'), 0),
         coalesce(sum(amount) filter (where kind = 'expense'), 0)
    into v_income, v_expense
    from public.activity_ledger_entries where activity_id = p_activity;

  v_out := jsonb_build_object(
    'access', case when v_manager then 'manager' else 'participant' end,
    'public', v_act.ledger_public,
    'received', v_received,
    'refunded', v_refunded,
    'fee', v_fee,
    'other_income', v_income,
    'expense', v_expense,
    'net', v_received - v_refunded - v_fee + v_income - v_expense,
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'kind', e.kind, 'amount', e.amount, 'memo', e.memo, 'occurred_on', e.occurred_on,
        'receipt_path', case when v_manager then m.path end,
        'created_by', case when v_manager then pr.nickname::text end
      ) order by e.occurred_on, e.created_at)
      from public.activity_ledger_entries e
      left join public.media_assets m on m.id = e.receipt_media_id
      left join public.profiles pr on pr.id = e.created_by
      where e.activity_id = p_activity
    ), '[]'::jsonb)
  );

  if v_manager then
    -- 정산: 받을 돈(참가비 − 환불 − 수수료) 중 정산이 지급됐거나 예정인 몫과 아직 정산에 안 들어간 몫.
    v_out := v_out || jsonb_build_object(
      'payout', v_received - v_refunded - v_fee,
      'settled', coalesce((
        select sum(i.amount - i.fee_amount) from public.settlement_items i
        join public.settlements s on s.id = i.settlement_id
        left join public.orders o on o.id = i.order_id
        left join public.refunds r on r.id = i.refund_id
        left join public.orders ro on ro.id = r.order_id
        where s.status = 'paid' and coalesce(o.activity_id, ro.activity_id) = p_activity
      ), 0),
      'scheduled', coalesce((
        select sum(i.amount - i.fee_amount) from public.settlement_items i
        join public.settlements s on s.id = i.settlement_id
        left join public.orders o on o.id = i.order_id
        left join public.refunds r on r.id = i.refund_id
        left join public.orders ro on ro.id = r.order_id
        where s.status = 'scheduled' and coalesce(o.activity_id, ro.activity_id) = p_activity
      ), 0),
      'history', coalesce((
        select jsonb_agg(h order by (h ->> 'at') desc) from (
          select jsonb_build_object('action', l.action, 'at', l.created_at,
            'actor', pr.nickname::text, 'detail', l.detail) as h
          from public.audit_logs l
          left join public.profiles pr on pr.id = l.actor_id
          where l.activity_id = p_activity and l.action like 'ledger.%'
          order by l.created_at desc
          limit 30
        ) x
      ), '[]'::jsonb)
    );
  end if;
  return v_out;
end;
$$;

revoke execute on function public._ledger_receipt_ok(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.ledger_entry_save(uuid, text, integer, text, date, uuid, uuid) from public, anon;
revoke execute on function public.ledger_entry_delete(uuid) from public, anon;
revoke execute on function public.activity_set_ledger_public(uuid, boolean) from public, anon;
revoke execute on function public.activity_ledger(uuid) from public, anon;
grant execute on function public.ledger_entry_save(uuid, text, integer, text, date, uuid, uuid) to authenticated;
grant execute on function public.ledger_entry_delete(uuid) to authenticated;
grant execute on function public.activity_set_ledger_public(uuid, boolean) to authenticated;
grant execute on function public.activity_ledger(uuid) to authenticated;
