-- 플랫폼 시험장 2단계: 돈의 흐름 (계좌이체)
-- 신청 → 주문(입금 대기, 자리 확보) → 운영진 입금 확인 → 이용권 발급 + 참가 확정
-- → 환불 요청 → 규정으로 금액 계산 → 승인(이용권 회수 · 참가 취소 · 대기자 승격) → 정산
-- 설계 정본: docs/architecture/platform-db-design.md 7절. 수수료율·환불 규정의 실제 값은 대표 승인 전이며
-- 여기에는 구조만 둔다(값은 seed.sql의 시험값).

-- ─────────────────────────────────────────────────────────── 설정과 규정
create table public.platform_settings (
  id boolean primary key default true check (id),
  fee_rate numeric(5, 4) not null check (fee_rate >= 0 and fee_rate < 1),
  order_due_hours integer not null default 24 check (order_due_hours > 0),
  bank_account_note text not null,
  updated_at timestamptz not null default now()
);

create table public.refund_policies (
  id uuid primary key default gen_random_uuid(),
  target_kind text not null check (target_kind in ('gathering', 'series', 'challenge', 'class')),
  version integer not null,
  -- [{"days_before": 7, "rate": 100}, ...] 시작까지 남은 일수가 days_before 이상인 첫 규칙을 쓴다.
  rules jsonb not null,
  effective_from timestamptz not null default now(),
  approved_note text,
  unique (target_kind, version)
);

-- ─────────────────────────────────────────────────────────── 주문 · 환불 · 이용권 · 정산
create sequence public.order_no_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique
    default 'MS-' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD') || '-'
      || lpad(nextval('public.order_no_seq')::text, 4, '0'),
  user_id uuid not null references public.profiles (id),
  activity_id uuid not null references public.activities (id),
  amount integer not null check (amount > 0),
  item_snapshot jsonb not null,
  payee_user_id uuid references public.profiles (id),
  fee_rate numeric(5, 4),
  refund_policy_id uuid references public.refund_policies (id),
  method text not null default 'bank_transfer' check (method in ('bank_transfer', 'pg')),
  depositor_name text not null,
  due_at timestamptz not null,
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'cancelled', 'expired', 'refunded', 'partially_refunded')
  ),
  confirmed_by uuid references public.profiles (id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (payee_user_id is null or fee_rate is not null)
);
create index orders_status_idx on public.orders (status, due_at);
create index orders_payee_idx on public.orders (payee_user_id);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  requested_by uuid not null references public.profiles (id),
  requested_at timestamptz not null default now(),
  reason text,
  rate integer not null check (rate between 0 and 100),
  amount integer not null check (amount >= 0),
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected', 'paid')),
  processed_by uuid references public.profiles (id),
  processed_at timestamptz,
  paid_at timestamptz,
  note text
);
-- 한 주문에 진행 중인 환불은 하나만.
create unique index refunds_open_per_order on public.refunds (order_id)
  where status in ('requested', 'approved', 'paid');

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_id uuid not null references public.activities (id),
  source text not null check (source in ('order', 'free', 'invite', 'grant', 'completion', 'legacy')),
  order_id uuid references public.orders (id),
  granted_by uuid references public.profiles (id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'active' check (status in ('active', 'revoked')),
  revoked_by uuid references public.profiles (id),
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default now(),
  check (source <> 'order' or order_id is not null)
);
create unique index entitlements_active_once on public.entitlements (user_id, activity_id)
  where status = 'active';

alter table public.participations
  add column order_id uuid references public.orders (id),
  add column entitlement_id uuid references public.entitlements (id);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  payee_user_id uuid not null references public.profiles (id),
  period_start date not null,
  period_end date not null,
  gross_amount integer not null,
  refund_amount integer not null,
  fee_amount integer not null,
  payout_amount integer not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'paid')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  processed_by uuid references public.profiles (id),
  check (period_end >= period_start)
);

create table public.settlement_items (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.settlements (id) on delete cascade,
  order_id uuid unique references public.orders (id),
  refund_id uuid unique references public.refunds (id),
  amount integer not null,
  fee_amount integer not null,
  check ((order_id is null) <> (refund_id is null))
);

alter table public.audit_logs add column order_id uuid references public.orders (id) on delete set null;

