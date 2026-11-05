-- 플랫폼 시험장 3단계: 시즌(다회차)과 챌린지
-- 시즌: 참가는 시즌 행에 한 번, 출석은 회차(series_id로 묶인 모임)마다. 시즌 일정은 회차에서 자동 계산.
-- 챌린지: 기간 · 인증 규칙 · 미션. 인증은 한국 시간 그날 안에만, 올리면 바로 인정, 진행자가 반려.
-- 종료하면 완주 / 미완주를 판정한다.
-- 설계 정본: docs/architecture/platform-db-design.md 6절, 명세 6·7절.

alter table public.activities add column allow_late_join boolean not null default false;
alter table public.participations
  add column outcome text check (outcome in ('completed', 'incomplete'));

-- ─────────────────────────────────────────────────────────── 챌린지 테이블
create table public.challenge_details (
  activity_id uuid primary key references public.activities (id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  cert_rule text not null check (cert_rule in ('daily', 'weekly_n', 'total_n')),
  cert_n integer check (cert_n is null or cert_n > 0),
  cert_formats text[] not null default array['text']
    check (cert_formats <@ array['text', 'photo', 'link']::text[] and cardinality(cert_formats) > 0),
  completion_threshold integer not null check (completion_threshold > 0),
  certs_visibility text not null default 'participants' check (certs_visibility in ('participants', 'hosts')),
  check (ends_on >= starts_on),
  check (cert_rule = 'daily' or cert_n is not null)
);

create table public.challenge_missions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  day_no integer check (day_no is null or day_no > 0), -- null이면 자유 미션
  title text not null,
  body text,
  unique (activity_id, day_no)
);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  mission_id uuid references public.challenge_missions (id),
  cert_date date not null,
  body text,
  link text,
  status text not null default 'accepted' check (status in ('accepted', 'rejected')),
  rejected_by uuid references public.profiles (id),
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, user_id, cert_date),
  check (coalesce(body, '') <> '' or coalesce(link, '') <> '')
);
create trigger certifications_touch before update on public.certifications
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────── 공통 일정 열 채우기
create or replace function public._kst_today()
returns date
language sql
stable
set search_path = ''
as $$ select (now() at time zone 'Asia/Seoul')::date; $$;

-- 챌린지: 시작일 한국 0시 ~ 종료일 다음 날 한국 0시
create or replace function public._sync_challenge_schedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.activities
    set starts_at = (new.starts_on::timestamp at time zone 'Asia/Seoul'),
        ends_at = ((new.ends_on + 1)::timestamp at time zone 'Asia/Seoul')
    where id = new.activity_id;
  return new;
end;
$$;
create trigger challenge_schedule_sync after insert or update of starts_on, ends_on
  on public.challenge_details for each row execute function public._sync_challenge_schedule();

-- 시즌: 취소되지 않은 회차의 처음 ~ 끝
create or replace function public._sync_series_schedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_series uuid := coalesce(new.series_id, old.series_id);
begin
  if v_series is null then return coalesce(new, old); end if;
  update public.activities s
    set starts_at = x.first_start, ends_at = x.last_end
    from (
      select min(starts_at) as first_start, max(coalesce(ends_at, starts_at)) as last_end
      from public.activities
      where series_id = v_series and status <> 'cancelled'
    ) x
    where s.id = v_series;
  return coalesce(new, old);
end;
$$;
create trigger series_schedule_sync after insert or update of starts_at, ends_at, status, series_id or delete
  on public.activities for each row
  when (pg_trigger_depth() < 1)
  execute function public._sync_series_schedule();

-- 시즌 행은 회차가 생기기 전엔 일정이 비어 있다. 공개 조건(일정 필수)은 회차가 있을 때만 의미가 있다.
alter table public.activities drop constraint activities_check3;
alter table public.activities add constraint activities_open_needs_schedule
  check (status = 'draft' or starts_at is not null or kind = 'series');

-- ─────────────────────────────────────────────────────────── 권한 판정: 회차는 시즌을 따른다
create or replace function public.can_manage_activity(p_activity uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.activities a
    where a.id = p_activity
      and (
        exists (
          select 1 from public.activity_hosts h
          where h.activity_id in (a.id, a.series_id) and h.user_id = auth.uid()
        )
        or (a.organizer_kind = 'host' and a.created_by = auth.uid())
        or (a.organizer_kind = 'club' and public.club_has_permission(a.club_id, 'participant.manage'))
        or (a.organizer_kind = 'official' and public.has_platform_permission('community'))
      )
  );
$$;

-- 참가 확정 여부: 회차는 시즌 참가로 판정한다.
create or replace function public.is_confirmed_participant(p_activity uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.activities a
    join public.participations p on p.activity_id = coalesce(a.series_id, a.id)
    where a.id = p_activity and p.user_id = p_user and p.status = 'confirmed'
  );
$$;

-- ─────────────────────────────────────────────────────────── 읽기 정책
alter table public.challenge_details enable row level security;
alter table public.challenge_missions enable row level security;
alter table public.certifications enable row level security;

create policy challenge_details_read on public.challenge_details for select
  using (public.can_read_activity(activity_id));
create policy challenge_missions_read on public.challenge_missions for select
  using (public.can_read_activity(activity_id));
create policy certifications_read on public.certifications for select
  using (
    user_id = auth.uid()
    or public.can_manage_activity(activity_id)
    or (
      public.is_confirmed_participant(activity_id, auth.uid())
      and exists (
        select 1 from public.challenge_details d
        where d.activity_id = certifications.activity_id and d.certs_visibility = 'participants'
      )
    )
  );
-- 회차 출석은 시즌 참가자 본인과 진행자가 본다(1단계 정책 그대로, 회차도 can_manage를 따른다).

revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- ─────────────────────────────────────────────────────────── 참가 신청: 중도 합류
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
  -- 시작 후 신청은 기본으로 막는다. 주최자가 중도 합류를 허용하면 진행 중에도 받는다.
  if not (v_act.status = 'open' or (v_act.status = 'in_progress' and v_act.allow_late_join)) then
    raise exception 'not_open';
  end if;
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

-- ─────────────────────────────────────────────────────────── 회차 출석
create or replace function public.attendance_mark(p_activity uuid, p_user uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_act public.activities;
begin
  if not public.can_manage_activity(p_activity) then raise exception 'forbidden'; end if;
  if p_status not in ('attended', 'absent') then raise exception 'invalid_status'; end if;
  select * into v_act from public.activities where id = p_activity;
  if v_act.kind <> 'gathering' then raise exception 'not_gathering'; end if;
  if now() < v_act.starts_at - interval '1 hour' then raise exception 'too_early_to_check'; end if;
  -- 회차면 시즌 참가자인지 본다.
  if not public.is_confirmed_participant(p_activity, p_user) then raise exception 'not_confirmed'; end if;

  insert into public.attendances (gathering_id, user_id, status, checked_by)
  values (p_activity, p_user, p_status, auth.uid())
  on conflict (gathering_id, user_id)
    do update set status = excluded.status, checked_by = excluded.checked_by, checked_at = now();
  perform public._write_audit('attendance.marked', p_activity, p_user, jsonb_build_object('status', p_status));
end;
$$;

-- 참가자 전용 정보: 회차는 시즌 확정 참가자에게 열린다.
create or replace function public.get_activity_private(p_activity uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_act public.activities;
  v_priv public.activity_private;
  v_manager boolean;
  v_link_open boolean;
begin
  if auth.uid() is null or not public.can_read_activity(p_activity) then
    return jsonb_build_object('access', 'none');
  end if;
  select * into v_act from public.activities where id = p_activity;
  select * into v_priv from public.activity_private where activity_id = p_activity;
  v_manager := public.can_manage_activity(p_activity);
  if not v_manager and not public.is_confirmed_participant(p_activity, auth.uid()) then
    return jsonb_build_object('access', 'none');
  end if;
  v_link_open := v_manager or now() >= v_act.starts_at - interval '30 minutes';
  return jsonb_build_object(
    'access', case when v_manager then 'manager' else 'participant' end,
    'address_detail', v_priv.address_detail,
    'video_url', case when v_link_open then v_priv.video_url end,
    'video_opens_at', v_act.starts_at - interval '30 minutes'
  );
end;
$$;

-- ─────────────────────────────────────────────────────────── 챌린지 인증
-- 오늘(한국 시간) 인증을 올리거나 같은 날 고친다. 지난 날은 고칠 수 없다.
create or replace function public.certification_submit(
  p_activity uuid, p_body text default null, p_link text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_d public.challenge_details;
  v_today date := public._kst_today();
  v_mission uuid;
  v_existing public.certifications;
begin
  if auth.uid() is null then raise exception 'auth_required'; end if;
  select * into v_d from public.challenge_details where activity_id = p_activity;
  if not found then raise exception 'not_challenge'; end if;
  if not public.is_confirmed_participant(p_activity, auth.uid()) then raise exception 'not_confirmed'; end if;
  if v_today < v_d.starts_on or v_today > v_d.ends_on then raise exception 'outside_period'; end if;
  if exists (select 1 from public.activities where id = p_activity and status in ('ended', 'cancelled')) then
    raise exception 'activity_finished';
  end if;
  if coalesce(trim(p_body), '') = '' and coalesce(trim(p_link), '') = '' then raise exception 'empty_cert'; end if;
  if coalesce(trim(p_body), '') <> '' and not ('text' = any (v_d.cert_formats)) then raise exception 'format_not_allowed'; end if;
  if coalesce(trim(p_link), '') <> '' and not ('link' = any (v_d.cert_formats)) then raise exception 'format_not_allowed'; end if;
  if coalesce(trim(p_link), '') <> '' and p_link !~ '^https?://' then raise exception 'invalid_link'; end if;

  select id into v_mission from public.challenge_missions
    where activity_id = p_activity and (day_no = v_today - v_d.starts_on + 1 or day_no is null)
    order by day_no nulls last limit 1;

  select * into v_existing from public.certifications
    where activity_id = p_activity and user_id = auth.uid() and cert_date = v_today for update;
  if found and v_existing.status = 'rejected' then raise exception 'cert_rejected'; end if;

  insert into public.certifications (activity_id, user_id, mission_id, cert_date, body, link)
  values (p_activity, auth.uid(), v_mission, v_today, nullif(trim(p_body), ''), nullif(trim(p_link), ''))
  on conflict (activity_id, user_id, cert_date)
    do update set body = excluded.body, link = excluded.link;
end;
$$;

create or replace function public.certification_reject(p_cert uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cert public.certifications;
begin
  select * into v_cert from public.certifications where id = p_cert for update;
  if not found then raise exception 'not_found'; end if;
  if not public.can_manage_activity(v_cert.activity_id) then raise exception 'forbidden'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason_required'; end if;
  update public.certifications
    set status = 'rejected', rejected_by = auth.uid(), rejected_reason = trim(p_reason)
    where id = p_cert;
  perform public._write_audit('certification.rejected', v_cert.activity_id, v_cert.user_id,
    jsonb_build_object('date', v_cert.cert_date, 'reason', trim(p_reason)));
end;
$$;

-- 진행 현황: 확정 참가자별 인정된 인증 수. 인증 공개 범위와 상관없이 숫자는 참가자에게 보인다.
create or replace function public.challenge_progress(p_activity uuid)
returns table (user_id uuid, nickname text, accepted integer, outcome text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.user_id, pr.nickname::text,
    (select count(*)::integer from public.certifications c
      where c.activity_id = p.activity_id and c.user_id = p.user_id and c.status = 'accepted'),
    p.outcome
  from public.participations p
  join public.profiles pr on pr.id = p.user_id
  where p.activity_id = p_activity and p.status = 'confirmed'
    and (public.can_manage_activity(p_activity) or public.is_confirmed_participant(p_activity, auth.uid()))
  order by 3 desc, pr.nickname;
$$;

-- 종료하고 완주를 판정한다. 종료일이 지나야 한다.
create or replace function public.challenge_finalize(p_activity uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_d public.challenge_details;
  v_completed integer;
begin
  if not public.can_manage_activity(p_activity) then raise exception 'forbidden'; end if;
  select * into v_d from public.challenge_details where activity_id = p_activity;
  if not found then raise exception 'not_challenge'; end if;
  if public._kst_today() <= v_d.ends_on then raise exception 'not_ended_yet'; end if;
  if exists (select 1 from public.activities where id = p_activity and status in ('ended', 'cancelled')) then
    raise exception 'activity_finished';
  end if;

  update public.participations p
    set outcome = case
      when (select count(*) from public.certifications c
            where c.activity_id = p.activity_id and c.user_id = p.user_id and c.status = 'accepted')
           >= v_d.completion_threshold then 'completed' else 'incomplete' end
    where p.activity_id = p_activity and p.status = 'confirmed';
  update public.activities set status = 'ended' where id = p_activity;

  select count(*) into v_completed from public.participations
    where activity_id = p_activity and outcome = 'completed';
  perform public._write_audit('challenge.finalized', p_activity, null,
    jsonb_build_object('completed', v_completed));
  return v_completed;
end;
$$;

-- 시즌 출석률: 이미 시작한 회차 기준. 진행자와 본인이 본다.
create or replace function public.series_attendance(p_series uuid)
returns table (user_id uuid, nickname text, attended integer, held integer)
language sql
stable
security definer
set search_path = ''
as $$
  with held as (
    select id from public.activities
    where series_id = p_series and status <> 'cancelled' and starts_at <= now()
  )
  select p.user_id, pr.nickname::text,
    (select count(*)::integer from public.attendances a
      where a.gathering_id in (select id from held) and a.user_id = p.user_id and a.status = 'attended'),
    (select count(*)::integer from held)
  from public.participations p
  join public.profiles pr on pr.id = p.user_id
  where p.activity_id = p_series and p.status = 'confirmed'
    and (public.can_manage_activity(p_series) or p.user_id = auth.uid())
  order by pr.nickname;
$$;

revoke execute on function public.certification_submit(uuid, text, text) from public, anon;
revoke execute on function public.certification_reject(uuid, text) from public, anon;
revoke execute on function public.challenge_finalize(uuid) from public, anon;
revoke execute on function public._sync_challenge_schedule() from public, anon, authenticated;
revoke execute on function public._sync_series_schedule() from public, anon, authenticated;