create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────── 읽기 정책
alter table public.platform_settings enable row level security;
alter table public.refund_policies enable row level security;
alter table public.orders enable row level security;
alter table public.refunds enable row level security;
alter table public.entitlements enable row level security;
alter table public.settlements enable row level security;
alter table public.settlement_items enable row level security;

create policy settings_read on public.platform_settings for select using (true);
create policy refund_policies_read on public.refund_policies for select using (true);
create policy orders_read on public.orders for select
  using (
    user_id = auth.uid()
    or public.has_platform_permission('commerce')
    or public.can_manage_activity(activity_id)
  );
create policy refunds_read on public.refunds for select
  using (exists (select 1 from public.orders o where o.id = order_id));
create policy entitlements_read on public.entitlements for select
  using (user_id = auth.uid() or public.has_platform_permission('commerce'));
create policy settlements_read on public.settlements for select
  using (payee_user_id = auth.uid() or public.has_platform_permission('commerce'));
create policy settlement_items_read on public.settlement_items for select
  using (exists (select 1 from public.settlements s where s.id = settlement_id));

revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- ─────────────────────────────────────────────────────────── 이용권 판정
create or replace function public.has_entitlement(p_user uuid, p_activity uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.entitlements e
    where e.user_id = p_user and e.activity_id = p_activity and e.status = 'active'
      and e.starts_at <= now() and (e.ends_at is null or e.ends_at > now())
  );
$$;

-- ─────────────────────────────────────────────────────────── 내부 도우미
create or replace function public._write_audit(
  p_action text, p_activity uuid, p_target uuid, p_detail jsonb default '{}', p_order uuid default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, action, activity_id, target_user_id, detail, order_id)
  values (auth.uid(), p_action, p_activity, p_target, coalesce(p_detail, '{}'), p_order);
$$;
drop function public._write_audit(text, uuid, uuid, jsonb);

-- 참가 확정 + 이용권 발급을 한 번에. 무료 참가도 이용권을 만든다(명세 9절).
create or replace function public._confirm_participation(p_participation uuid, p_order uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_part public.participations;
  v_ent uuid;
begin
  select * into v_part from public.participations where id = p_participation for update;
  insert into public.entitlements (user_id, activity_id, source, order_id, granted_by)
  values (v_part.user_id, v_part.activity_id,
          case when p_order is null then 'free' else 'order' end, p_order, auth.uid())
  on conflict (user_id, activity_id) where status = 'active' do nothing
  returning id into v_ent;
  if v_ent is null then
    select id into v_ent from public.entitlements
      where user_id = v_part.user_id and activity_id = v_part.activity_id and status = 'active';
  end if;
  update public.participations
    set status = 'confirmed', waitlisted_at = null, entitlement_id = v_ent,
        order_id = coalesce(p_order, order_id), decided_at = coalesce(decided_at, now())
    where id = v_part.id;
end;
$$;

-- 유료 활동의 자리를 잡고 주문을 만든다. 금액·수수료·정산 대상·규정은 여기서만 정한다.
create or replace function public._start_payment(p_participation uuid, p_depositor text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_part public.participations;
  v_act public.activities;
  v_settings public.platform_settings;
  v_policy uuid;
  v_order uuid;
  v_nickname text;
begin
  select * into v_part from public.participations where id = p_participation for update;
  select * into v_act from public.activities where id = v_part.activity_id;
  select * into v_settings from public.platform_settings where id;
  select nickname into v_nickname from public.profiles where id = v_part.user_id;
  select id into v_policy from public.refund_policies
    where target_kind = v_act.kind and effective_from <= now()
    order by version desc limit 1;

  insert into public.orders (user_id, activity_id, amount, item_snapshot, payee_user_id, fee_rate,
    refund_policy_id, depositor_name, due_at)
  values (
    v_part.user_id, v_act.id, v_act.price,
    jsonb_build_object('title', v_act.title, 'price', v_act.price, 'starts_at', v_act.starts_at,
      'ends_at', v_act.ends_at, 'kind', v_act.kind),
    v_act.payee_user_id,
    case when v_act.payee_user_id is not null then v_settings.fee_rate end,
    v_policy, coalesce(nullif(trim(p_depositor), ''), v_nickname),
    now() + make_interval(hours => v_settings.order_due_hours)
  )
  returning id into v_order;

  update public.participations
    set status = 'pending_payment', order_id = v_order, waitlisted_at = null
    where id = v_part.id;
  perform public._write_audit('order.created', v_act.id, v_part.user_id,
    jsonb_build_object('amount', v_act.price), v_order);
  return v_order;
end;
$$;

-- 자리가 나면 대기자를 순서대로 올린다. 무료는 확정, 유료는 입금 대기(새 주문).
create or replace function public._promote_waitlist(p_activity uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_act public.activities;
  v_next public.participations;
begin
  select * into v_act from public.activities where id = p_activity;
  loop
    exit when v_act.capacity is not null and public._seats_taken(p_activity) >= v_act.capacity;
    select * into v_next from public.participations
      where activity_id = p_activity and status = 'waitlisted'
      order by waitlisted_at, created_at
      limit 1
      for update;
    exit when not found;
    if v_act.price > 0 then
      perform public._start_payment(v_next.id);
    else
      perform public._confirm_participation(v_next.id);
    end if;
    perform public._write_audit('participation.promoted', p_activity, v_next.user_id,
      jsonb_build_object('paid', v_act.price > 0));
  end loop;
end;
$$;

-- 이용권을 회수하고 참가를 취소한 뒤 자리를 돌린다.
create or replace function public._release_participation(p_participation uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_part public.participations;
begin
  select * into v_part from public.participations where id = p_participation for update;
  update public.entitlements
    set status = 'revoked', revoked_by = auth.uid(), revoked_at = now(), revoke_reason = p_reason
    where user_id = v_part.user_id and activity_id = v_part.activity_id and status = 'active';
  update public.participations
    set status = 'cancelled', cancelled_by = auth.uid(), cancel_reason = p_reason, waitlisted_at = null
    where id = v_part.id;
  if v_part.status in ('confirmed', 'pending_payment') then
    perform public._promote_waitlist(v_part.activity_id);
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────── 참가 명령 (1단계 함수를 돈의 흐름에 맞게 교체)
drop function public.participation_apply(uuid, jsonb);
create or replace function public.participation_apply(
  p_activity uuid, p_answers jsonb default '{}', p_depositor text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_act public.activities;
  v_existing public.participations;
  v_part uuid;
  v_status text;
begin
  if v_uid is null then raise exception 'auth_required'; end if;
  if not exists (select 1 from public.profiles where id = v_uid and status = 'active') then
    raise exception 'account_inactive';
  end if;

  select * into v_act from public.activities where id = p_activity for update;
  if not found or not public.can_read_activity(p_activity) then raise exception 'not_found'; end if;
  if v_act.series_id is not null then raise exception 'session_has_no_own_apply'; end if;
  if v_act.status <> 'open' then raise exception 'not_open'; end if;
  if v_act.apply_opens_at is not null and now() < v_act.apply_opens_at then raise exception 'not_open_yet'; end if;
  if v_act.apply_closes_at is not null and now() > v_act.apply_closes_at then raise exception 'apply_closed'; end if;
  if v_act.audience = 'club_members' and not public.is_club_member(v_act.club_id) then
    raise exception 'members_only';
  end if;
  if v_act.audience = 'entitlement_holders'
    and not public.has_entitlement(v_uid, v_act.required_activity_id) then
    raise exception 'entitlement_required';
  end if;

  select * into v_existing from public.participations
    where activity_id = p_activity and user_id = v_uid for update;
  if found and v_existing.status <> 'cancelled' then raise exception 'already_applied'; end if;

  if found then
    update public.participations
      set status = 'waitlisted', answers = coalesce(p_answers, '{}'), order_id = null,
          entitlement_id = null, decided_by = null, decided_at = null, cancelled_by = null,
          cancel_reason = null
      where id = v_existing.id
      returning id into v_part;
  else
    insert into public.participations (activity_id, user_id, status, answers)
    values (p_activity, v_uid, 'waitlisted', coalesce(p_answers, '{}'))
    returning id into v_part;
  end if;

  if v_act.join_mode = 'approval' then
    v_status := 'pending_approval';
    update public.participations set status = v_status, waitlisted_at = null where id = v_part;
  elsif v_act.capacity is not null and public._seats_taken(p_activity) >= v_act.capacity then
    v_status := 'waitlisted';
    update public.participations set waitlisted_at = now() where id = v_part;
  elsif v_act.price > 0 then
    perform public._start_payment(v_part, p_depositor);
    v_status := 'pending_payment';
  else
    perform public._confirm_participation(v_part);
    v_status := 'confirmed';
  end if;

  perform public._write_audit('participation.applied', p_activity, v_uid, jsonb_build_object('status', v_status));
  return v_status;
end;
$$;

create or replace function public.participation_cancel(p_activity uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_part public.participations;
begin
  if v_uid is null then raise exception 'auth_required'; end if;
  perform 1 from public.activities where id = p_activity for update;
  select * into v_part from public.participations
    where activity_id = p_activity and user_id = v_uid for update;
  if not found or v_part.status = 'cancelled' then raise exception 'not_applied'; end if;
  if exists (
    select 1 from public.activities where id = p_activity and status in ('ended', 'cancelled')
  ) then
    raise exception 'activity_finished';
  end if;
  -- 결제가 끝난 참가는 취소가 아니라 환불 요청으로만 나간다.
  if exists (select 1 from public.orders where id = v_part.order_id and status = 'paid') then
    raise exception 'refund_required';
  end if;

  update public.orders set status = 'cancelled'
    where id = v_part.order_id and status = 'pending';
  perform public._release_participation(v_part.id, 'self');
  perform public._write_audit('participation.cancelled', p_activity, v_uid,
    jsonb_build_object('from', v_part.status), v_part.order_id);
end;
$$;

create or replace function public.participation_decide(
  p_participation uuid, p_approve boolean, p_reason text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_part public.participations;
  v_act public.activities;
  v_status text;
begin
  select * into v_part from public.participations where id = p_participation;
  if not found then raise exception 'not_found'; end if;
  if not public.can_manage_activity(v_part.activity_id) then raise exception 'forbidden'; end if;

  select * into v_act from public.activities where id = v_part.activity_id for update;
  select * into v_part from public.participations where id = p_participation for update;
  if v_part.status <> 'pending_approval' then raise exception 'not_pending'; end if;

  update public.participations set decided_by = v_uid, decided_at = now() where id = v_part.id;
  if not p_approve then
    v_status := 'cancelled';
    update public.participations
      set status = v_status, cancelled_by = v_uid, cancel_reason = coalesce(nullif(p_reason, ''), 'rejected')
      where id = v_part.id;
  elsif v_act.capacity is not null and public._seats_taken(v_act.id) >= v_act.capacity then
    v_status := 'waitlisted';
    update public.participations set status = v_status, waitlisted_at = now() where id = v_part.id;
  elsif v_act.price > 0 then
    perform public._start_payment(v_part.id);
    v_status := 'pending_payment';
  else
    perform public._confirm_participation(v_part.id);
    v_status := 'confirmed';
  end if;

  perform public._write_audit(
    case when p_approve then 'participation.approved' else 'participation.rejected' end,
    v_act.id, v_part.user_id, jsonb_build_object('status', v_status));
  return v_status;
end;
$$;

-- ─────────────────────────────────────────────────────────── 주문 명령
-- 입금 확인: commerce 권한 운영진만. 나중에 PG 웹훅도 같은 함수를 부른다.
create or replace function public.order_confirm_payment(p_order uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_part uuid;
begin
  if not public.has_platform_permission('commerce') then raise exception 'forbidden'; end if;
  select * into v_order from public.orders where id = p_order for update;
  if not found then raise exception 'not_found'; end if;
  if v_order.status <> 'pending' then raise exception 'order_not_pending'; end if;

  update public.orders set status = 'paid', confirmed_by = auth.uid(), confirmed_at = now()
    where id = p_order;
  select id into v_part from public.participations
    where order_id = p_order and status = 'pending_payment';
  if v_part is null then raise exception 'participation_missing'; end if;
  perform public._confirm_participation(v_part, p_order);
  perform public._write_audit('order.paid', v_order.activity_id, v_order.user_id,
    jsonb_build_object('amount', v_order.amount, 'depositor', v_order.depositor_name), p_order);
end;
$$;

-- 기한이 지난 입금 대기를 만료시키고 자리를 푼다. 운영에서는 주기 작업이 부른다.
create or replace function public.orders_expire_overdue()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_count integer := 0;
  v_part uuid;
begin
  if not public.has_platform_permission('commerce') and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden';
  end if;
  for v_order in
    select * from public.orders where status = 'pending' and due_at < now() order by due_at for update
  loop
    perform 1 from public.activities where id = v_order.activity_id for update;
    update public.orders set status = 'expired' where id = v_order.id;
    select id into v_part from public.participations
      where order_id = v_order.id and status = 'pending_payment';
    if v_part is not null then
      perform public._release_participation(v_part, 'payment_expired');
    end if;
    perform public._write_audit('order.expired', v_order.activity_id, v_order.user_id, '{}', v_order.id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ─────────────────────────────────────────────────────────── 환불
-- 지금 요청하면 얼마를 돌려받는지. 주문에 적용된 규정과 활동 시작까지 남은 일수로 계산한다.
create or replace function public.refund_quote(p_order uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_act public.activities;
  v_rules jsonb;
  v_days integer;
  v_rate integer := 0;
  v_rule jsonb;
begin
  select * into v_order from public.orders where id = p_order;
  if not found or (v_order.user_id <> auth.uid() and not public.has_platform_permission('commerce')) then
    raise exception 'not_found';
  end if;
  select * into v_act from public.activities where id = v_order.activity_id;
  v_days := floor(extract(epoch from (v_act.starts_at - now())) / 86400);

  if v_act.status = 'cancelled' then
    v_rate := 100; -- 주최 측 취소는 전액
  else
    select rules into v_rules from public.refund_policies where id = v_order.refund_policy_id;
    for v_rule in select * from jsonb_array_elements(coalesce(v_rules, '[]'))
      order by (value ->> 'days_before')::integer desc
    loop
      if v_days >= (v_rule ->> 'days_before')::integer then
        v_rate := (v_rule ->> 'rate')::integer;
        exit;
      end if;
    end loop;
  end if;

  return jsonb_build_object(
    'days_before', v_days, 'rate', v_rate,
    'amount', floor(v_order.amount * v_rate / 100.0)::integer, 'order_amount', v_order.amount
  );
end;
$$;

create or replace function public.refund_request(p_order uuid, p_reason text default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_quote jsonb;
begin
  select * into v_order from public.orders where id = p_order for update;
  if not found or v_order.user_id <> auth.uid() then raise exception 'not_found'; end if;
  if v_order.status <> 'paid' then raise exception 'order_not_paid'; end if;
  if exists (select 1 from public.refunds where order_id = p_order and status <> 'rejected') then
    raise exception 'refund_exists';
  end if;
  v_quote := public.refund_quote(p_order);
  insert into public.refunds (order_id, requested_by, reason, rate, amount)
  values (p_order, auth.uid(), p_reason, (v_quote ->> 'rate')::integer, (v_quote ->> 'amount')::integer);
  perform public._write_audit('refund.requested', v_order.activity_id, v_order.user_id, v_quote, p_order);
  return (v_quote ->> 'amount')::integer;
end;
$$;

create or replace function public.refund_decide(p_refund uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_refund public.refunds;
  v_order public.orders;
  v_part uuid;
begin
  if not public.has_platform_permission('commerce') then raise exception 'forbidden'; end if;
  select * into v_refund from public.refunds where id = p_refund for update;
  if not found then raise exception 'not_found'; end if;
  if v_refund.status <> 'requested' then raise exception 'refund_not_requested'; end if;
  select * into v_order from public.orders where id = v_refund.order_id for update;

  update public.refunds
    set status = case when p_approve then 'approved' else 'rejected' end,
        processed_by = auth.uid(), processed_at = now(), note = p_note
    where id = p_refund;

  if p_approve then
    perform 1 from public.activities where id = v_order.activity_id for update;
    update public.orders
      set status = case
        when v_refund.amount = v_order.amount then 'refunded'
        when v_refund.amount > 0 then 'partially_refunded'
        else status end
      where id = v_order.id;
    select id into v_part from public.participations where order_id = v_order.id and status = 'confirmed';
    if v_part is not null then
      perform public._release_participation(v_part, 'refunded');
    end if;
  end if;
  perform public._write_audit(case when p_approve then 'refund.approved' else 'refund.rejected' end,
    v_order.activity_id, v_order.user_id, jsonb_build_object('amount', v_refund.amount), v_order.id);
end;
$$;

create or replace function public.refund_mark_paid(p_refund uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_refund public.refunds;
begin
  if not public.has_platform_permission('commerce') then raise exception 'forbidden'; end if;
  select * into v_refund from public.refunds where id = p_refund for update;
  if not found or v_refund.status <> 'approved' then raise exception 'refund_not_approved'; end if;
  update public.refunds set status = 'paid', paid_at = now() where id = p_refund;
  perform public._write_audit('refund.paid', null, v_refund.requested_by,
    jsonb_build_object('amount', v_refund.amount), v_refund.order_id);
end;
$$;

-- ─────────────────────────────────────────────────────────── 정산
-- 기간 안에 결제 확인된 주문(+)과 처리된 환불(−) 중 아직 정산에 안 들어간 것을 모은다.
-- 지급 뒤에 생긴 환불은 다음 정산의 음수 항목이 된다.
create or replace function public.settlement_create(p_payee uuid, p_start date, p_end date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_from timestamptz := (p_start::timestamp at time zone 'Asia/Seoul');
  v_to timestamptz := ((p_end + 1)::timestamp at time zone 'Asia/Seoul');
begin
  if not public.has_platform_permission('commerce') then raise exception 'forbidden'; end if;

  create temporary table _items on commit drop as
    select o.id as order_id, null::uuid as refund_id, o.amount,
           round(o.amount * o.fee_rate)::integer as fee_amount
    from public.orders o
    where o.payee_user_id = p_payee
      and o.status in ('paid', 'refunded', 'partially_refunded')
      and o.confirmed_at >= v_from and o.confirmed_at < v_to
      and not exists (select 1 from public.settlement_items i where i.order_id = o.id)
    union all
    select null, r.id, -r.amount, -round(r.amount * o.fee_rate)::integer
    from public.refunds r
    join public.orders o on o.id = r.order_id
    where o.payee_user_id = p_payee
      and r.status in ('approved', 'paid') and r.amount > 0
      and r.processed_at >= v_from and r.processed_at < v_to
      and not exists (select 1 from public.settlement_items i where i.refund_id = r.id);

  if not exists (select 1 from _items) then raise exception 'nothing_to_settle'; end if;

  insert into public.settlements (payee_user_id, period_start, period_end, gross_amount,
    refund_amount, fee_amount, payout_amount, created_by)
  select p_payee, p_start, p_end,
    coalesce(sum(amount) filter (where amount > 0), 0),
    coalesce(-sum(amount) filter (where amount < 0), 0),
    coalesce(sum(fee_amount), 0),
    coalesce(sum(amount), 0) - coalesce(sum(fee_amount), 0),
    auth.uid()
  from _items
  returning id into v_id;

  insert into public.settlement_items (settlement_id, order_id, refund_id, amount, fee_amount)
  select v_id, order_id, refund_id, amount, fee_amount from _items;

  perform public._write_audit('settlement.created', null, p_payee,
    jsonb_build_object('period', p_start || '~' || p_end));
  return v_id;
end;
$$;

create or replace function public.settlement_mark_paid(p_settlement uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payee uuid;
begin
  if not public.has_platform_permission('commerce') then raise exception 'forbidden'; end if;
  update public.settlements set status = 'paid', paid_at = now(), processed_by = auth.uid()
    where id = p_settlement and status = 'scheduled'
    returning payee_user_id into v_payee;
  if v_payee is null then raise exception 'settlement_not_scheduled'; end if;
  perform public._write_audit('settlement.paid', null, v_payee, '{}');
end;
$$;

-- ─────────────────────────────────────────────────────────── 실행 권한
revoke execute on function public._write_audit(text, uuid, uuid, jsonb, uuid) from public, anon, authenticated;
revoke execute on function public._confirm_participation(uuid, uuid) from public, anon, authenticated;
revoke execute on function public._start_payment(uuid, text) from public, anon, authenticated;
revoke execute on function public._promote_waitlist(uuid) from public, anon, authenticated;
revoke execute on function public._release_participation(uuid, text) from public, anon, authenticated;
revoke execute on function public.participation_apply(uuid, jsonb, text) from public, anon;
revoke execute on function public.order_confirm_payment(uuid) from public, anon;
revoke execute on function public.orders_expire_overdue() from public, anon;
revoke execute on function public.refund_quote(uuid) from public, anon;
revoke execute on function public.refund_request(uuid, text) from public, anon;
revoke execute on function public.refund_decide(uuid, boolean, text) from public, anon;
revoke execute on function public.refund_mark_paid(uuid) from public, anon;
revoke execute on function public.settlement_create(uuid, date, date) from public, anon;
revoke execute on function public.settlement_mark_paid(uuid) from public, anon;
